# Secretaria Virtual - SaaS Multi-Tenant

## Estrutura
`
apps/
  api/           # Backend Express (webhooks Meta)
  web/           # Frontend Next.js (painel empresas)
packages/
  shared/        # Tipos TypeScript
  database/      # Schema SQL
scripts/         # Utilitários
`

## Setup
1. 
pm install
2. Copie .env.example para .env e preencha
3. Rode SQL em packages/database/schema.sql no Supabase
4. 
pm run dev para iniciar API

## Ambiente
- Node.js + TypeScript
- Supabase (PostgreSQL)
- Google Gemini API
- Meta WhatsApp Business API (futuro)
