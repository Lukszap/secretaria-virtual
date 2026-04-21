import supabaseJs = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL ou SUPABASE_KEY não definidos no .env');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseJs.createClient(supabaseUrl, supabaseKey);

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

async function listarClinicas(): Promise<Clinica[]> {
  const { data, error } = await supabase
    .from('clinicas')
    .select('id, nome, prompt_base, perfil_negociacao, whatsapp_id, created_at');

  if (error) {
    console.error('❌ Erro ao listar clínicas:', error.message);
    return [];
  }

  return data || [];
}

async function buscarClinicaPorId(id: string): Promise<Clinica | null> {
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

async function criarClinica(nome: string, promptBase: string, perfilNegociacao: string): Promise<string | null> {
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

async function buscarHistoricoConversa(clienteWaId: string, clinicaId: string): Promise<ConversaDB[]> {
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

async function salvarMensagem(clienteWaId: string, clinicaId: string, role: 'user' | 'model', content: string): Promise<void> {
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

export = {
  supabase,
  listarClinicas,
  buscarClinicaPorId,
  criarClinica,
  buscarHistoricoConversa,
  salvarMensagem,
};
