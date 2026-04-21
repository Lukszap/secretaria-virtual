-- Schema Multi-Tenant para Secretaria Virtual SaaS

-- Tabela de Empresas (multi-nicho)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nicho TEXT NOT NULL DEFAULT 'estetica',
  telefone_whatsapp TEXT,
  config_json JSONB NOT NULL DEFAULT '{}',
  meta_waba_id TEXT,
  meta_phone_id TEXT,
  access_token TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conversas (por empresa)
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_telefone TEXT NOT NULL,
  messages JSONB[] DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_nicho ON empresas(nicho);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa ON conversas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conversas_lookup ON conversas(empresa_id, cliente_telefone);

-- Desabilitar RLS para desenvolvimento (depois habilitar com policies)
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversas DISABLE ROW LEVEL SECURITY;
