import dotenv = require('dotenv');
import genai = require('@google/generative-ai');

const { GoogleGenerativeAI } = genai;

dotenv.config();

const instrucoesSistema = `
Identidade: Secretária profissional de Estética.

Objetivo: Tirar dúvidas sobre horários e preços de forma gentil.

Segurança: Se o assunto não for estético ou da clínica, diga que não pode ajudar.
`.trim();

async function processarMensagemComIA(
  mensagemCliente: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não está definida no ambiente.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.2 },
    systemInstruction: instrucoesSistema,
  });

  const result = await model.generateContent(mensagemCliente);
  return result.response.text();
}

export = {
  instrucoesSistema,
  processarMensagemComIA,
};
