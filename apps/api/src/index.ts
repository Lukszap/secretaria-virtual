import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Importação das rotas
import webhookRoutes from './routes/webhook.js';

// Tipos de ambiente do Cloudflare Workers
type Bindings = {
  META_VERIFY_TOKEN: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  PHONE_NUMBER_ID?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middlewares globais
app.use(logger());
app.use(cors());

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'OK',
    service: 'secretaria-virtual-api',
    version: '1.0.0',
    platform: 'Cloudflare Workers',
    timestamp: new Date().toISOString(),
  });
});

// Rotas do Webhook (Meta WhatsApp API)
app.route('/webhook', webhookRoutes);

// Tratamento de rotas não encontradas
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada' }, 404);
});

// Export padrão para Cloudflare Workers
export default app;
