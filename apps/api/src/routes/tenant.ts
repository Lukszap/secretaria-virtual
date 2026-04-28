// =============================================================================
// ROTAS DE CONFIGURAÇÃO DO TENANT - /api/tenant/*
// =============================================================================

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { 
  Tenant, 
  ConfiguracoesTenant, 
  ServicoCatalogo, 
  Profissional, 
  HorarioFuncionamento,
  RegrasNegocio,
  MensagensPadrao
} from '../../../../packages/shared/src/types.js';

// Tipos de ambiente
type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
};

type Variables = {
  tenantId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =============================================================================
// MIDDLEWARE DE AUTH SIMPLES (MVP)
// =============================================================================
// TODO: substituir por JWT real em produção
app.use('/api/tenant/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header required' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Por enquanto, o token é o próprio tenant_id
  // TODO: substituir por validação JWT real
  if (!token || token.length < 10) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  // Armazenar tenant_id no contexto
  c.set('tenantId', token);
  
  await next();
});

// =============================================================================
// PUT /api/tenant/configuracoes
// =============================================================================
app.put('/api/tenant/configuracoes', async (c) => {
  const tenantId = c.get('tenantId');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  
  try {
    const body = await c.req.json() as Partial<ConfiguracoesTenant> & { timezone?: string };
    
    // Buscar configurações atuais
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('configuracoes')
      .eq('id', tenantId)
      .single();
    
    if (fetchError || !tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    
    const configuracoesAtuais = tenant.configuracoes as ConfiguracoesTenant;
    const novasConfiguracoes = { ...configuracoesAtuais };
    
    // Validar e aplicar timezone
    if (body.timezone !== undefined) {
      if (typeof body.timezone !== 'string' || body.timezone.trim() === '') {
        return c.json({ error: 'timezone must be a non-empty string' }, 400);
      }
      
      // Validar se é um timezone válido
      try {
        // Testar se o timezone é válido usando Intl
        Intl.DateTimeFormat('pt-BR', { timeZone: body.timezone });
        (novasConfiguracoes as Record<string, unknown>).timezone = body.timezone;
      } catch {
        return c.json({ 
          error: 'Invalid timezone', 
          message: `Timezone "${body.timezone}" is not valid. Use format like "America/Sao_Paulo"`
        }, 400);
      }
    }
    
    // Validar e aplicar catalogo_servicos
    if (body.catalogo_servicos !== undefined) {
      if (!Array.isArray(body.catalogo_servicos)) {
        return c.json({ error: 'catalogo_servicos must be an array' }, 400);
      }
      
      for (let i = 0; i < body.catalogo_servicos.length; i++) {
        const servico = body.catalogo_servicos[i];
        if (!servico) continue;
        
        const camposObrigatorios = ['nome', 'preco', 'duracao_minutos', 'slug'];
        const camposFaltantes = camposObrigatorios.filter(campo => 
          servico[campo as keyof ServicoCatalogo] === undefined || 
          servico[campo as keyof ServicoCatalogo] === null ||
          servico[campo as keyof ServicoCatalogo] === ''
        );
        
        if (camposFaltantes.length > 0) {
          return c.json({ 
            error: `Service at index ${i} is missing required fields: ${camposFaltantes.join(', ')}`
          }, 400);
        }
        
        // Validar tipos
        if (typeof servico.preco !== 'number' || servico.preco < 0) {
          return c.json({ error: `Service at index ${i}: preco must be a positive number` }, 400);
        }
        if (typeof servico.duracao_minutos !== 'number' || servico.duracao_minutos <= 0) {
          return c.json({ error: `Service at index ${i}: duracao_minutos must be a positive number` }, 400);
        }
      }
      
      novasConfiguracoes.catalogo_servicos = body.catalogo_servicos as ServicoCatalogo[];
    }
    
    // Validar e aplicar profissionais
    if (body.profissionais !== undefined) {
      if (!Array.isArray(body.profissionais)) {
        return c.json({ error: 'profissionais must be an array' }, 400);
      }
      
      for (let i = 0; i < body.profissionais.length; i++) {
        const prof = body.profissionais[i];
        if (!prof) continue;
        if (!prof.id || !prof.nome) {
          return c.json({ 
            error: `Professional at index ${i} must have id and nome`
          }, 400);
        }
      }
      
      novasConfiguracoes.profissionais = body.profissionais as Profissional[];
    }
    
    // Validar e aplicar horario_funcionamento
    if (body.horario_funcionamento !== undefined) {
      const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
      const horarioRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      for (const dia of dias) {
        const configDia = body.horario_funcionamento[dia];
        if (configDia) {
          if (configDia.aberto) {
            if (!configDia.abre || !configDia.fecha) {
              return c.json({ 
                error: `horario_funcionamento.${dia}: abre and fecha are required when aberto is true`
              }, 400);
            }
            if (!horarioRegex.test(configDia.abre) || !horarioRegex.test(configDia.fecha)) {
              return c.json({ 
                error: `horario_funcionamento.${dia}: abre and fecha must be in HH:MM format`
              }, 400);
            }
          }
        }
      }
      
      novasConfiguracoes.horario_funcionamento = {
        ...novasConfiguracoes.horario_funcionamento,
        ...body.horario_funcionamento
      };
    }
    
    // Aplicar regras_negocio (merge parcial)
    if (body.regras_negocio !== undefined) {
      novasConfiguracoes.regras_negocio = {
        ...novasConfiguracoes.regras_negocio,
        ...body.regras_negocio
      };
    }
    
    // Aplicar mensagens_padrao (merge parcial)
    if (body.mensagens_padrao !== undefined) {
      novasConfiguracoes.mensagens_padrao = {
        ...novasConfiguracoes.mensagens_padrao,
        ...body.mensagens_padrao
      };
    }
    
    // Salvar no banco
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({ configuracoes: novasConfiguracoes, updated_at: new Date().toISOString() })
      .eq('id', tenantId)
      .select('configuracoes')
      .single();
    
    if (updateError) {
      console.error('Error updating tenant config:', updateError);
      return c.json({ error: 'Failed to update configuration' }, 500);
    }
    
    return c.json({ 
      success: true,
      configuracoes: updatedTenant.configuracoes 
    }, 200);
    
  } catch (error) {
    console.error('Error in PUT /api/tenant/configuracoes:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =============================================================================
// PUT /api/tenant/whatsapp-dono
// =============================================================================
app.put('/api/tenant/whatsapp-dono', async (c) => {
  const tenantId = c.get('tenantId');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  
  try {
    const body = await c.req.json() as { whatsapp?: string };
    
    if (!body.whatsapp) {
      return c.json({ error: 'whatsapp is required' }, 400);
    }
    
    // Remover caracteres não-numéricos
    let whatsappLimpo = body.whatsapp.replace(/\D/g, '');
    
    // Validar número de dígitos
    if (whatsappLimpo.length < 10 || whatsappLimpo.length > 13) {
      return c.json({ 
        error: 'Número deve ter entre 10 e 13 dígitos (incluindo DDI e DDD)'
      }, 400);
    }
    
    // Validar que é brasileiro (começa com 55)
    if (!whatsappLimpo.startsWith('55')) {
      return c.json({ 
        error: 'Número deve ser brasileiro com DDI 55'
      }, 400);
    }
    
    // Salvar no banco
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({ 
        whatsapp_dono: whatsappLimpo, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', tenantId)
      .select('whatsapp_dono')
      .single();
    
    if (updateError) {
      console.error('Error updating whatsapp_dono:', updateError);
      return c.json({ error: 'Failed to update whatsapp_dono' }, 500);
    }
    
    return c.json({ 
      success: true,
      whatsapp_dono: updatedTenant.whatsapp_dono 
    }, 200);
    
  } catch (error) {
    console.error('Error in PUT /api/tenant/whatsapp-dono:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
