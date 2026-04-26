import readline from 'readline';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Tenant, ConfiguracoesTenant } from '../packages/shared/src/types.js';

config({ path: '.dev.vars' });

const env = process.env as unknown as { 
  SUPABASE_URL: string; 
  SUPABASE_KEY: string; 
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_API_KEY: string 
};

// Criar client Supabase com service role key (bypass RLS) ou anon key
function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  return createClient(supabaseUrl, key);
}

// Tipos para configuração via CLI
interface ConfigClinicaInput {
  nomeClinica: string;
  slug: string;
  endereco: string;
  horarioFuncionamento: string;
  servicos: string;
  profissionais: string;
  regrasNegocio: string;
  mensagensPadrao: string;
}

// Parser de serviços
function parseServicos(input: string): ConfiguracoesTenant['catalogo_servicos'] {
  const servicos: ConfiguracoesTenant['catalogo_servicos'] = [];
  const linhas = input.split('|').filter(s => s.trim());
  
  linhas.forEach((linha, idx) => {
    const partes = linha.trim().split(' ');
    if (partes.length >= 2) {
      const nome = partes.slice(0, -1).join(' ').replace(/R\$\d+/, '').trim();
      const precoMatch = linha.match(/R\$(\d+)/);
      const preco = precoMatch ? parseInt(precoMatch[1]!) : 50 + (idx * 20);
      const duracaoMatch = linha.match(/(\d+)min/);
      const duracao = duracaoMatch ? parseInt(duracaoMatch[1]!) : 30;
      const slug = linha.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
      
      servicos.push({
        slug: slug || `servico-${idx}`,
        nome: nome || `Serviço ${idx + 1}`,
        preco,
        duracao_minutos: duracao,
        categoria: 'geral',
        profissionais_habilitados: [],
        ativo: true
      });
    }
  });
  
  return servicos.length > 0 ? servicos : [{
    slug: 'consulta-padrao',
    nome: 'Consulta Padrão',
    preco: 100,
    duracao_minutos: 60,
    categoria: 'geral',
    profissionais_habilitados: [],
    ativo: true
  }];
}

// Parser de profissionais
function parseProfissionais(input: string): ConfiguracoesTenant['profissionais'] {
  const profs: ConfiguracoesTenant['profissionais'] = [];
  const nomes = input.split(',').filter(s => s.trim());
  
  nomes.forEach((nome, idx) => {
    const nomeTrim = nome.trim();
    if (nomeTrim) {
      profs.push({
        id: `prof-${idx + 1}`,
        nome: nomeTrim,
        especialidades: [],
        ativo: true
      });
    }
  });
  
  return profs.length > 0 ? profs : [{
    id: 'prof-1',
    nome: 'Profissional Padrão',
    especialidades: [],
    ativo: true
  }];
}

// Parser de horário
function parseHorario(input: string): ConfiguracoesTenant['horario_funcionamento'] {
  const padrao = {
    seg: { abre: '09:00', fecha: '18:00', aberto: true },
    ter: { abre: '09:00', fecha: '18:00', aberto: true },
    qua: { abre: '09:00', fecha: '18:00', aberto: true },
    qui: { abre: '09:00', fecha: '18:00', aberto: true },
    sex: { abre: '09:00', fecha: '18:00', aberto: true },
    sab: { abre: '09:00', fecha: '13:00', aberto: true },
    dom: { abre: '09:00', fecha: '18:00', aberto: false }
  };
  
  const match = input.match(/(\d+)h-(\d+)h/);
  if (match && match[1] && match[2]) {
    const abre = `${match[1].padStart(2, '0')}:00`;
    const fecha = `${match[2].padStart(2, '0')}:00`;
    Object.keys(padrao).forEach(dia => {
      if (dia !== 'dom') {
        padrao[dia as keyof typeof padrao].abre = abre;
        padrao[dia as keyof typeof padrao].fecha = fecha;
      }
    });
  }
  
  return padrao;
}

// Criar tenant com configurações estruturadas
async function criarTenant(
  input: ConfigClinicaInput,
  supabaseUrl: string,
  supabaseKey: string
): Promise<Tenant | null> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  
  const configuracoes: ConfiguracoesTenant = {
    catalogo_servicos: parseServicos(input.servicos),
    profissionais: parseProfissionais(input.profissionais),
    horario_funcionamento: parseHorario(input.horarioFuncionamento),
    regras_negocio: {
      tolerancia_atraso_minutos: 15,
      exige_sinal_pix: false,
      percentual_sinal: 30,
      cancelamento_antecedencia_horas: 24,
      tempo_minimo_entre_agendamentos_minutos: 0,
      permite_agendamento_futuro_dias: 60
    },
    mensagens_padrao: {
      saudacao: `Olá! Sou a assistente virtual do ${input.nomeClinica}. Como posso ajudar?`,
      confirmacao_agendamento: 'Agendamento confirmado! Te aguardo no horário marcado.',
      lembrete: 'Lembrete: Você tem agendamento amanhã.',
      fallback_ia: 'Desculpe, não entendi. Pode reformular?'
    }
  };
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      nome: input.nomeClinica,
      slug: input.slug,
      configuracoes,
      plano: 'basico',
      limite_mensagens_mes: 1000,
      mensagens_usadas_mes: 0,
      limite_agendamentos_mes: 100,
      ativo: true
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ Erro ao criar tenant:', error.message);
    return null;
  }

  return data as Tenant;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function perguntar(texto: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(texto, resolve);
  });
}

async function faseSetup(): Promise<ConfigClinicaInput> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🏥 CRIAR NOVO TENANT - Secretária Virtual v2          ║');
  console.log('║  Schema: tenants + configuracoes JSONB                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const nomeClinica = await perguntar('1️⃣  Nome do Salão/Clínica: ');
  const slug = nomeClinica.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
  const endereco = await perguntar('2️⃣  Endereço: ');
  const horarioFuncionamento = await perguntar('3️⃣  Horário (ex: Seg-Sex 9h-18h, Sab 9h-13h): ');
  
  console.log('\n� Formato de serviços: Nome R$XX XXmin (separados por |)');
  console.log('   Ex: Corte Feminino R$80 60min|Manicure R$40 30min');
  const servicos = await perguntar('4️⃣  Serviços oferecidos: ');
  
  const profissionais = await perguntar('5️⃣  Profissionais (nomes separados por vírgula): ');
  const regrasNegocio = await perguntar('6️⃣  Regras especiais (opcional): ');
  const mensagensPadrao = await perguntar('7️⃣  Saudação personalizada (opcional): ');

  return {
    nomeClinica,
    slug,
    endereco,
    horarioFuncionamento,
    servicos,
    profissionais,
    regrasNegocio,
    mensagensPadrao
  };
}

async function main(): Promise<void> {
  try {
    const config = await faseSetup();

    // Salvar tenant no Supabase
    console.log('\n💾 Salvando tenant no banco de dados...');
    const tenant = await criarTenant(config, env.SUPABASE_URL, env.SUPABASE_KEY);

    if (!tenant) {
      throw new Error('Falha ao salvar tenant no Supabase');
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TENANT CRIADO COM SUCESSO!                        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Nome: ${tenant.nome.padEnd(46)} ║`);
    console.log(`║  ID: ${tenant.id.padEnd(48)} ║`);
    console.log(`║  Slug: ${tenant.slug.padEnd(46)} ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n� Configurações salvas:');
    console.log(`   - Serviços: ${tenant.configuracoes.catalogo_servicos.length}`);
    console.log(`   - Profissionais: ${tenant.configuracoes.profissionais.length}`);
    console.log(`   - Plano: ${tenant.plano}`);
    console.log('\n💡 Para testar, rode: npm run test:cliente');

    rl.close();
    process.exit(0);
  } catch (erro) {
    console.error('Erro fatal:', erro);
    rl.close();
    process.exit(1);
  }
}

main();
