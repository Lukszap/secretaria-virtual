export interface Empresa {
  id: string;
  nome: string;
  nicho: string;
  telefone_whatsapp?: string;
  config_json: ConfigEmpresa;
  meta_waba_id?: string;
  meta_phone_id?: string;
  access_token?: string;
  ativo: boolean;
  created_at: string;
}

export interface ConfigEmpresa {
  nomeEmpresa: string;
  enderecoHorario: string;
  servicosPrecos: string;
  regrasPagamento: string;
  limitesMedicos: string;
  dadosAgendamento: string;
  perfilNegociacao: 'Equilibrado' | 'Duro' | 'Facil';
  brindesDescontos: string;
  servicosComplementares: string;
  restricoesAgenda: string;
}

export interface Conversa {
  id: string;
  empresa_id: string;
  cliente_telefone: string;
  messages: Message[];
  last_message_at: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
