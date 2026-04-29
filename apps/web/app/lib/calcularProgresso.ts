import type { TenantConfig } from "~/types";

export function calcularProgressoPerfil(dados: TenantConfig) {
  const resultados = {
    basico: 100, // sempre 100 (preenchido no onboarding)
    
    regras: (() => {
      const r = dados.regras_negocio;
      if (!r) return 0;
      let preenchidos = 0;
      if (r.tolerancia_atraso_minutos !== undefined) preenchidos++;
      if (r.exige_sinal_pix !== undefined) preenchidos++;
      if (r.cancelamento_antecedencia_horas !== undefined) preenchidos++;
      // Só conta como completo se TODOS os 3 estão preenchidos
      return preenchidos === 3 ? 100 : 0;
    })(),

    profissionais: (() => {
      const profs = dados.profissionais || [];
      return profs.length > 0 ? 100 : 0;
    })(),

    servicos: (() => {
      const servs = dados.catalogo_servicos || [];
      return servs.length > 0 ? 100 : 0;
    })(),

    mensagens: (() => {
      const m = dados.mensagens_padrao;
      if (!m) return 0;
      const customizadas = [
        m.saudacao?.trim() && m.saudacao !== 'padrão',
        m.confirmacao_agendamento?.trim() && m.confirmacao_agendamento !== 'padrão',
        m.lembrete?.trim() && m.lembrete !== 'padrão',
      ].filter(Boolean).length;
      // Se customizou pelo menos 1 mensagem = 33%, se customizou 2 = 66%, se customizou 3 = 100%
      if (customizadas === 0) return 0;
      if (customizadas === 1) return 33;
      if (customizadas === 2) return 66;
      return 100;
    })(),
  };

  const total = Object.values(resultados).reduce((a, b) => a + b, 0) / 5;
  return { detalhado: resultados, total: Math.round(total) };
}
