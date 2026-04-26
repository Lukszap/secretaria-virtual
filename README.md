# Secretaria Virtual - SaaS Multi-Tenant

Assistente virtual inteligente para WhatsApp usando IA (Gemini) e arquitetura serverless.

## 🏗️ Arquitetura

### Backend (Cloudflare Workers + Hono)
```
apps/
  api/src/
    index.ts          # Entry point Hono
    routes/
      webhook.ts      # Webhook Meta (GET/POST)
    services/
      gemini.ts       # Integração com Gemini AI
      meta.ts         # Envio mensagens WhatsApp
      supabase.ts     # Banco de dados
```

### Scripts de Teste
```
scripts/
  onboarding.ts       # Cria clínica + teste interativo
  testar-clinica.ts   # Cria nova clínica no banco
  testar-cliente.ts   # Simula conversa de cliente
  listar-modelos.ts  # Lista modelos Gemini disponíveis
```

## 🚀 Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Crie `.dev.vars` na raiz:
```
META_VERIFY_TOKEN=seu_token_verificacao
WHATSAPP_ACCESS_TOKEN=seu_token_meta
PHONE_NUMBER_ID=seu_phone_number_id
GEMINI_API_KEY=sua_chave_gemini
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
```

Ou configure via Wrangler:
```bash
npx wrangler secret put META_VERIFY_TOKEN
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

### 3. Banco de dados
Rode o SQL em `packages/database/schema.sql` no Supabase.

## 🧪 Comandos

### Desenvolvimento
```bash
npm run dev              # Worker local (wrangler dev)
npm run deploy          # Deploy produção
```

### Testes
```bash
# Listar modelos Gemini disponíveis
npm run test:models

# Criar clínica no banco
npm run test:clinica

# Simular conversa cliente
npm run test:cliente

# Setup completo (cria + testa)
npm run test:onboarding
```

## 🌍 Ambiente
- **Runtime**: Cloudflare Workers (serverless)
- **Framework**: Hono (lightweight, Express-like)
- **Banco**: Supabase (PostgreSQL)
- **IA**: Google Gemini API
- **WhatsApp**: Meta Business API (via webhook)

## ⚠️ Restrições Importantes

### Meta WhatsApp API
- **Cross-country bloqueado**: Contas fora do Brasil/Indonésia não podem enviar mensagens para esses países (política Meta desde Set/2025)
- **Sandbox**: Apenas destinatários pré-aprovados
- **Solução**: Usar 360dialog ou verificar conta Business brasileira

## 📋 Status
- ✅ Webhook Meta funcionando
- ✅ Integração Gemini
- ✅ Banco Supabase
- ⚠️ Envio WhatsApp (conta restrita - ver alternativas acima)
