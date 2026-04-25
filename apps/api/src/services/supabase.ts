import { createClient } from '@supabase/supabase-js';

// Cliente Supabase - criado dinamicamente com credenciais do contexto
function createSupabaseClient(supabaseUrl: string, supabaseKey: string): any {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_KEY não fornecidos');
  }
  return createClient(supabaseUrl, supabaseKey);
}

interface Clinica {
  id: string;
  nome: string;
  prompt_base: string;
  perfil_negociacao?: string;
  whatsapp_id?: string;
  created_at?: string;
}

interface ConversaDB {
  id?: string;
  cliente_wa_id: string;
  clinica_id: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

async function listarClinicas(supabaseUrl: string, supabaseKey: string): Promise<Clinica[]> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, prompt_base, perfil_negociacao, whatsapp_id, created_at');

  if (error) {
    console.error('❌ Erro ao listar clínicas:', error.message);
    return [];
  }

  return data || [];
}

async function buscarClinicaPorId(id: string, supabaseUrl: string, supabaseKey: string): Promise<Clinica | null> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, prompt_base, perfil_negociacao, whatsapp_id, created_at')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar clínica:', error.message);
    return null;
  }

  return data;
}

async function criarClinica(nome: string, promptBase: string, perfilNegociacao: string, supabaseUrl: string, supabaseKey: string): Promise<string | null> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('clinicas')
    .insert({
      nome,
      prompt_base: promptBase,
      perfil_negociacao: perfilNegociacao,
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Erro ao criar clínica:', error.message);
    return null;
  }

  return data?.id || null;
}

async function buscarHistoricoConversa(clienteWaId: string, clinicaId: string, supabaseUrl: string, supabaseKey: string): Promise<ConversaDB[]> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('conversas')
    .select('id, cliente_wa_id, clinica_id, role, content, created_at')
    .eq('cliente_wa_id', clienteWaId)
    .eq('clinica_id', clinicaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    return [];
  }

  return data || [];
}

async function salvarMensagem(clienteWaId: string, clinicaId: string, role: 'user' | 'model', content: string, supabaseUrl: string, supabaseKey: string): Promise<void> {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from('conversas')
    .insert({
      cliente_wa_id: clienteWaId,
      clinica_id: clinicaId,
      role,
      content,
    });

  if (error) {
    console.error('❌ Erro ao salvar mensagem:', error.message);
  }
}

export {
  createSupabaseClient,
  listarClinicas,
  buscarClinicaPorId,
  criarClinica,
  buscarHistoricoConversa,
  salvarMensagem,
};
