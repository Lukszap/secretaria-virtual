import { Hono } from 'hono';
import { processarMensagemComIA, compilarPrompt } from '../services/gemini.js';
import { enviarMensagem, formatarNumeroBrasileiro } from '../services/meta.js';

type Bindings = {
  META_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  PHONE_NUMBER_ID?: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Rota GET - Verificação da Meta
app.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === c.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado pela Meta!');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response('Forbidden', { status: 403 });
});

// Rota POST - Recebimento e Resposta
app.post('/', async (c) => {
  const payload = await c.req.json();

  try {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Se não for uma mensagem (for só aviso de entrega), ignora calado
    if (!message) {
      const status = value?.statuses?.[0];
      console.log('⚠️ Relatório de Status da Meta:', JSON.stringify(status, null, 2));
      return c.json({ status: 'OK' }, 200);
    }

    const telefoneOriginal = message.from;
    const texto = message.text?.body || '';
    const phoneNumberId = value?.metadata?.phone_number_id;

    console.log(`📩 Nova mensagem de: ${telefoneOriginal} | Texto: "${texto}"`);

    // Formata o número (Adiciona o 9) para criar a sessão no Supabase/Memória
    const telefoneFormatado = formatarNumeroBrasileiro(telefoneOriginal);

    // Prompt Base (Em breve vira banco de dados)
    const configEmpresa = {
      nomeClinica: 'Smart Chuveiro',
      enderecoHorario: 'Atendimento 24h via WhatsApp',
      servicosPrecos: 'Suporte técnico: R$ 50\nInstalação: R$ 150',
      regrasPagamento: 'Pix, cartão ou boleto',
      limitesMedicos: 'Nenhum',
      dadosAgendamento: 'Nome, endereço, horário preferido',
      perfilNegociacao: 'Equilibrado' as const,
      brindesDescontos: '10% de desconto na primeira compra',
      servicosComplementares: 'Manutenção preventiva',
      restricoesAgenda: 'Nenhuma',
    };

    const systemInstruction = compilarPrompt(configEmpresa);

    console.log('🤖 Consultando Gemini...');
    const respostaIA = await processarMensagemComIA(
      `conversa-${telefoneFormatado}`,
      texto,
      systemInstruction,
      c.env.GEMINI_API_KEY
    );

    console.log('📤 Resposta gerada (envio desabilitado por conta restrita):');
    console.log('Para:', telefoneOriginal);
    console.log('Mensagem:', respostaIA);

    // MODO DEBUG: Apenas loga, não envia (conta Meta restrita - erro 130497)
    // Para reabilitar, descomente abaixo:
    /*
    const enviado = await enviarMensagem(
      telefoneFormatado,
      respostaIA,
      phoneNumberId,
      {
        WHATSAPP_ACCESS_TOKEN: c.env.WHATSAPP_ACCESS_TOKEN,
        PHONE_NUMBER_ID: c.env.PHONE_NUMBER_ID,
      }
    );
    */
    const enviado = false; // Envio desabilitado temporariamente

    return c.json({ status: 'OK', enviado, mensagem: respostaIA }, 200); // Retorna 200 pra Meta não tentar reenviar
  } catch (error) {
    console.error('❌ Erro fatal ao processar webhook:', error);
    return c.json({ status: 'OK' }, 200); // Retorna 200 pra Meta não tentar reenviar
  }
});

export default app;