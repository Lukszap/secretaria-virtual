export interface SecaoConfiguracao {
  id: 'basico' | 'regras' | 'profissionais' | 'servicos' | 'mensagens';
  titulo: string;
  descricao: string;
  icon: string;
  progresso: number; // 0-100
  campos: string[]; // quais campos verificar
}

export interface TenantConfig {
  nome: string;
  timezone: string;
  whatsapp_phone_number_id: string;
  whatsapp_dono: string;
  regras_negocio?: {
    tolerancia_atraso_minutos?: number;
    exige_sinal_pix?: boolean;
    percentual_sinal?: number;
    cancelamento_antecedencia_horas?: number;
    tempo_minimo_entre_agendamentos_minutos?: number;
    permite_agendamento_futuro_dias?: number;
  };
  profissionais: Array<{
    id: string;
    nome: string;
    especialidades: string[];
    dias_trabalho: string[];
  }>;
  catalogo_servicos: Array<{
    slug: string;
    nome: string;
    duracao_minutos: number;
    preco: number;
    profissionais_habilitados: string[];
  }>;
  mensagens_padrao?: {
    saudacao?: string;
    confirmacao_agendamento?: string;
    lembrete?: string;
    fallback_ia?: string;
  };
}
