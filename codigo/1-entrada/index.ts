import qrcode = require('qrcode-terminal');
import whatsapp = require('whatsapp-web.js');

const { Client, LocalAuth } = whatsapp;

const GREETING_TRIGGER = 'oi';
const GREETING_REPLY = 'Olá! Eu sou a sua Secretária Virtual.';

function handleQrCode(qr: string): void {
  qrcode.generate(qr, { small: true });
}

function handleReady(): void {
  console.log('✅ Secretária Online!');
}

async function handleMessage(message: { body: string; reply: (text: string) => Promise<unknown> }): Promise<void> {
  if (message.body.trim().toLowerCase() === GREETING_TRIGGER) {
    await message.reply(GREETING_REPLY);
    return;
  }

  console.log(`Mensagem recebida: ${message.body}`);
}

function createClient() {
  return new Client({
    authStrategy: new LocalAuth(),
  });
}

function registerClientEvents(client: any): void {
  client.on('qr', handleQrCode);
  client.on('ready', handleReady);
  client.on('message', (message: { body: string; reply: (text: string) => Promise<unknown> }) => {
    void handleMessage(message);
  });
}

function initializeClient(): void {
  const client = createClient();
  registerClientEvents(client);
  client.initialize();
}

initializeClient();
