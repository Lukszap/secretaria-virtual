import readline = require('readline');
import dotenv = require('dotenv');
import genai = require('@google/generative-ai');
import gemini = require('../src/ia/gemini');
import db = require('../src/db/supabase');
const { compilarPrompt } = gemini;
const { criarClinica, buscarHistoricoConversa, salvarMensagem } = db;

dotenv.config();

const { GoogleGenerativeAI } = genai;

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
  const historico = await buscarHistoricoConversa(CLIENTE_TESTE_ID, clinicaId);
  if (historico.length > 0) {
    console.log(`📝 Carregadas ${historico.length} mensagens do histórico\n`);
  }

  // Preparar histórico para o Gemini
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history: any[] = historico.map((msg) => ({
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
    model: 'gemini-2.5-flash-lite',
    generationConfig: { temperature: 0.2 },
    systemInstruction,
  });

  // Iniciar chat com histórico (se houver)
  const chatParams = history.length > 0 ? { history } : {};
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
      await salvarMensagem(CLIENTE_TESTE_ID, clinicaId, 'user', texto);

      // 2. Enviar para Gemini
      const result = await chat.sendMessage(texto);
      const resposta = result.response.text();

      // 3. Salvar resposta da IA
      await salvarMensagem(CLIENTE_TESTE_ID, clinicaId, 'model', resposta);

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
    const clinicaId = await criarClinica(config.nomeClinica, systemInstruction, config.perfilNegociacao);

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
