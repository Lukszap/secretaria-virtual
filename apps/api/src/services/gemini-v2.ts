import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FunctionDeclaration, Tool } from '@google/generative-ai';
import type { Tenant, Cliente, Conversa, Mensagem, Env, IntencaoCliente, AcaoIA } from '../../../../packages/shared/src/types.js';

// =============================================================================
// TYPES PARA ACTION ENGINE
// =============================================================================

export interface ActionResult {
  tipo: 'agendar_horario' | 'chamar_recepcionista_humana' | 'verificar_disponibilidade' | null;
  payload?: Record<string, unknown>;
  executado: boolean;
  erro?: string;
}

export interface GeminiResponse {
  texto: string;
  action?: ActionResult | undefined;
  intencao: string;
  confianca: number;
}

// =============================================================================
// TOOLS (Function Calling) - Declaração das funções para o Gemini
// =============================================================================

const toolAgendarHorario = {
  name: 'agendar_horario',
  description: 'Agenda um horário para o cliente quando todos os dados necessários foram coletados',
  parameters: {
    type: 'object' as const,
    properties: {
      servico: {
        type: 'string' as const,
        description: 'Slug do serviço escolhido (ex: corte-feminino, manicure)'
      },
      profissional_preferencia: {
        type: 'string' as const,
        description: 'ID ou nome do profissional preferido (opcional)'
      },
      data: {
        type: 'string' as const,
        description: 'Data do agendamento no formato YYYY-MM-DD'
      },
      hora: {
        type: 'string' as const,
        description: 'Hora do agendamento no formato HH:MM'
      },
      nome_cliente: {
        type: 'string' as const,
        description: 'Nome completo do cliente'
      },
      telefone_cliente: {
        type: 'string' as const,
        description: 'Telefone do cliente com DDD'
      },
      observacoes: {
        type: 'string' as const,
        description: 'Observações adicionais (opcional)'
      }
    },
    required: ['servico', 'data', 'hora', 'nome_cliente', 'telefone_cliente']
  }
};

const toolChamarRecepcionista = {
  name: 'chamar_recepcionista_humana',
  description: 'Chama um atendente humano quando o cliente solicita',
  parameters: {
    type: 'object' as const,
    properties: {
      motivo: {
        type: 'string' as const,
        description: 'Motivo da escalação: cliente_solicitou, reclamacao, emergencia_medica, duvida_complexa, etc'
      },
      urgencia: {
        type: 'string' as const,
        enum: ['baixa', 'media', 'alta'],
        description: 'Nível de urgência da solicitação'
      },
      contexto: {
        type: 'string' as const,
        description: 'Resumo da situação para o atendente humano'
      }
    },
    required: ['motivo', 'urgencia']
  }
};

const toolVerificarDisponibilidade = {
  name: 'verificar_disponibilidade',
  description: 'Verifica horários disponíveis ANTES de sugerir ao cliente. USE SEMPRE antes de oferecer horários!',
  parameters: {
    type: 'object' as const,
    properties: {
      servico: {
        type: 'string' as const,
        description: 'Slug do serviço'
      },
      data: {
        type: 'string' as const,
        description: 'Data para verificar (YYYY-MM-DD)'
      },
      profissional_id: {
        type: 'string' as const,
        description: 'ID do profissional (opcional)'
      }
    },
    required: ['servico', 'data']
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: any[] = [
  { functionDeclarations: [toolAgendarHorario, toolChamarRecepcionista, toolVerificarDisponibilidade] }
];

// =============================================================================
// CONSTRUTOR DE SYSTEM PROMPT DINÂMICO
// =============================================================================

function formatarServicos(tenant: Tenant): string {
  const servicos = tenant.configuracoes.catalogo_servicos || [];
  if (servicos.length === 0) return '- Nenhum serviço cadastrado';
  
  return servicos.map((s: { nome: string; preco: number; duracao_minutos: number; slug: string; requer_foto_referencia?: boolean; profissionais_habilitados?: string[] }) => {
    const habilitados = s.profissionais_habilitados;
    const profissionais = habilitados && habilitados.length > 0
      ? `(Profissionais: ${habilitados.join(', ')})`
      : '';
    const foto = s.requer_foto_referencia ? ' [REQUER FOTO DE REFERÊNCIA]' : '';
    return `- ${s.nome}: R$${s.preco} (${s.duracao_minutos}min) - ID: "${s.slug}"${foto} ${profissionais}`;
  }).join('\n');
}

function formatarProfissionais(tenant: Tenant): string {
  const profs = tenant.configuracoes.profissionais || [];
  if (profs.length === 0) return '- Nenhum profissional cadastrado';
  
  return profs.map((p: { nome: string; id: string; especialidades?: string[] }) => {
    const especs = p.especialidades?.join(', ') || 'Geral';
    return `- ${p.nome} (ID: "${p.id}"): ${especs}`;
  }).join('\n');
}

function formatarHorarios(tenant: Tenant): string {
  const hor = tenant.configuracoes.horario_funcionamento;
  if (!hor) return '- Horário não configurado';
  
  const dias = [
    ['seg', 'Segunda'], ['ter', 'Terça'], ['qua', 'Quarta'], 
    ['qui', 'Quinta'], ['sex', 'Sexta'], ['sab', 'Sábado'], ['dom', 'Domingo']
  ] as const;
  
  return dias.map(([key, nome]) => {
    const h = hor[key as keyof typeof hor];
    return h?.aberto 
      ? `- ${nome}: ${h.abre} às ${h.fecha}`
      : `- ${nome}: Fechado`;
  }).join('\n');
}

function buildSystemPrompt(tenant: Tenant, cliente: Cliente): string {
  const config = tenant.configuracoes;
  const regras = config.regras_negocio;
  const msgs = config.mensagens_padrao;
  
  return `
Você é a assistente virtual do ${tenant.nome}. Sua missão é converter conversas em agendamentos confirmados.

📋 CATÁLOGO DE SERVIÇOS (obrigatório usar apenas estes):
${formatarServicos(tenant)}

👥 PROFISSIONAIS DISPONÍVEIS:
${formatarProfissionais(tenant)}

🕐 HORÁRIO DE FUNCIONAMENTO:
${formatarHorarios(tenant)}

📌 REGRAS DO NEGÓCIO:
- Tolerância de atraso: ${regras?.tolerancia_atraso_minutos || 15} minutos
- Exige sinal Pix: ${regras?.exige_sinal_pix ? 'Sim (' + (regras?.percentual_sinal || 30) + '%)' : 'Não'}
- Cancelamento com antecedência: ${regras?.cancelamento_antecedencia_horas || 24}h
- Agendamento máximo antecedência: ${regras?.permite_agendamento_futuro_dias || 60} dias

🎯 FLUXO DE ATENDIMENTO OBRIGATÓRIO:
1. SAUDAÇÃO: ${msgs?.saudacao?.replace('{nome_salao}', tenant.nome) || 'Olá! Como posso ajudar?'}
2. TRIAGEM: Identificar qual serviço o cliente deseja
3. PROFISSIONAL: Perguntar se tem preferência (ou sugerir)
4. FOTO: Se o serviço requer (ex: coloração, tatuagem), solicitar foto de referência
5. DATA/HORA: Oferecer 2-3 opções específicas (criar escassez)
6. DADOS: Coletar nome completo e telefone
7. CONFIRMAÇÃO: Usar tool agendar_horario() quando tudo estiver coletado

🚫 REGRAS ABSOLUTAS:
- **NUNCA NUNCA NUNCA** invente horários disponíveis! Sempre use verificar_disponibilidade() primeiro!
- **NUNCA** sugira horários sem consultar disponibilidade real - isso é PROIBIDO!
- **NUNCA** confirme agendamento sem ter: serviço confirmado + data exata + hora exata + nome do cliente!
- **NUNCA** invente serviços, preços ou profissionais - use apenas o catálogo acima
- **NUNCA** dê diagnósticos médicos ou prometa resultados
- Se cliente pedir atendente humano ou houver reclamação séria, use chamar_recepcionista_humana()

✅ FLUXO CORRETO PARA AGENDAMENTO:
1. Cliente escolhe serviço
2. USE verificar_disponibilidade() para ver horários reais
3. Sugira apenas horários que retornaram como disponíveis
4. Confirme nome do cliente (já temos telefone: ${cliente.telefone})
5. SÓ ENTÃO use agendar_horario() com todos os dados
6. APÓS agendar_horario(), confirme: "✅ Agendamento confirmado! [Serviço] com [Profissional] no dia [Data] às [Hora]. Te esperamos!"

💡 DADOS DO CLIENTE ATUAL:
${cliente.nome ? `- Nome: ${cliente.nome}` : '- Nome: não informado'}
- Telefone: ${cliente.telefone}
${cliente.preferencias?.profissional_favorito ? `- Profissional favorito: ${cliente.preferencias.profissional_favorito}` : ''}
`.trim();
}

// =============================================================================
// BUSCAR DADOS DO BANCO
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function buscarTenant(supabase: SupabaseClient, tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();
  
  if (error) {
    console.error('❌ Erro ao buscar tenant:', error.message);
    return null;
  }
  return data as Tenant;
}

async function buscarOuCriarCliente(
  supabase: SupabaseClient, 
  tenantId: string, 
  telefone: string, 
  nomeWhatsApp?: string
): Promise<Cliente | null> {
  // Buscar existente
  let { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('telefone', telefone)
    .single();
  
  if (data) return data as Cliente;
  
  // Criar novo
  const { data: novo, error: erroInsert } = await supabase
    .from('clientes')
    .insert({
      tenant_id: tenantId,
      telefone,
      nome: nomeWhatsApp,
      whatsapp_name: nomeWhatsApp,
      preferencias: {},
      historico_servicos: []
    })
    .select('*')
    .single();
  
  if (erroInsert) {
    console.error('❌ Erro ao criar cliente:', erroInsert.message);
    return null;
  }
  return novo as Cliente;
}

async function buscarConversa(
  supabase: SupabaseClient,
  tenantId: string,
  clienteId: string
): Promise<Conversa | null> {
  const { data, error } = await supabase
    .from('conversas')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cliente_id', clienteId)
    .single();
  
  if (error) {
    // Se for erro de "não encontrado", criar nova conversa
    if (error.message.includes('0 rows') || error.code === 'PGRST116') {
      console.log('📝 Criando nova conversa...');
      const { data: nova, error: erroInsert } = await supabase
        .from('conversas')
        .insert({
          tenant_id: tenantId,
          cliente_id: clienteId,
          status: 'bot_active',
          bot_active: true,
          dados_coletados: {
            foi_saudado: false,
            servico_desejado: null,
            profissional_preferido: null,
            data_preferida: null,
            hora_preferida: null,
            nome_cliente: null
          }
        })
        .select('*')
        .single();
      
      if (erroInsert) {
        console.error('❌ Erro ao criar conversa:', erroInsert.message, erroInsert.code);
        return null;
      }
      return nova as Conversa;
    }
    
    // Outro erro
    console.error('❌ Erro ao buscar conversa:', error.message, error.code);
    return null;
  }
  
  return data as Conversa;
}

async function buscarHistoricoMensagens(
  supabase: SupabaseClient,
  conversaId: string,
  limite = 10
): Promise<Mensagem[]> {
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(limite);
  
  if (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    return [];
  }
  return (data as Mensagem[]).reverse(); // Ordenar cronologicamente
}

// =============================================================================
// SALVAR DADOS NO BANCO
// =============================================================================

async function salvarMensagem(
  supabase: SupabaseClient,
  mensagem: Omit<Mensagem, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('mensagens')
    .insert(mensagem);
  
  if (error) {
    console.error('❌ Erro ao salvar mensagem:', error.message);
  }
}

async function atualizarDadosColetados(
  supabase: SupabaseClient,
  conversaId: string,
  dados: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('conversas')
    .update({ dados_coletados: dados, updated_at: new Date().toISOString() })
    .eq('id', conversaId);
  
  if (error) {
    console.error('❌ Erro ao atualizar dados coletados:', error.message);
  }
}

async function atualizarStatusConversa(
  supabase: SupabaseClient,
  conversaId: string,
  status: string,
  botActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from('conversas')
    .update({ status, bot_active: botActive, updated_at: new Date().toISOString() })
    .eq('id', conversaId);
  
  if (error) {
    console.error('❌ Erro ao atualizar status:', error.message);
  }
}

// =============================================================================
// MOTOR PRINCIPAL: generateGeminiResponse
// =============================================================================

export async function generateGeminiResponse(
  supabase: SupabaseClient,
  env: Env,
  tenantId: string,
  telefoneCliente: string,
  mensagemCliente: string,
  nomeWhatsApp?: string
): Promise<GeminiResponse> {
  
  // 1. BUSCAR CONFIGURAÇÕES DO TENANT
  const tenant = await buscarTenant(supabase, tenantId);
  if (!tenant) {
    return {
      texto: 'Desculpe, não conseguimos acessar suas configurações. Tente novamente em instantes.',
      intencao: 'erro',
      confianca: 0
    };
  }
  
  // 2. BUSCAR OU CRIAR CLIENTE
  const cliente = await buscarOuCriarCliente(supabase, tenantId, telefoneCliente, nomeWhatsApp);
  if (!cliente) {
    return {
      texto: 'Desculpe, tivemos um problema ao acessar seus dados.',
      intencao: 'erro',
      confianca: 0
    };
  }
  
  // 3. BUSCAR CONVERSA
  const conversa = await buscarConversa(supabase, tenantId, cliente.id);
  if (!conversa) {
    return {
      texto: 'Desculpe, não conseguimos iniciar sua conversa.',
      intencao: 'erro',
      confianca: 0
    };
  }
  
  // 4. VERIFICAR SE BOT ESTÁ PAUSADO (HUMANO ATIVO)
  if (!conversa.bot_active || conversa.status === 'human_active') {
    return {
      texto: '', // Não responder - humano está no controle
      intencao: 'humano_ativo',
      confianca: 1
    };
  }
  
  // 5. SALVAR MENSAGEM DO CLIENTE
  await salvarMensagem(supabase, {
    tenant_id: tenantId,
    conversa_id: conversa.id,
    cliente_id: cliente.id,
    tipo: 'inbound',
    origem: 'whatsapp',
    conteudo: mensagemCliente,
    processada_por_ia: false
  });
  
  // 6. BUSCAR HISTÓRICO (últimas 10 mensagens)
  const historico = await buscarHistoricoMensagens(supabase, conversa.id, 10);
  
  // 7. CONSTRUIR SYSTEM INSTRUCTION DINÂMICO
  const systemInstruction = buildSystemPrompt(tenant, cliente);
  
  // 8. MONTAR HISTÓRICO PARA GEMINI
  // Filtrar apenas mensagens com conteúdo e garantir que comece com 'user'
  const mensagensValidas = historico.filter(msg => msg.conteudo?.trim());
  
  // Gemini exige que histórico comece com 'user' e alterne user/model
  const history: {role: string, parts: {text: string}[]}[] = [];
  let lastRole: string | null = null;
  
  for (const msg of mensagensValidas) {
    const role = msg.tipo === 'inbound' ? 'user' : 'model';
    // Pular se mesma role repetida (agrupar ou pular)
    if (role === lastRole) {
      // Se for mesmo role, adiciona ao último conteúdo ou pula
      continue;
    }
    history.push({ role, parts: [{ text: msg.conteudo }] });
    lastRole = role;
  }
  
  // Se histórico começar com 'model', remover (Gemini exige começar com 'user')
  if (history.length > 0 && history[0]!.role === 'model') {
    history.shift();
  }
  
  // 9. INICIALIZAR GEMINI
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', //NUNCA MEXER Na versao CASCADE , só se existir um comando especifico pra isso
    generationConfig: { temperature: 0.2 },
    systemInstruction,
    tools
  });
  
  // 10. ENVIAR PARA GEMINI
  const chat = model.startChat({ history });
  const geminiResult = await chat.sendMessage(mensagemCliente);
  const response = geminiResult.response;
  
  // 11. PROCESSAR FUNCTION CALLS (ACTION ENGINE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionCalls = (response as any).functionCalls?.() || [];
  let actionResult: ActionResult | undefined;
  
  if (functionCalls.length > 0) {
    const call = functionCalls[0];
    if (!call) {
      return {
        texto: response.text(),
        intencao: 'conversa',
        confianca: 0.9
      };
    }
    
    if (call.name === 'agendar_horario') {
      actionResult = {
        tipo: 'agendar_horario',
        payload: call.args as Record<string, unknown>,
        executado: false // Será executado pelo handler externo
      };
    } else if (call.name === 'chamar_recepcionista_humana') {
      actionResult = {
        tipo: 'chamar_recepcionista_humana',
        payload: call.args as Record<string, unknown>,
        executado: false
      };
      // Pausar bot
      await atualizarStatusConversa(supabase, conversa.id, 'human_requested', false);
    } else if (call.name === 'verificar_disponibilidade') {
      actionResult = {
        tipo: 'verificar_disponibilidade',
        payload: call.args as Record<string, unknown>,
        executado: false
      };
    }
  }
  
  // 12. EXTRAIR TEXTO DA RESPOSTA
  const textoResposta = geminiResult.response.text();
  
  // 13. SALVAR RESPOSTA DA IA NO BANCO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mensagemData: any = {
    tenant_id: tenantId,
    conversa_id: conversa.id,
    cliente_id: cliente.id,
    tipo: 'outbound',
    origem: 'sistema',
    conteudo: textoResposta,
    processada_por_ia: true,
    intencao_detectada: (actionResult?.tipo as IntencaoCliente) || 'outro'
  };
  
  if (actionResult) {
    mensagemData.acao_disparada = actionResult.tipo as AcaoIA;
    mensagemData.acao_payload = actionResult.payload;
    mensagemData.acao_status = 'pending' as const;
  }
  
  await salvarMensagem(supabase, mensagemData);
  
  // 14. EXTRAIR E PERSISTIR DADOS COLETADOS
  const novosDados = { ...conversa.dados_coletados };
  
  // Extrair nome do cliente da mensagem atual (padrões comuns)
  const nomeMatch = mensagemCliente.match(/(?:meu nome é|sou|chamo[\s-]?me)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
  if (nomeMatch && nomeMatch[1] && !novosDados.nome_cliente) {
    novosDados.nome_cliente = nomeMatch[1].trim().split(/\s+(?:e\s+meu\s+telefone|meu\s+telefone|telefone)/i)[0]!.trim();
    console.log('📝 Nome extraído:', novosDados.nome_cliente);
  }
  
  // Extrair telefone da mensagem (se cliente fornecer diferente)
  const telMatch = mensagemCliente.match(/(\d{10,11})/);
  if (telMatch && !novosDados.telefone_confirmado) {
    novosDados.telefone_confirmado = telMatch[1];
    console.log('📝 Telefone confirmado:', novosDados.telefone_confirmado);
  }
  
  // Extrair serviço desejado
  const servicosNomes = tenant.configuracoes.catalogo_servicos.map(s => s.nome.toLowerCase());
  for (const nomeServico of servicosNomes) {
    if (mensagemCliente.toLowerCase().includes(nomeServico.toLowerCase())) {
      novosDados.servico_desejado = nomeServico;
      console.log('📝 Serviço detectado:', nomeServico);
      break;
    }
  }
  
  // Salvar se houver mudanças
  if (JSON.stringify(novosDados) !== JSON.stringify(conversa.dados_coletados)) {
    await atualizarDadosColetados(supabase, conversa.id, novosDados);
    console.log('💾 Dados coletados atualizados');
  }
  
  const responseData: GeminiResponse = {
    texto: textoResposta,
    action: actionResult,
    intencao: actionResult?.tipo || 'outro',
    confianca: 0.9
  };
  return responseData;
}

// =============================================================================
// FUNÇÃO PARA DETECTAR ECHO (HUMANO NO WHATSAPP WEB)
// =============================================================================

export async function processarEchoHumano(
  supabase: SupabaseClient,
  tenantId: string,
  telefoneCliente: string,
  conteudoMensagem: string
): Promise<boolean> {
  
  // Buscar cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('telefone', telefoneCliente)
    .single();
  
  if (!cliente) return false;
  
  // Buscar conversa
  const { data: conversa } = await supabase
    .from('conversas')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cliente_id', cliente.id)
    .single();
  
  if (!conversa) return false;
  
  // Salvar mensagem como originada de humano
  await salvarMensagem(supabase, {
    tenant_id: tenantId,
    conversa_id: conversa.id,
    cliente_id: cliente.id,
    tipo: 'outbound',
    origem: 'humano', // <-- Importante: marca como humano
    conteudo: conteudoMensagem,
    processada_por_ia: false
  });
  
  // PAUSAR BOT (humano assumiu o controle)
  await atualizarStatusConversa(supabase, conversa.id, 'human_active', false);
  
  console.log(`🧑‍💼 Humano assumiu controle da conversa ${conversa.id}`);
  return true;
}

// Exportações
export { buildSystemPrompt, formatarServicos };
