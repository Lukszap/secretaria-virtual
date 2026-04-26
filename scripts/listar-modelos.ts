import { config } from 'dotenv';

config({ path: '.dev.vars' });

interface Modelo {
  name: string;
  displayName?: string;
  description?: string;
}

async function listarModelos(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY não definida');
    console.log('💡 Crie um arquivo .env na raiz com:');
    console.log('   GEMINI_API_KEY=sua_chave_aqui');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log('🔍 Buscando modelos disponíveis...\n');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json() as { models?: Modelo[] };

    if (!data.models || data.models.length === 0) {
      console.log('⚠️ Nenhum modelo encontrado.');
      return;
    }

    console.log(`✅ ${data.models.length} modelos encontrados:\n`);
    console.log('─'.repeat(60));

    data.models.forEach((model: Modelo) => {
      console.log(`📦 ${model.displayName || model.name}`);
      console.log(`   ID: ${model.name}`);
      if (model.description) {
        console.log(`   ${model.description.substring(0, 80)}...`);
      }
      console.log('─'.repeat(60));
    });

  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

listarModelos();
