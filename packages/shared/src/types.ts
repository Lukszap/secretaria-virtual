// =============================================================================
// TIPAGENS SAAS MULTI-TENANT - SECRETARIA VIRTUAL PARA BELEZA E ESTÉTICA
// =============================================================================

// =============================================================================
// ENUMS E TIPOS AUXILIARES
// =============================================================================

export type PlanoTenant = 'gratuito' | 'basico' | 'pro' | 'enterprise';

export type StatusConversa = 
  | 'bot_active' 
  | 'human_requested' 
  | 'human_active' 
  | 'closed';

export type TipoMensagem = 'inbound' | 'outbound';

export type OrigemMensagem = 'whatsapp' | 'instagram' | 'sistema' | 'humano';

export type StatusAgendamento = 
  | 'confirmado' 
  | 'cancelado' 
  | 'concluido' 
  | 'no_show';

export type StatusAcao = 'pending' | 'completed' | 'failed';

export type AcaoIA = 
  | 'agendar_horario' 
  | 'chamar_recepcionista_humana'
  | 'verificar_disponibilidade'
  | 'cancelar_agendamento'
  | 'alterar_agendamento'
  | 'consultar_precos';

export type IntencaoCliente = 
  | 'agendamento'
  | 'duvida'
  | 'reclamacao'
  | 'cancelamento'
  | 'alteracao'
  | 'preco'
  | 'disponibilidade'
  | 'saudacao'
  | 'outro';

// =============================================================================
// CONFIGURAÇÕES JSONB - Estruturas aninhadas
// =============================================================================

export interface HorarioDia {
  abre: string;    // HH:MM
  fecha: string;   // HH:MM
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

export interface ServicoCatalogo {
  slug: string;           // Identificador único: "corte-feminino", "manicure"
  nome: string;           // Nome exibido: "Corte Feminino"
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  categoria: string;      // "cabelo", "unha", "depilacao", "estetica", etc
  profissionais_habilitados: string[]; // IDs dos profissionais
  requer_foto_referencia?: boolean;    // Para coloração, tatuagem, etc
  ativo: boolean;
}

export interface Profissional {
  id: string;
  nome: string;
  foto_url?: string;
  especialidades: string[]; // slugs dos serviços
  horarios_disponiveis?: HorarioFuncionamento;
  ativo: boolean;
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

export interface ConfiguracoesTenant {
  catalogo_servicos: ServicoCatalogo[];
  profissionais: Profissional[];
  horario_funcionamento: HorarioFuncionamento;
  regras_negocio: RegrasNegocio;
  mensagens_padrao: MensagensPadrao;
}

// =============================================================================
// TABELA: TENANTS (Clínicas/Salões)
// =============================================================================

export interface Tenant {
  id: string;
  
  // Identificação
  nome: string;
  slug: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  
  // WhatsApp Business
  whatsapp_phone_number_id?: string;
  whatsapp_waba_id?: string;
  whatsapp_access_token_encrypted?: string;
  
  // Configurações do Negócio
  configuracoes: ConfiguracoesTenant;
  
  // Plano e Limites
  plano: PlanoTenant;
  limite_mensagens_mes: number;
  mensagens_usadas_mes: number;
  limite_agendamentos_mes: number;
  
  // Status
  ativo: boolean;
  trial_ate?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TABELA: CLIENTES
// =============================================================================

export interface Cliente {
  id: string;
  tenant_id: string;
  
  // Identificação
  nome?: string;
  telefone: string;
  email?: string;
  data_nascimento?: string; // ISO date YYYY-MM-DD
  
  // Preferências
  preferencias: {
    profissional_favorito?: string;
    alergias?: string[];
    observacoes?: string;
    [key: string]: unknown;
  };
  historico_servicos: {
    servico_slug: string;
    data: string;
    profissional_id?: string;
    [key: string]: unknown;
  }[];
  
  // WhatsApp
  whatsapp_name?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TABELA: CONVERSAS
// =============================================================================

export interface DadosColetados {
  servico_desejado?: string | null;      // slug do serviço
  profissional_preferido?: string | null; // id ou nome
  data_preferida?: string | null;        // YYYY-MM-DD
  hora_preferida?: string | null;        // HH:MM
  nome_cliente?: string | null;
  foi_saudado: boolean;
  ultima_acao?: AcaoIA | null;
  foto_referencia_solicitada?: boolean;
  [key: string]: unknown;
}

export interface Conversa {
  id: string;
  tenant_id: string;
  cliente_id: string;
  
  // Status do Atendimento
  status: StatusConversa;
  bot_active: boolean;
  human_escalation_requested_at?: string;
  
  // Dados Coletados (Contexto para IA)
  dados_coletados: DadosColetados;
  
  // Rate Limiting
  ultima_mensagem_cliente_at?: string;
  mensagens_seguidas_cliente: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TABELA: MENSAGENS
// =============================================================================

export interface AcaoDisparada {
  tipo: AcaoIA;
  payload: Record<string, unknown>;
  status: StatusAcao;
  resultado?: Record<string, unknown>;
  erro?: string;
}

export interface Mensagem {
  id: string;
  tenant_id: string;
  conversa_id: string;
  cliente_id: string;
  
  // Dados da Mensagem
  tipo: TipoMensagem;
  origem: OrigemMensagem;
  conteudo: string;
  
  // Metadados WhatsApp
  wa_message_id?: string;
  wa_context_message_id?: string;
  
  // Processamento IA
  processada_por_ia: boolean;
  intencao_detectada?: IntencaoCliente;
  confianca_ia?: number; // 0.00 a 1.00
  
  // Action Engine
  acao_disparada?: AcaoIA;
  acao_payload?: Record<string, unknown>;
  acao_status?: StatusAcao;
  
  // Timestamp
  created_at: string;
}

// =============================================================================
// TABELA: AGENDAMENTOS
// =============================================================================

export interface Agendamento {
  id: string;
  tenant_id: string;
  cliente_id: string;
  conversa_id?: string;
  
  // Serviço
  servico_slug: string;
  servico_nome: string;
  servico_preco?: number;
  duracao_minutos?: number;
  
  // Profissional
  profissional_id?: string;
  profissional_nome?: string;
  
  // Data e Hora
  data_agendamento: string; // YYYY-MM-DD
  hora_inicio: string;      // HH:MM
  hora_fim?: string;        // HH:MM
  
  // Status
  status: StatusAgendamento;
  
  // Pagamento
  sinal_pago: boolean;
  valor_sinal?: number;
  
  // Observações
  observacoes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  cancelado_em?: string;
  cancelado_motivo?: string;
}

// =============================================================================
// REQUESTS E RESPONSES DA API
// =============================================================================

export interface WebhookMetaPayload {
  object: string;
  entry: {
    id: string;
    time: number;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: {
          wa_id: string;
          profile: { name: string };
        }[];
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string };
          audio?: { id: string; mime_type: string };
        }[];
        statuses?: unknown[];
      };
      field: string;
    }[];
  }[];
}

// =============================================================================
// ACTION ENGINE - Tools/Functions para Gemini
// =============================================================================

export interface ToolAgendarHorario {
  name: 'agendar_horario';
  parameters: {
    servico: string;           // slug do serviço
    profissional_preferencia?: string;
    data_hora: string;         // ISO 8601
    nome_cliente: string;
    telefone_cliente: string;
    observacoes?: string;
  };
}

export interface ToolChamarRecepcionista {
  name: 'chamar_recepcionista_humana';
  parameters: {
    motivo: string;
    urgencia: 'baixa' | 'media' | 'alta';
    contexto?: string;
  };
}

export interface ToolCancelarAgendamento {
  name: 'cancelar_agendamento';
  parameters: {
    agendamento_id?: string;
    telefone_cliente: string;
    motivo?: string;
  };
}

export interface ToolVerificarDisponibilidade {
  name: 'verificar_disponibilidade';
  parameters: {
    servico: string;
    data: string;              // YYYY-MM-DD
    profissional_preferencia?: string;
  };
}

export type GeminiTool = 
  | ToolAgendarHorario 
  | ToolChamarRecepcionista 
  | ToolCancelarAgendamento
  | ToolVerificarDisponibilidade;

// =============================================================================
// CONFIGURAÇÕES DO WORKER (Wrangler Bindings)
// =============================================================================

export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  
  // Meta WhatsApp
  WHATSAPP_ACCESS_TOKEN: string;
  PHONE_NUMBER_ID: string;
  META_VERIFY_TOKEN: string;
  
  // Gemini
  GEMINI_API_KEY: string;
  
  // Opcional: para criptografia
  ENCRYPTION_KEY?: string;
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

export interface SystemPromptContext {
  tenant: Tenant;
  cliente: Cliente;
  conversa: Conversa;
  historico_mensagens: Mensagem[];
  agendamentos_pendentes?: Agendamento[];
}

export interface ProcessingResult {
  resposta: string;
  acao?: AcaoDisparada;
  dados_atualizados?: Partial<DadosColetados>;
}
