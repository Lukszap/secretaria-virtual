import qrcode = require('qrcode-terminal');
import whatsapp = require('whatsapp-web.js');
import gemini = require('../ia/gemini');
import dotenv = require('dotenv');

dotenv.config();

const { Client, LocalAuth } = whatsapp;
const { processarMensagemComIA, compilarPrompt } = gemini;

const NUMERO_PERMITIDO = (process.env.WHATSAPP_NUMERO_PERMITIDO || '').replace(/\D/g, '');

function handleQrCode(qr: string): void {
    console.log('QR Code recebido! Verifique o terminal.');
    qrcode.generate(qr, { small: true });
}

function normalizarNumero(numero: string): string {
    return numero.replace(/\D/g, '').slice(-11);
}

function ehNumeroPermitido(numeroWhatsapp: string): boolean {
    const normalizado = normalizarNumero(numeroWhatsapp);
    const permitido = normalizarNumero(NUMERO_PERMITIDO);

    return normalizado === permitido || normalizado.slice(-10) === permitido.slice(-10);
}

async function handleMessage(client: whatsapp.Client, message: whatsapp.Message): Promise<void> {

    if (message.fromMe) {
        return;
    }
    const texto = message.body.trim();

    if (texto.includes('Não consegui responder agora')) {
        console.log('🛑 Bloqueado: Mensagem de erro do bot.');
        return;
    }

    if (message.from.includes('@g.us') || message.to.includes('@g.us')) {
        console.log('🛑 Bloqueado: Grupo detectado.');
        return;
    }

    let idConversa = message.fromMe ? message.to : message.from;

    // 🕵️ TRADUTOR DE LID: Desmascara o número oculto do WhatsApp
    if (idConversa.includes('@lid')) {
        try {
            const contato = await client.getContactById(idConversa);
            if (contato && contato.number) {
                idConversa = contato.number;
                console.log(`[RADAR] 🕵️ @lid traduzido com sucesso para o número: ${idConversa}`);
            }
        } catch (erro) {
            console.log(`[RADAR] ⚠️ Não consegui traduzir o @lid: ${idConversa}`);
        }
    }

    console.log(`\n[RADAR] Analisando conversa com: ${idConversa}`);

    if (!ehNumeroPermitido(idConversa)) {
        console.log(`🛑 Bloqueado: O número ${idConversa} não bate com o .env`);
        return;
    }

    if (!texto) {
        console.log('🛑 Bloqueado: Mensagem sem texto.');
        return;
    }

    console.log(`✅ SUCESSO! Passou nos filtros. IA processando: "${texto}"`);

    try {
        // TODO: Buscar prompt_base da clínica do banco de dados
        // Por enquanto usa um prompt padrão
        const promptPadrao = `Você é uma secretária virtual de clínica de estética. Responda de forma simpática e profissional.`;
        const resposta = await processarMensagemComIA(idConversa, texto, promptPadrao);
        await message.reply(resposta);
    } catch (err: any) {
        console.error('--- ERRO DA IA ---');
        console.error(err.message);
        console.error('-----------------');

        if (!message.fromMe) {
            await message.reply('Não consegui responder agora. Por favor, tente de novo em alguns instantes.');
        }
    }
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', handleQrCode);
client.on('ready', () => {
    console.log('✅ Secretária Online!');
    console.log(`📱 Respondendo apenas para: ${NUMERO_PERMITIDO}`);
});

client.on('message_create', (message) => {
    handleMessage(client, message);
});

client.initialize();
