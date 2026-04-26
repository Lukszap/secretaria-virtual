import readline from 'readline';
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

config();

// Types
interface ConfigClinica {
  nomeClinica: string;
  enderecoHorario: string;
  servicosPrecos: string;
  regrasPagamento: string;
  limitesMedicos: string;
  dadosAgendamento: string;
  perfilNegociacao: 'Equilibrado' | 'Duro' | 'Facil';
  brindesDescontos: string;
  servicosComplementares: string;
  restricoesAgenda: string;
}

interface Conversa {
  id: string;
  cliente_wa_id: string;
  clinica_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

// Gemini functions (copiadas para standalone)
function getRegrasNegociacao(perfil: string, brindes: string): string {
  if (perfil === 'Equilibrado') {
    return `
⚖️ NÍVEL DE NEGOCIAÇÃO - EQUILIBRADO:
- NO PRIMEIRO pedido de desconto: NEGUE educadamente.
- Frase: "Entendo, mas esse valor já reflete nossa qualidade premium."
- SÓ cede na SEGUNDA insistência, com ${brindes}.
- Frase mágica: "Vejo que você gostou! Tenho uma condição especial: ${brindes}. Posso garantir isso agora?"`;
  } else if (perfil === 'Duro') {
    return `
🛡️ NÍVEL DE NEGOCIAÇÃO - DURO:
- NUNCA dê desconto direto.
- SEMPRE consulte a "gerência".
- Frase: "Vou verificar com minha gerente o que posso fazer especial para você."
- Máximo: ${brindes} como cortesia, nunca desconto em dinheiro.`;
  } else {
    return `
🎁 NÍVEL DE NEGOCIAÇÃO - FÁCIL:
- Ofereça ${brindes} DE CARA, sem esperar pedido.
- Frase: "Gostei do seu interesse! Já vou incluir ${brindes} para você!"
- Dê desconto de 5% se insistir.`;
  }
}

function compilarPrompt(config: ConfigClinica): string {
  const regrasNegociacao = getRegrasNegociacao(config.perfilNegociacao, config.brindesDescontos);

  return `
Você é a secretária virtual da ${config.nomeClinica}.

📍 LOCAL E HORÁRIO:
${config.enderecoHorario}

💰 SERVIÇOS E PREÇOS:
${config.servicosPrecos}

💳 PAGAMENTO:
${config.regrasPagamento}

⚕️ LIMITES MÉDICOS:
${config.limitesMedicos}

📋 DADOS PARA AGENDAMENTO:
${config.dadosAgendamento}

${regrasNegociacao}

🎯 SERVIÇOS COMPLEMENTARES (venda cruzada):
${config.servicosComplementares}

⚠️ RESTRIÇÕES DE AGENDA:
${config.restricoesAgenda}

---
REGRAS GERAIS:
1. Seja calorosa e profissional
2. Sempre confirme disponibilidade antes de marcar
3. Colete dados completos antes de agendar
4. Use as regras de negociação acima
5. Nunca prometa descontos além do permitido
6. Redirecione emergências médicas
`;
}

// Supabase functions (standalone)
async function criarClinica(nome: string, promptBase: string, perfil: string, supabaseUrl: string, supabaseKey: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      nome,
      prompt_base: promptBase,
      perfil_negociacao: perfil,
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Erro ao criar clínica:', error.message);
    return null;
  }

  return data?.id || null;
}

async function buscarHistoricoConversa(clienteWaId: string, clinicaId: string, supabaseUrl: string, supabaseKey: string): Promise<Conversa[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('conversas')
    .select('id, cliente_wa_id, clinica_id, role, content, created_at')
    .eq('cliente_wa_id', clienteWaId)
    .eq('clinica_id', clinicaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    return [];
  }

  return data || [];
}

async function salvarMensagem(clienteWaId: string, clinicaId: string, role: 'user' | 'model', content: string, supabaseUrl: string, supabaseKey: string): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from('conversas')
    .insert({
      cliente_wa_id: clienteWaId,
      clinica_id: clinicaId,
      role,
      content,
    });

  if (error) {
    console.error('❌ Erro ao salvar mensagem:', error.message);
  }
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

// ID do cliente para teste (simulando WhatsApp)
const CLIENTE_TESTE_ID = 'cliente-teste-001';

async function faseSetup(): Promise<ConfigClinica> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🏥 SETUP - Configuração da Vendedora de Elite          ║');
  console.log('║  Configure as estratégias de vendas do seu bot          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const nomeClinica = await perguntar('1️⃣  Nome da Clínica: ');
  const enderecoHorario = await perguntar('2️⃣  Endereço e Horário (ex: Rua X, 123. Seg-Sex 9h-18h): ');
  const servicosPrecos = await perguntar('3️⃣  Serviços e Preços (ex: Botox R$800, Limpeza R$150): ');
  const regrasPagamento = await perguntar('4️⃣  Regras de Pagamento (ex: Pix 5%, cartão 3x): ');

  console.log('\n📊 Perfil de Negociação:');
  console.log('  - Equilibrado: Nega 1º desconto, só cede na 2ª insistência');
  console.log('  - Duro: Nunca dá desconto, consulta gerência');
  console.log('  - Facil: Oferece brinde de cara');
  let perfilNegociacao = await perguntar('5️⃣  Escolha (Equilibrado/Duro/Facil): ') as 'Equilibrado' | 'Duro' | 'Facil';

  // Validação simples
  if (!['Equilibrado', 'Duro', 'Facil'].includes(perfilNegociacao)) {
    console.log('⚠️  Opção inválida, usando Equilibrado');
    perfilNegociacao = 'Equilibrado';
  }

  const brindesDescontos = await perguntar('6️⃣  Brindes/Descontos disponíveis (ex: Hidratação grátis, 10% na 2ª sessão): ');
  const limitesMedicos = await perguntar('7️⃣  Limites Médicos (ex: Não atende grávidas, emergência = encaminhar): ');
  const restricoesAgenda = await perguntar('8️⃣  Restrições de Agendamento (ex: Gravida? Sol recente? Alergia?): ');
  const dadosAgendamento = await perguntar('9️⃣  Dados Obrigatórios p/ Agendamento (ex: Nome, serviço, dia): ');
  const servicosComplementares = await perguntar('🔟 Serviços para Venda Cruzada (ex: Hidratação R$50, Upgrade VIP): ');

  return {
    nomeClinica,
    enderecoHorario,
    servicosPrecos,
    regrasPagamento,
    limitesMedicos,
    dadosAgendamento,
    perfilNegociacao,
    brindesDescontos,
    servicosComplementares,
    restricoesAgenda,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function faseTeste(systemInstruction: string, clinicaId: string): Promise<void> {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🤖 MODO CLIENTE - Testando a IA                        ║');
  console.log(`║  Clínica ID: ${clinicaId}                          ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('✅ Bot configurado! Digite como se fosse um cliente testando a clínica (ou digite "sair"):\n');

  // Buscar histórico anterior (se existir)
  const historico = await buscarHistoricoConversa(
    CLIENTE_TESTE_ID,
    clinicaId,
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
  if (historico.length > 0) {
    console.log(`📝 Carregadas ${historico.length} mensagens do histórico\n`);
  }

  // Preparar histórico para o Gemini
  const history = historico.map((msg: { role: string; content: string }) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // Criar cliente Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não definida');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.2 },
    systemInstruction,
  });

  // Iniciar chat com histórico (se houver)
  const chatParams = history.length > 0 ? { history } : undefined;
  const chat = model.startChat(chatParams);

  while (true) {
    const entrada = await perguntar('👤 Cliente: ');
    const texto = entrada.trim();

    if (texto.toLowerCase() === 'sair') {
      console.log('\n🤖 Secretária: Obrigada! Encerrando teste...');
      rl.close();
      process.exit(0);
    }

    if (!texto) continue;

    try {
      // 1. Salvar mensagem do usuário
      console.log('⏳ digitando...');
      await salvarMensagem(CLIENTE_TESTE_ID, clinicaId, 'user', texto, process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

      // 2. Enviar para Gemini
      const result = await chat.sendMessage(texto);
      const resposta = result.response.text();

      // 3. Salvar resposta da IA
      await salvarMensagem(CLIENTE_TESTE_ID, clinicaId, 'model', resposta, process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

      console.log(`\n🤖 Secretária: ${resposta}\n`);
    } catch (erro) {
      console.error('\n❌ Erro:', erro instanceof Error ? erro.message : erro);
      console.log();
    }
  }
}

async function main(): Promise<void> {
  try {
    const config = await faseSetup();
    const systemInstruction = compilarPrompt(config);

    // Salvar clínica no Supabase
    console.log('\n💾 Salvando clínica no banco de dados...');
    const clinicaId = await criarClinica(
      config.nomeClinica,
      systemInstruction,
      config.perfilNegociacao,
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );

    if (!clinicaId) {
      throw new Error('Falha ao salvar clínica no Supabase');
    }

    console.log(`✅ Clínica salva! ID: ${clinicaId}`);

    // Iniciar teste com a clínica criada
    await faseTeste(systemInstruction, clinicaId);
  } catch (erro) {
    console.error('Erro fatal:', erro);
    rl.close();
    process.exit(1);
  }
}

main();
