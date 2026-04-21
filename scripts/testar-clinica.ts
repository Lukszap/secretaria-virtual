import readline = require('readline');
import dotenv = require('dotenv');
import gemini = require('../src/ia/gemini');
import db = require('../src/db/supabase');
const { compilarPrompt } = gemini;
const { criarClinica } = db;

dotenv.config();

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

async function faseSetup(): Promise<ConfigClinica> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🏥 CRIAR NOVA CLÍNICA - Vendedora de Elite            ║');
  console.log('║  Configure as estratégias de vendas do bot            ║');
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

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CLÍNICA CRIADA COM SUCESSO!                       ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Nome: ${config.nomeClinica.padEnd(46)} ║`);
    console.log(`║  ID: ${clinicaId.padEnd(48)} ║`);
    console.log(`║  Perfil: ${config.perfilNegociacao.padEnd(44)} ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n💡 Para testar esta clínica, rode: npx ts-node scripts/testar-cliente.ts');

    rl.close();
    process.exit(0);
  } catch (erro) {
    console.error('Erro fatal:', erro);
    rl.close();
    process.exit(1);
  }
}

main();
