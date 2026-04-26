import { Hono } from 'hono';
import { generateGeminiResponse, processarEchoHumano } from '../services/gemini-v2.js';
import { enviarMensagem, formatarNumeroBrasileiro } from '../services/meta.js';
import { createClient } from '@supabase/supabase-js';

type Bindings = {
  META_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  PHONE_NUMBER_ID?: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  TENANT_ID: string; // ID do tenant/salão para multi-tenant
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
    const contacts = value?.contacts?.[0];
    const phoneNumberId = value?.metadata?.phone_number_id;

    // Se não for uma mensagem (for só aviso de entrega), ignora
    if (!message) {
      const status = value?.statuses?.[0];
      console.log('⚠️ Relatório de Status da Meta:', JSON.stringify(status, null, 2));
      return c.json({ status: 'OK' }, 200);
    }

    const telefoneOriginal = message.from;
    const texto = message.text?.body || '';
    const nomeWhatsApp = contacts?.profile?.name || undefined;

    console.log(`📩 Nova mensagem de: ${telefoneOriginal} | Texto: "${texto}"`);

    // Formata o número (Adiciona o 9)
    const telefoneFormatado = formatarNumeroBrasileiro(telefoneOriginal);

    // Inicializa Supabase
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);

    // FASE 3: Detectar ECHO (humano no WhatsApp Web)
    // Se a mensagem vier do próprio número do negócio, é um echo
    const isEcho = message.from === phoneNumberId || value?.metadata?.display_phone_number === telefoneOriginal;
    
    if (isEcho) {
      console.log('🧑‍💼 Echo detectado - Humano assumiu controle');
      await processarEchoHumano(supabase, c.env.TENANT_ID, telefoneFormatado, texto);
      return c.json({ status: 'OK', echo: true }, 200);
    }

    // FASE 2: Processar com Gemini
    console.log('🤖 Processando com Gemini...');
    const resultado = await generateGeminiResponse(
      supabase,
      {
        GEMINI_API_KEY: c.env.GEMINI_API_KEY,
        SUPABASE_URL: c.env.SUPABASE_URL,
        SUPABASE_KEY: c.env.SUPABASE_KEY,
        WHATSAPP_ACCESS_TOKEN: c.env.WHATSAPP_ACCESS_TOKEN || '',
        PHONE_NUMBER_ID: c.env.PHONE_NUMBER_ID || '',
        META_VERIFY_TOKEN: c.env.META_VERIFY_TOKEN
      },
      c.env.TENANT_ID,
      telefoneFormatado,
      texto,
      nomeWhatsApp
    );

    // Se bot estiver pausado (humano ativo), não envia resposta
    if (resultado.intencao === 'humano_ativo') {
      console.log('⏸️ Bot pausado - atendimento humano em andamento');
      return c.json({ status: 'OK', bot_paused: true }, 200);
    }

    console.log('📤 Resposta da IA:', resultado.texto);

    // FASE 4: Executar Action se houver
    let mensagemConfirmacao = resultado.texto;
    
    if (resultado.action?.tipo === 'agendar_horario') {
      console.log('📅 Action: Executando agendamento...', resultado.action.payload);
      
      try {
        // Executar agendamento no banco
        const payload = resultado.action.payload;
        const { data: agendamento, error } = await supabase
          .from('agendamentos')
          .insert({
            tenant_id: c.env.TENANT_ID,
            cliente_id: (await supabase.from('clientes').select('id').eq('telefone', telefoneFormatado).single()).data?.id,
            servico_slug: payload?.servico,
            servico_nome: payload?.servico_nome || 'Serviço',
            data_agendamento: payload?.data,
            hora_inicio: payload?.hora,
            profissional_id: payload?.profissional_preferencia,
            profissional_nome: payload?.profissional_nome,
            status: 'confirmado',
            sinal_pago: false
          })
          .select('*')
          .single();
        
        if (error) throw error;
        
        // Atualizar mensagem com status completed
        await supabase
          .from('mensagens')
          .update({ acao_status: 'completed' })
          .eq('conversa_id', (await supabase.from('conversas').select('id').eq('cliente_id', agendamento.cliente_id).single()).data?.id)
          .eq('acao_status', 'pending');
        
        // Enviar mensagem de confirmação
        mensagemConfirmacao = `✅ *Agendamento Confirmado!*\n\n📋 ${payload?.servico_nome || payload?.servico}\n👤 ${payload?.profissional_preferencia || 'Profissional disponível'}\n📅 ${payload?.data} às ${payload?.hora}\n\nTe esperamos! 💕`;
        
        console.log('✅ Agendamento criado:', agendamento.id);
        
      } catch (err) {
        console.error('❌ Erro ao criar agendamento:', err);
        mensagemConfirmacao = 'Desculpe, tivemos um problema ao confirmar seu agendamento. Vou chamar um atendente para te ajudar!';
        
        // Pausar bot e chamar humano
        const { data: cliente } = await supabase.from('clientes').select('id').eq('telefone', telefoneFormatado).single();
        if (cliente) {
          await supabase.from('conversas').update({ status: 'human_requested', bot_active: false }).eq('cliente_id', cliente.id);
        }
      }
    } else if (resultado.action?.tipo === 'verificar_disponibilidade') {
      console.log('🔍 Action: Verificando disponibilidade...');
      // Retornar horários disponíveis (mock por enquanto)
      mensagemConfirmacao = resultado.texto + '\n\nHorários disponíveis: 14:00, 15:30, 16:00';
    } else if (resultado.action?.tipo === 'chamar_recepcionista_humana') {
      console.log('🧑‍💼 Action: Recepcionista humano solicitado');
      mensagemConfirmacao = 'Claro! Vou transferir você para um de nossos atendentes. Um momento, por favor... 🤗';
    }

    // Enviar resposta via WhatsApp (se não estiver em modo debug)
    let enviado = false;
    if (mensagemConfirmacao && c.env.WHATSAPP_ACCESS_TOKEN) {
      enviado = await enviarMensagem(
        telefoneFormatado,
        mensagemConfirmacao,
        phoneNumberId,
        {
          WHATSAPP_ACCESS_TOKEN: c.env.WHATSAPP_ACCESS_TOKEN,
          PHONE_NUMBER_ID: c.env.PHONE_NUMBER_ID,
        }
      );
    }

    return c.json({ 
      status: 'OK', 
      enviado, 
      mensagem: mensagemConfirmacao,
      action: resultado.action?.tipo 
    }, 200);
    
  } catch (error) {
    console.error('❌ Erro fatal ao processar webhook:', error);
    return c.json({ status: 'OK' }, 200);
  }
});

export default app;