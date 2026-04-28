// =============================================================================
// SERVIÇO DE NOTIFICAÇÕES - WhatsApp para o Dono do Salão/Clínica
// =============================================================================

import type { Tenant } from '../../../../packages/shared/src/types.js';
import { enviarMensagem } from './meta.js';

// Tipo para variáveis de ambiente
interface Env {
  WHATSAPP_ACCESS_TOKEN?: string;
  PHONE_NUMBER_ID?: string;
}

export interface NotificacaoAgendamento {
  nomeCliente: string;
  telefoneCliente: string;
  servico: string;
  profissional: string | undefined;
  data: string;       // formato legível: "terça-feira, 13 de maio"
  hora: string;       // "14:30"
  tenantNome: string;
}

/**
 * Envia notificação WhatsApp para o dono quando um agendamento é confirmado
 * Falhas são logadas mas não lançam erro (não deve derrubar o fluxo principal)
 */
export async function notificarDonoAgendamento(
  env: Env,
  tenant: Tenant,
  dados: NotificacaoAgendamento
): Promise<void> {
  try {
    // Verificar se tem WhatsApp do dono configurado
    if (!tenant.whatsapp_dono) {
      console.log('ℹ️ Notificação: whatsapp_dono não configurado para tenant', tenant.id);
      return;
    }

    // Verificar se tem configurações de WhatsApp Business
    if (!tenant.whatsapp_phone_number_id || !tenant.whatsapp_access_token_encrypted) {
      console.log('ℹ️ Notificação: WhatsApp Business não configurado para tenant', tenant.id);
      return;
    }

    // Montar mensagem formatada
    const mensagem = `🗓️ *Novo agendamento confirmado!*

👤 Cliente: ${dados.nomeCliente} (${dados.telefoneCliente})
💅 Serviço: ${dados.servico}
👩‍💼 Profissional: ${dados.profissional || 'A definir'}
📅 Data: ${dados.data}
🕐 Hora: ${dados.hora}

_Agendado via Secretaria Virtual_`;

    // Enviar mensagem usando a função existente do meta.ts
    const enviado = await enviarMensagem(
      tenant.whatsapp_dono,
      mensagem,
      tenant.whatsapp_phone_number_id,
      {
        WHATSAPP_ACCESS_TOKEN: tenant.whatsapp_access_token_encrypted,
        PHONE_NUMBER_ID: tenant.whatsapp_phone_number_id,
      }
    );

    if (enviado) {
      console.log('✅ Notificação enviada para dono:', tenant.whatsapp_dono);
    } else {
      console.log('⚠️ Falha ao enviar notificação para dono:', tenant.whatsapp_dono);
    }

  } catch (error) {
    // Capturar erro sem lançar - notificação não pode derrubar o fluxo principal
    console.error('❌ Erro ao enviar notificação para dono:', error);
    // Não relançar o erro
  }
}
