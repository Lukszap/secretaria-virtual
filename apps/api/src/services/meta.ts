/**
 * Serviço de envio de mensagens via Meta WhatsApp Business API
 */

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

interface EnvBindings {
  WHATSAPP_ACCESS_TOKEN?: string | undefined;
  PHONE_NUMBER_ID?: string | undefined;
}

/**
 * Formata número de telefone brasileiro (garante o 9º dígito)
 * Padrão exigido pela Meta Sandbox: 55 + DDD + 9 + número = 13 dígitos
 */
export function formatarNumeroBrasileiro(numero: string): string {
  let limpo = numero.replace(/\D/g, '');
  
  // Se é do Brasil (55) e tem apenas 12 dígitos (falta o 9)
  if (limpo.startsWith('55') && limpo.length === 12) {
    const ddd = limpo.substring(2, 4);   // Pega o DDD (ex: 35)
    const resto = limpo.substring(4);    // Pega o número (ex: 87040011)
    limpo = `55${ddd}9${resto}`;         // Injeta o 9 no meio
    console.log('📞 Número corrigido (9 injetado):', limpo);
  } else {
    console.log('📞 Número não precisou de injeção:', limpo);
  }
  
  return limpo;
}

/**
 * Envia mensagem de texto via WhatsApp Business API
 */
export async function enviarMensagem(
  telefone: string,
  mensagem: string,
  phoneNumberId: string,
  env: EnvBindings
): Promise<boolean> {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN não configurado');
    return false;
  }

  const targetPhoneNumberId = env.PHONE_NUMBER_ID || phoneNumberId;
  
  if (!targetPhoneNumberId) {
    console.error('❌ PHONE_NUMBER_ID não disponível');
    return false;
  }

  const url = `https://graph.facebook.com/v19.0/${targetPhoneNumberId}/messages`;

  try {
    // Garante que o número está no padrão de 13 dígitos antes de enviar
    const telefoneFormatado = formatarNumeroBrasileiro(telefone);
    
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefoneFormatado,
      type: 'text',
      text: {
        body: mensagem,
      },
    };

    console.log(`📤 Disparando API da Meta para: ${telefoneFormatado}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro completo da Meta:', response.status, errorData);
      return false;
    }

    const data = await response.json();
    console.log('✅ Mensagem entregue com sucesso pela Meta!');
    return true;

  } catch (error) {
    console.error('❌ Erro na requisição (fetch falhou):', error);
    return false;
  }
}