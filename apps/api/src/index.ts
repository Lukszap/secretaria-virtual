import express = require('express');
import dotenv = require('dotenv');

// Tipos do Express
import type { Request, Response } from 'express';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'secretaria-virtual-api' });
});

// Webhook para receber mensagens (Meta WhatsApp API)
app.post('/webhook', (req: Request, res: Response) => {
  console.log('📩 Webhook recebido:', req.body);
  res.sendStatus(200);
});

// Verificação do webhook (Meta)
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
