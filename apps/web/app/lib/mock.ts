// Flag de controle
export const USE_MOCK = true; // mudar para false quando backend estiver pronto

// Types
export interface Servico {
  nome: string;
  preco: number;
  duracao_minutos: number;
  slug: string;
  profissionais_habilitados: string[];
  requer_foto_referencia: boolean;
}

export interface Profissional {
  nome: string;
  id: string;
  especialidades: string[];
  dias_trabalho: string[];
}

export interface HorarioDia {
  abre: string;
  fecha: string;
  aberto: boolean;
}

export interface HorarioFuncionamento {
  seg: HorarioDia;
  ter: HorarioDia;
  qua: HorarioDia;
  qui: HorarioDia;
  sex: HorarioDia;
  sab: HorarioDia;
  dom: HorarioDia;
}

export interface RegrasNegocio {
  tolerancia_atraso_minutos: number;
  exige_sinal_pix: boolean;
  percentual_sinal: number;
  cancelamento_antecedencia_horas: number;
  tempo_minimo_entre_agendamentos_minutos: number;
  permite_agendamento_futuro_dias: number;
}

export interface MensagensPadrao {
  saudacao: string;
  confirmacao_agendamento: string;
  lembrete: string;
  fallback_ia: string;
}

export interface Configuracoes {
  timezone: string;
  catalogo_servicos: Servico[];
  profissionais: Profissional[];
  horario_funcionamento: HorarioFuncionamento;
  regras_negocio: RegrasNegocio;
  mensagens_padrao: MensagensPadrao;
}

export interface Tenant {
  id: string;
  nome: string;
  configuracoes: Configuracoes;
  whatsapp_dono: string;
  whatsapp_phone_number_id?: string;
}

// Tenant mock completo
export const mockTenant: Tenant = {
  id: "mock-tenant-123",
  nome: "Salão Bella Rosa",
  configuracoes: {
    timezone: "America/Sao_Paulo",
    catalogo_servicos: [
      {
        nome: "Corte Feminino",
        preco: 80,
        duracao_minutos: 60,
        slug: "corte-feminino",
        profissionais_habilitados: ["maria"],
        requer_foto_referencia: false,
      },
      {
        nome: "Manicure",
        preco: 45,
        duracao_minutos: 45,
        slug: "manicure",
        profissionais_habilitados: ["ana"],
        requer_foto_referencia: false,
      },
      {
        nome: "Coloração",
        preco: 180,
        duracao_minutos: 120,
        slug: "coloracao",
        profissionais_habilitados: ["maria"],
        requer_foto_referencia: true,
      },
    ],
    profissionais: [
      {
        nome: "Maria Silva",
        id: "maria",
        especialidades: ["corte-feminino", "coloracao"],
        dias_trabalho: ["seg", "ter", "qua", "qui", "sex"],
      },
      {
        nome: "Ana Costa",
        id: "ana",
        especialidades: ["manicure"],
        dias_trabalho: ["ter", "qui", "sex", "sab"],
      },
    ],
    horario_funcionamento: {
      seg: { abre: "09:00", fecha: "18:00", aberto: true },
      ter: { abre: "09:00", fecha: "18:00", aberto: true },
      qua: { abre: "09:00", fecha: "18:00", aberto: true },
      qui: { abre: "09:00", fecha: "18:00", aberto: true },
      sex: { abre: "09:00", fecha: "18:00", aberto: true },
      sab: { abre: "09:00", fecha: "14:00", aberto: true },
      dom: { abre: "09:00", fecha: "14:00", aberto: false },
    },
    regras_negocio: {
      tolerancia_atraso_minutos: 15,
      exige_sinal_pix: false,
      percentual_sinal: 30,
      cancelamento_antecedencia_horas: 24,
      tempo_minimo_entre_agendamentos_minutos: 30,
      permite_agendamento_futuro_dias: 60,
    },
    mensagens_padrao: {
      saudacao:
        "Olá! Sou a assistente virtual do {nome_salao}. Como posso te ajudar hoje? 💅",
      confirmacao_agendamento:
        "Seu agendamento foi confirmado! Te esperamos no dia {data} às {hora}. ✨",
      lembrete:
        "Lembrete: Você tem um agendamento amanhã às {hora}. Nos vemos lá! 💖",
      fallback_ia:
        "Só um minutinho, estou processando sua mensagem... ⏳",
    },
  },
  whatsapp_dono: "5535999990000",
};

// Simular delay de rede
export const mockDelay = (ms = 600) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock das funções de API
export const mockApi = {
  criarTenant: async (dados: Partial<Tenant>): Promise<Tenant> => {
    await mockDelay();
    return { ...mockTenant, ...dados };
  },
  atualizarConfiguracoes: async (
    tenantId: string,
    dados: Partial<Configuracoes>
  ): Promise<{ success: boolean; configuracoes: Configuracoes }> => {
    await mockDelay();
    const merged = {
      ...mockTenant.configuracoes,
      ...dados,
    };
    return { success: true, configuracoes: merged as Configuracoes };
  },
  atualizarWhatsappDono: async (
    tenantId: string,
    whatsapp: string
  ): Promise<{ whatsapp_dono: string }> => {
    await mockDelay();
    return { whatsapp_dono: whatsapp };
  },
  obterTenant: async (tenantId: string): Promise<Tenant> => {
    await mockDelay();
    return mockTenant;
  },
};
