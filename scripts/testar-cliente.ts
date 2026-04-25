import readline from 'readline';
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { listarClinicas, buscarHistoricoConversa, salvarMensagem } from '../apps/api/src/services/supabase.js';

config();

interface Clinica {
  id: string;
  nome: string;
  prompt_base: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function iniciarChat(clinica: Clinica, clienteWaId: string, ehNovo: boolean): Promise<void> {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log(`║  🤖 CHAT - ${clinica.nome.padEnd(42)} ║`);
  console.log(`║  Cliente: ${clienteWaId.substring(0, 25).padEnd(25)} ${ehNovo ? '(NOVO)' : '(EXISTENTE)'}      ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Buscar histórico
  const historico = await buscarHistoricoConversa(
    clienteWaId,
    clinica.id,
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  if (historico.length > 0) {
    console.log(`📝 Histórico: ${historico.length} mensagens anteriores\n`);
    const ultimas = historico.slice(-4);
    ultimas.forEach((msg) => {
      const prefixo = msg.role === 'user' ? '👤' : '🤖';
      const texto = msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : '');
      console.log(`${prefixo} ${texto}`);
    });
    console.log('────────────────────────────────────────\n');
  } else if (!ehNovo) {
    console.log('⚠️  Cliente marcado como existente, mas sem histórico encontrado\n');
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
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.2 },
    systemInstruction: clinica.prompt_base,
  });

  // Iniciar chat com histórico (se houver)
  const chatParams = history.length > 0 ? { history } : {};
  const chat = model.startChat(chatParams);

  // Se for novo e não tiver histórico, enviar saudação automática
  if (ehNovo && historico.length === 0) {
    console.log('🤖 Iniciando conversa com saudação...\n');
    try {
      const result = await chat.sendMessage('Olá! Sou um novo cliente interessado nos serviços.');
      const resposta = result.response.text();
      await salvarMensagem(clienteWaId, clinica.id, 'model', resposta, process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
      console.log(`🤖 Secretária: ${resposta}\n`);
    } catch (erro) {
      console.error('❌ Erro na saudação:', erro);
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
      console.log('⏳ digitando...');
      await salvarMensagem(clienteWaId, clinica.id, 'user', texto, process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

      const result = await chat.sendMessage(texto);
      const resposta = result.response.text();

      await salvarMensagem(clienteWaId, clinica.id, 'model', resposta, process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
      console.log(`\n🤖 Secretária: ${resposta}\n`);
    } catch (erro) {
      console.error('\n❌ Erro:', erro instanceof Error ? erro.message : erro);
      console.log();
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  👤 TESTAR CLIENTE                                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Listar clínicas disponíveis
    const clinicas = await listarClinicas(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    if (clinicas.length === 0) {
      console.log('❌ Nenhuma clínica encontrada. Rode o onboarding primeiro.');
      rl.close();
      process.exit(1);
    }

    console.log('Clínicas disponíveis:\n');
    clinicas.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.nome}`);
    });

    const escolha = await perguntar('\nEscolha a clínica (número): ');
    const idx = parseInt(escolha) - 1;

    if (idx < 0 || idx >= clinicas.length) {
      console.log('❌ Escolha inválida');
      rl.close();
      process.exit(1);
    }

    const clinica = clinicas[idx];
    if (!clinica) {
      console.log('❌ Erro ao selecionar clínica');
      rl.close();
      process.exit(1);
    }

    // Perguntar se cliente é novo ou existente
    console.log('\n🤔 O cliente é:');
    console.log('  1. Novo (sem histórico)');
    console.log('  2. Existente (com histórico salvo)');
    const tipoCliente = await perguntar('Escolha (1 ou 2): ');
    const ehNovo = tipoCliente === '1';

    // ID do cliente
    const clienteId = await perguntar('\n📱 ID do cliente (ex: 5533999999999 ou deixe em branco para padrão): ');
    const clienteWaId = clienteId.trim() || (ehNovo ? 'cliente-novo-teste' : 'cliente-existente-teste');

    await iniciarChat(clinica, clienteWaId, ehNovo);
  } catch (erro) {
    console.error('Erro fatal:', erro);
    rl.close();
    process.exit(1);
  }
}

main();
