# Contexto do Projeto - Secretaria Virtual

## Stack Tecnológica
- **Linguagem**: TypeScript (Node.js)
- **Backend/Servidor**: Hono.js rodando na infraestrutura do Cloudflare Workers
- **Banco de Dados**: Supabase (PostgreSQL) com foco em JSONB para configurações
- **IA**: Google Gemini API (`gemini-3.1-flash-lite-preview`)
- **Mensageria**: Meta WhatsApp Business API (via Webhooks)

## Arquitetura
- **Padrão**: SaaS Multi-tenant com isolamento estrito via `tenant_id`
- **Nicho**: Exclusivo para Beleza e Estética (Salões, Clínicas, Barbearias)

## Estrutura de Pastas
```
/apps/api          - Backend Hono.js (Cloudflare Workers)
/scripts           - Scripts utilitários (listar modelos, etc.)
```

## Arquivos Chave
- `apps/api/src/services/gemini-v2.ts` - Serviço de integração com Gemini
- `apps/api/src/routes/` - Rotas da API
- Configuração de modelos Gemini: verificar `gemini-v2.ts` (não alterar versão sem comando específico)

## Convenções
- Isolamento multi-tenant sempre via `tenant_id`
- Configurações flexíveis usando JSONB no Supabase
