-- =============================================================================
-- SCHEMA SAAS MULTI-TENANT - SECRETARIA VIRTUAL PARA BELEZA E ESTÉTICA
-- =============================================================================
-- Isolamento estrito via tenant_id
-- Nicho: Salões, Barbearias, Clínicas de Estética, Nail Designers
-- =============================================================================

-- =============================================================================
-- TABELA: TENANTS (Clínicas/Salões)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Para URLs: /salao-beleza-rose
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  
  -- WhatsApp Business
  whatsapp_phone_number_id TEXT,
  whatsapp_waba_id TEXT,
  whatsapp_access_token_encrypted TEXT, -- Token criptografado
  
  -- Configurações do Negócio (JSONB estruturado)
  configuracoes JSONB NOT NULL DEFAULT '{
    "catalogo_servicos": [],
    "profissionais": [],
    "horario_funcionamento": {
      "seg": {"abre": "09:00", "fecha": "18:00", "aberto": true},
      "ter": {"abre": "09:00", "fecha": "18:00", "aberto": true},
      "qua": {"abre": "09:00", "fecha": "18:00", "aberto": true},
      "qui": {"abre": "09:00", "fecha": "18:00", "aberto": true},
      "sex": {"abre": "09:00", "fecha": "18:00", "aberto": true},
      "sab": {"abre": "09:00", "fecha": "14:00", "aberto": true},
      "dom": {"abre": "09:00", "fecha": "14:00", "aberto": false}
    },
    "regras_negocio": {
      "tolerancia_atraso_minutos": 15,
      "exige_sinal_pix": false,
      "percentual_sinal": 30,
      "cancelamento_antecedencia_horas": 24,
      "tempo_minimo_entre_agendamentos_minutos": 30,
      "permite_agendamento_futuro_dias": 60
    },
    "mensagens_padrao": {
      "saudacao": "Olá! Sou a assistente virtual do {nome_salao}. Como posso te ajudar hoje? 💅",
      "confirmacao_agendamento": "Seu agendamento foi confirmado! Aguardamos você no {data} às {hora}. ✨",
      "lembrete": "Lembrete: Você tem um agendamento amanhã às {hora}. Nos vemos lá! 💖",
      "fallback_ia": "Só um minutinho, estou processando sua mensagem... ⏳"
    }
  }'::jsonb,
  
  -- Plano e Limites
  plano TEXT NOT NULL DEFAULT 'gratuito', -- gratuito, basico, pro, enterprise
  limite_mensagens_mes INTEGER DEFAULT 100,
  mensagens_usadas_mes INTEGER DEFAULT 0,
  limite_agendamentos_mes INTEGER DEFAULT 50,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  trial_ate TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TABELA: CLIENTES (Por Tenant - Isolamento Multi-tenant)
-- =============================================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  nome TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento DATE,
  
  -- Preferências e Histórico
  preferencias JSONB DEFAULT '{}', -- profissional_favorito, alergias, etc
  historico_servicos JSONB[] DEFAULT '{}',
  
  -- WhatsApp
  whatsapp_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint única por tenant + telefone
  UNIQUE(tenant_id, telefone)
);

-- =============================================================================
-- TABELA: CONVERSAS (Sessões de Chat)
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Status do Atendimento
  status TEXT NOT NULL DEFAULT 'bot_active', -- bot_active, human_requested, human_active, closed
  bot_active BOOLEAN DEFAULT true,
  human_escalation_requested_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados Coletados durante a Conversa (Contexto para IA)
  dados_coletados JSONB DEFAULT '{
    "servico_desejado": null,
    "profissional_preferido": null,
    "data_preferida": null,
    "hora_preferida": null,
    "nome_cliente": null,
    "foi_saudado": false,
    "ultima_acao": null
  }'::jsonb,
  
  -- Controle de Rate Limiting (Anti-spam)
  ultima_mensagem_cliente_at TIMESTAMP WITH TIME ZONE,
  mensagens_seguidas_cliente INTEGER DEFAULT 0, -- Contador para debounce
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice composto para lookup rápido
  UNIQUE(tenant_id, cliente_id)
);

-- =============================================================================
-- TABELA: MENSAGENS (Log Completo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Dados da Mensagem
  tipo TEXT NOT NULL, -- 'inbound' (cliente) | 'outbound' (bot/sistema)
  origem TEXT NOT NULL, -- 'whatsapp', 'instagram', 'sistema', 'humano'
  conteudo TEXT NOT NULL,
  
  -- Metadados do WhatsApp (para tracking)
  wa_message_id TEXT UNIQUE,
  wa_context_message_id TEXT, -- Para replies/threads
  
  -- Processamento da IA
  processada_por_ia BOOLEAN DEFAULT false,
  intencao_detectada TEXT, -- agendamento, duvida, reclamacao, etc
  confianca_ia DECIMAL(3,2), -- 0.00 a 1.00
  
  -- Action Engine (se disparou alguma ação)
  acao_disparada TEXT, -- agendar_horario, chamar_recepcionista, etc
  acao_payload JSONB,
  acao_status TEXT, -- pending, completed, failed
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice para ordenação cronológica
  CONSTRAINT idx_mensagens_cronologia UNIQUE (conversa_id, created_at, id)
);

-- =============================================================================
-- TABELA: AGENDAMENTOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  conversa_id UUID REFERENCES conversas(id) ON DELETE SET NULL,
  
  -- Serviço Agendado
  servico_slug TEXT NOT NULL, -- referencia ao slug no catalogo do tenant
  servico_nome TEXT NOT NULL, -- denormalizado para histórico
  servico_preco DECIMAL(10,2),
  duracao_minutos INTEGER,
  
  -- Profissional
  profissional_id UUID, -- pode ser null se cliente não tiver preferência
  profissional_nome TEXT, -- denormalizado
  
  -- Data e Hora
  data_agendamento DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME, -- calculado baseado na duração
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmado', -- confirmado, cancelado, concluido, no_show
  
  -- Sinal/Pagamento
  sinal_pago BOOLEAN DEFAULT false,
  valor_sinal DECIMAL(10,2),
  
  -- Observações
  observacoes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelado_em TIMESTAMP WITH TIME ZONE,
  cancelado_motivo TEXT
);

-- =============================================================================
-- ÍNDICES DE PERFORMANCE
-- =============================================================================

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_ativo ON tenants(ativo);
CREATE INDEX IF NOT EXISTS idx_tenants_plano ON tenants(plano);

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(tenant_id, telefone);

-- Conversas
CREATE INDEX IF NOT EXISTS idx_conversas_lookup ON conversas(tenant_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas(status, bot_active);
CREATE INDEX IF NOT EXISTS idx_conversas_updated ON conversas(updated_at DESC);

-- Mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_acao ON mensagens(acao_status) WHERE acao_status IS NOT NULL;

-- Agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant_data ON agendamentos(tenant_id, data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_data ON agendamentos(profissional_id, data_agendamento);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
-- =============================================================================

-- DESATIVADO PARA DESENVOLVIMENTO
-- Para produção, descomente e configure as policies corretamente
-- com base na sua estratégia de autenticação

/*
-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Policies (exemplo - ajustar conforme necessidade)
-- Tenants: Apenas o próprio tenant ou admin pode ver
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Clientes: Isolados por tenant
CREATE POLICY clientes_tenant_isolation ON clientes
  FOR ALL USING (tenant_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- Conversas: Isoladas por tenant
CREATE POLICY conversas_tenant_isolation ON conversas
  FOR ALL USING (tenant_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- Mensagens: Isoladas por tenant
CREATE POLICY mensagens_tenant_isolation ON mensagens
  FOR ALL USING (tenant_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- Agendamentos: Isolados por tenant
CREATE POLICY agendamentos_tenant_isolation ON agendamentos
  FOR ALL USING (tenant_id::text = auth.uid()::text OR auth.role() = 'service_role');
*/

-- =============================================================================
-- FUNÇÕES AUXILIARES (TRIGGERS)
-- =============================================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversas_updated_at BEFORE UPDATE ON conversas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para resetar contador mensal de mensagens
CREATE OR REPLACE FUNCTION reset_mensagens_mensais()
RETURNS void AS $$
BEGIN
  UPDATE tenants SET mensagens_usadas_mes = 0;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE tenants IS 'Clínicas, salões, barbearias - isolamento multi-tenant';
COMMENT ON TABLE clientes IS 'Clientes finais por tenant';
COMMENT ON TABLE conversas IS 'Sessões de atendimento com controle de status';
COMMENT ON TABLE mensagens IS 'Log completo de mensagens inbound/outbound';
COMMENT ON TABLE agendamentos IS 'Agendamentos confirmados com histórico';

