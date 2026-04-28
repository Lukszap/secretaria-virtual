// Gera slug a partir de texto
export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-"); // Remove hífens duplicados
}

// Formata número de WhatsApp
export function formatarWhatsApp(numero: string): string {
  // Remove tudo exceto números
  const limpo = numero.replace(/\D/g, "");
  return limpo;
}

// Máscara para input de WhatsApp (DD) DDDDD-DDDD
export function mascaraWhatsApp(valor: string): string {
  const numeros = valor.replace(/\D/g, "");
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 7)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 11)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7,
      11
    )}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
    7,
    11
  )}`;
}

// Converte para formato internacional (55XXXXXXXXXXX)
export function paraFormatoInternacional(valorComMascara: string): string {
  const numeros = valorComMascara.replace(/\D/g, "");
  if (numeros.length === 11 || numeros.length === 10) {
    return `55${numeros}`;
  }
  if (numeros.length === 13 || numeros.length === 12) {
    return numeros; // Já tem o 55
  }
  return numeros;
}

// Fuso horários brasileiros
export const FUSOS_BRASIL = [
  { label: "América/São Paulo (Brasília)", value: "America/Sao_Paulo" },
  { label: "América/Manaus", value: "America/Manaus" },
  { label: "América/Belém", value: "America/Belem" },
  { label: "América/Fortaleza", value: "America/Fortaleza" },
  { label: "América/Acre", value: "America/Rio_Branco" },
  { label: "América/Fernando de Noronha", value: "America/Noronha" },
] as const;

// Tipos de negócio
export const TIPOS_NEGOCIO = [
  { label: "Salão de Beleza", value: "salao" },
  { label: "Barbearia", value: "barbearia" },
  { label: "Clínica de Estética", value: "clinica" },
  { label: "Nail Designer", value: "nail" },
  { label: "Spa", value: "spa" },
  { label: "Outro", value: "outro" },
] as const;

// Dias da semana
export const DIAS_SEMANA = [
  { label: "Seg", value: "seg", full: "Segunda-feira" },
  { label: "Ter", value: "ter", full: "Terça-feira" },
  { label: "Qua", value: "qua", full: "Quarta-feira" },
  { label: "Qui", value: "qui", full: "Quinta-feira" },
  { label: "Sex", value: "sex", full: "Sexta-feira" },
  { label: "Sáb", value: "sab", full: "Sábado" },
  { label: "Dom", value: "dom", full: "Domingo" },
] as const;

// Durações de serviço
export const DURACOES_SERVICO = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2 horas", value: 120 },
  { label: "2h 30min", value: 150 },
  { label: "3 horas", value: 180 },
  { label: "Personalizado", value: -1 },
] as const;

// Horários padrão para onboarding
export function getHorariosPadrao() {
  return {
    seg: { abre: "09:00", fecha: "18:00", aberto: true },
    ter: { abre: "09:00", fecha: "18:00", aberto: true },
    qua: { abre: "09:00", fecha: "18:00", aberto: true },
    qui: { abre: "09:00", fecha: "18:00", aberto: true },
    sex: { abre: "09:00", fecha: "18:00", aberto: true },
    sab: { abre: "09:00", fecha: "14:00", aberto: true },
    dom: { abre: "09:00", fecha: "14:00", aberto: false },
  };
}

// Calcula progresso do perfil baseado em campos preenchidos
export function calcularProgressoPerfil(config: {
  regras_negocio?: Record<string, unknown>;
  mensagens_padrao?: Record<string, unknown>;
  profissionais?: unknown[];
  catalogo_servicos?: unknown[];
}): number {
  let total = 0;
  let preenchidos = 0;

  // Regras de negócio (6 campos)
  const regras = config.regras_negocio || {};
  const camposRegras = [
    "tolerancia_atraso_minutos",
    "exige_sinal_pix",
    "percentual_sinal",
    "cancelamento_antecedencia_horas",
    "tempo_minimo_entre_agendamentos_minutos",
    "permite_agendamento_futuro_dias",
  ];
  total += camposRegras.length;
  camposRegras.forEach((campo) => {
    if (regras[campo] !== undefined) preenchidos++;
  });

  // Mensagens (4 campos)
  const mensagens = config.mensagens_padrao || {};
  const camposMensagens = [
    "saudacao",
    "confirmacao_agendamento",
    "lembrete",
    "fallback_ia",
  ];
  total += camposMensagens.length;
  camposMensagens.forEach((campo) => {
    if (mensagens[campo] && mensagens[campo] !== "") preenchidos++;
  });

  // Profissionais (mínimo 1)
  total += 1;
  if (config.profissionais && config.profissionais.length > 0) preenchidos++;

  // Serviços (mínimo 1)
  total += 1;
  if (config.catalogo_servicos && config.catalogo_servicos.length > 0)
    preenchidos++;

  return Math.round((preenchidos / total) * 100);
}
