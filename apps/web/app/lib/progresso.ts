import type { TenantConfig } from "~/types";

export function calcularProgressoSecao(secaoId: string, dados: TenantConfig): number {
  switch (secaoId) {
    case 'basico':
      // Sempre 100% se tiver nome e timezone (preenchido no onboarding)
      return (dados.nome && dados.timezone) ? 100 : 50;
      
    case 'regras': {
      const regras = dados.regras_negocio;
      if (!regras) return 0;
      const campos = ['tolerancia_atraso_minutos', 'cancelamento_antecedencia_horas'];
      const preenchidos = campos.filter(c => regras[c as keyof typeof regras] !== undefined).length;
      let progresso = (preenchidos / campos.length) * 80; // base: 80%
      if (regras.exige_sinal_pix !== undefined) progresso += 10;
      if (regras.exige_sinal_pix && regras.percentual_sinal) progresso += 10;
      return Math.round(progresso);
    }
      
    case 'profissionais':
      return dados.profissionais?.length > 0 ? 100 : 0;
      
    case 'servicos':
      return dados.catalogo_servicos?.length > 0 ? 100 : 0;
      
    case 'mensagens': {
      const msgs = dados.mensagens_padrao;
      if (!msgs) return 0;
      const camposMsg = ['saudacao', 'confirmacao_agendamento', 'lembrete'];
      const preenchidos = camposMsg.filter(m => msgs[m as keyof typeof msgs]?.trim()).length;
      return Math.round((preenchidos / camposMsg.length) * 100);
    }
      
    default:
      return 0;
  }
}

export function calcularProgressoTotal(dados: TenantConfig): number {
  const secoes = ['basico', 'regras', 'profissionais', 'servicos', 'mensagens'];
  const total = secoes.reduce((sum, secao) => sum + calcularProgressoSecao(secao, dados), 0);
  return Math.round(total / secoes.length);
}
