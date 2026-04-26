import readline from 'readline';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { generateGeminiResponse } from '../apps/api/src/services/gemini-v2.js';
import type { Tenant } from '../packages/shared/src/types.js';

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

// Listar tenants disponíveis
async function listarTenants(supabaseUrl: string, supabaseKey: string): Promise<Tenant[]> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('ativo', true);

  if (error) {
    console.error('❌ Erro ao listar tenants:', error.message);
    return [];
  }

  return (data as Tenant[]) || [];
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

async function iniciarChat(tenant: Tenant, telefoneCliente: string, ehNovo: boolean): Promise<void> {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log(`║  🤖 CHAT - ${tenant.nome.padEnd(42)} ║`);
  console.log(`║  Cliente: ${telefoneCliente.substring(0, 25).padEnd(25)} ${ehNovo ? '(NOVO)' : '(EXISTENTE)'}      ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('✅ Usando generateGeminiResponse do gemini-v2.ts\n');

  const supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  // Criar cliente se for novo
  if (ehNovo) {
    const { data: existente } = await supabase
      .from('clientes')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('telefone', telefoneCliente)
      .single();

    if (!existente) {
      await supabase.from('clientes').insert({
        tenant_id: tenant.id,
        telefone: telefoneCliente,
        nome: 'Cliente Teste',
        preferencias: {},
        historico_servicos: []
      });
      console.log('👤 Cliente criado no banco\n');
    }
  }

  // Buscar histórico de mensagens
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('telefone', telefoneCliente)
    .single();

  if (cliente) {
    const { data: conversa } = await supabase
      .from('conversas')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('cliente_id', cliente.id)
      .single();

    if (conversa) {
      const { data: mensagens } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversa.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (mensagens && mensagens.length > 0) {
        console.log(`📝 Histórico: ${mensagens.length} mensagens recentes\n`);
        mensagens.reverse().forEach((msg) => {
          const prefixo = msg.tipo === 'inbound' ? '👤' : '🤖';
          const texto = msg.conteudo.substring(0, 60) + (msg.conteudo.length > 60 ? '...' : '');
          console.log(`${prefixo} ${texto}`);
        });
        console.log('────────────────────────────────────────\n');
      }
    }
  }

  // Loop de conversa
  while (true) {
    const entrada = await perguntar('👤 Cliente: ');
    const texto = entrada.trim();

    if (texto.toLowerCase() === 'sair') {
      console.log('\n🤖 Secretária: Obrigada! Até logo...');
      rl.close();
      process.exit(0);
    }

    if (!texto) continue;

    try {
      console.log('⏳ Processando...');

      const resposta = await generateGeminiResponse(
        supabase,
        env as unknown as import('../packages/shared/src/types.js').Env,
        tenant.id,
        telefoneCliente,
        texto,
        'Cliente Teste'
      );

      console.log(`\n🤖 Secretária: ${resposta.texto}\n`);

      if (resposta.action) {
        console.log(`⚡ Ação detectada: ${resposta.action.tipo}`);
        console.log(`   Payload: ${JSON.stringify(resposta.action.payload)}\n`);
      }
    } catch (erro) {
      console.error('\n❌ Erro:', erro instanceof Error ? erro.message : erro);
      console.log();
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  👤 TESTAR CLIENTE - Gemini V2                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Listar tenants disponíveis
    const tenants = await listarTenants(env.SUPABASE_URL, env.SUPABASE_KEY);
    if (tenants.length === 0) {
      console.log('❌ Nenhum tenant encontrado. Rode: npm run test:onboarding');
      rl.close();
      process.exit(1);
    }

    console.log('Tenants disponíveis:\n');
    tenants.forEach((t: Tenant, i: number) => {
      console.log(`  ${i + 1}. ${t.nome} (${t.configuracoes.catalogo_servicos.length} serviços)`);
    });

    const escolha = await perguntar('\nEscolha o tenant (número): ');
    const idx = parseInt(escolha) - 1;

    if (idx < 0 || idx >= tenants.length) {
      console.log('❌ Escolha inválida');
      rl.close();
      process.exit(1);
    }

    const tenant = tenants[idx];
    if (!tenant) {
      console.log('❌ Erro ao selecionar tenant');
      rl.close();
      process.exit(1);
    }

    // Perguntar se cliente é novo ou existente
    console.log('\n🤔 O cliente é:');
    console.log('  1. Novo (sem histórico)');
    console.log('  2. Existente (com histórico salvo)');
    const tipoCliente = await perguntar('Escolha (1 ou 2): ');
    const ehNovo = tipoCliente === '1';

    // Telefone do cliente
    const telefoneInput = await perguntar('\n📱 Telefone do cliente (ex: 5511999999999): ');
    const telefone = telefoneInput.trim() || (ehNovo ? '5511999999991' : '5511999999992');

    await iniciarChat(tenant, telefone, ehNovo);
  } catch (erro) {
    console.error('Erro fatal:', erro);
    rl.close();
    process.exit(1);
  }
}

main();
