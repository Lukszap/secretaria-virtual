import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Toggle } from "~/components/ui/Toggle";
import { SimpleSlider } from "~/components/ui/SimpleSlider";
import { useLocalStorage, clearAllTestData } from "~/hooks/useLocalStorage";
import { useModal } from "~/hooks/useModal";
import { ModalProfissionais } from "~/components/perfil/ModalProfissionais";
import { ModalServicos } from "~/components/perfil/ModalServicos";
import { mockTenant } from "~/lib/mock";
import { calcularProgressoPerfil } from "~/lib/calcularProgresso";
import type { TenantConfig } from "~/types";

const TIMEZONES_BR = [
  { value: "America/Sao_Paulo", label: "São Paulo (Brasília)" },
  { value: "America/Rio_de_Janeiro", label: "Rio de Janeiro" },
  { value: "America/Salvador", label: "Salvador" },
  { value: "America/Fortaleza", label: "Fortaleza" },
  { value: "America/Recife", label: "Recife" },
  { value: "America/Belem", label: "Belém" },
  { value: "America/Manaus", label: "Manaus" },
  { value: "America/Cuiaba", label: "Cuiabá" },
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const modal = useModal();
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);
  
  const [dados, setDados] = useLocalStorage<TenantConfig>(
    "tenant_config",
    {
      nome: mockTenant.nome,
      timezone: mockTenant.configuracoes.timezone,
      whatsapp_phone_number_id: mockTenant.whatsapp_phone_number_id || "",
      whatsapp_dono: mockTenant.whatsapp_dono || "",
      regras_negocio: undefined,
      profissionais: [],
      catalogo_servicos: [],
      mensagens_padrao: undefined,
    }
  );

  const { detalhado, total } = calcularProgressoPerfil(dados);

  const handleLogout = () => {
    clearAllTestData();
    navigate("/");
  };

  const handleSave = async (secao: string) => {
    setSalvando(secao);
    await new Promise(r => setTimeout(r, 500));
    setSalvando(null);
    setSalvo(secao);
    setTimeout(() => setSalvo(null), 2000);
  };

  const handleSaveModal = (novosDados: TenantConfig) => {
    setDados(novosDados);
    modal.fecharModal();
    setSalvo("modais");
    setTimeout(() => setSalvo(null), 2000);
  };

  // Seções que expandem inline
  const secoesExpandiveis = [
    { id: "basico", titulo: "Configurações básicas", descricao: "Nome, timezone, WhatsApp", icon: "📋", progresso: detalhado.basico },
    { id: "regras", titulo: "Regras de negócio", descricao: "Tolerância, sinal, cancelamento", icon: "💰", progresso: detalhado.regras },
    { id: "mensagens", titulo: "Mensagens personalizadas", descricao: "Saudação, confirmação, etc", icon: "💬", progresso: detalhado.mensagens },
  ];

  // Seções que abrem modal
  const secoesModal = [
    { id: "profissionais", titulo: "Profissionais", descricao: "Adicionar/editar/deletar", icon: "👥", progresso: detalhado.profissionais },
    { id: "servicos", titulo: "Serviços", descricao: "Adicionar/editar/deletar", icon: "✂️", progresso: detalhado.servicos },
  ];

  const updateRegras = (novasRegras: Partial<typeof dados.regras_negocio>) => {
    setDados({
      ...dados,
      regras_negocio: { ...dados.regras_negocio, ...novasRegras },
    });
  };

  const renderSecaoContent = (secaoId: string) => {
    switch (secaoId) {
      case "basico":
        return (
          <div className="space-y-4">
            <Input
              label="Nome do salão"
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            />
            <Select
              label="Timezone"
              value={dados.timezone}
              onChange={(e) => setDados({ ...dados, timezone: e.target.value })}
              options={TIMEZONES_BR}
            />
            <Input
              label="WhatsApp Business (ID)"
              value={dados.whatsapp_phone_number_id}
              onChange={(e) => setDados({ ...dados, whatsapp_phone_number_id: e.target.value })}
              placeholder="Ex: 5511999999999"
            />
            <Input
              label="WhatsApp do Dono"
              value={dados.whatsapp_dono}
              onChange={(e) => setDados({ ...dados, whatsapp_dono: e.target.value })}
              placeholder="Ex: 5511888888888"
            />
            <Button onClick={() => handleSave("basico")} loading={salvando === "basico"}>
              {salvo === "basico" ? "✅ Salvo!" : "Salvar"}
            </Button>
          </div>
        );
        
      case "regras":
        const regras = dados.regras_negocio || {};
        return (
          <div className="space-y-4">
            <Select
              label="Tolerância de atraso (minutos)"
              value={regras.tolerancia_atraso_minutos || ""}
              onChange={(e) => updateRegras({ tolerancia_atraso_minutos: parseInt(e.target.value) || undefined })}
              options={[
                { value: "", label: "Selecione..." },
                { value: 10, label: "10 minutos" },
                { value: 15, label: "15 minutos" },
                { value: 20, label: "20 minutos" },
                { value: 30, label: "30 minutos" },
              ]}
            />
            
            <Select
              label="Cancelamento com antecedência (horas)"
              value={regras.cancelamento_antecedencia_horas || ""}
              onChange={(e) => updateRegras({ cancelamento_antecedencia_horas: parseInt(e.target.value) || undefined })}
              options={[
                { value: "", label: "Selecione..." },
                { value: 12, label: "12 horas" },
                { value: 24, label: "24 horas" },
                { value: 48, label: "48 horas" },
                { value: 72, label: "72 horas" },
              ]}
            />

            <Toggle
              checked={regras.exige_sinal_pix || false}
              onChange={(checked) => updateRegras({ exige_sinal_pix: checked })}
              label="Exige sinal via Pix?"
            />
            
            {regras.exige_sinal_pix && (
              <SimpleSlider
                label="Percentual de sinal"
                value={regras.percentual_sinal || 30}
                onChange={(value) => updateRegras({ percentual_sinal: value })}
                min={0}
                max={100}
              />
            )}

            <Button onClick={() => handleSave("regras")} loading={salvando === "regras"}>
              {salvo === "regras" ? "✅ Salvo!" : "Salvar"}
            </Button>
          </div>
        );

      case "mensagens":
        const mensagens = dados.mensagens_padrao || {};
        const campos = [
          { key: "saudacao", label: "Saudação da IA" },
          { key: "confirmacao_agendamento", label: "Confirmação de Agendamento" },
          { key: "lembrete", label: "Lembrete" },
        ];
        return (
          <div className="space-y-4">
            {campos.map((campo) => (
              <div key={campo.key}>
                <label className="block text-sm font-medium mb-2">{campo.label}</label>
                <textarea
                  value={mensagens[campo.key as keyof typeof mensagens] || ""}
                  onChange={(e) => setDados({
                    ...dados,
                    mensagens_padrao: { ...mensagens, [campo.key]: e.target.value },
                  })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-terracotta-500"
                  placeholder={`Digite a mensagem de ${campo.label.toLowerCase()}...`}
                />
              </div>
            ))}
            <Button onClick={() => handleSave("mensagens")} loading={salvando === "mensagens"}>
              {salvo === "mensagens" ? "✅ Salvo!" : "Salvar"}
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  const StatusIcon = ({ progresso }: { progresso: number }) => {
    if (progresso === 100) return <span className="text-xl">✅</span>;
    if (progresso === 0) return <span className="text-xl">❌</span>;
    return <span className="text-xl">⏳</span>;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <h1 className="font-display font-semibold text-stone-800">Complete seu Perfil</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display mb-2">Complete seu Perfil</h1>
        <p className="text-stone-600 mb-6">
          Preencha as informações para melhorar o atendimento
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Progresso geral</span>
            <span className="text-sm font-medium text-terracotta-600">{total}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div
              className="bg-terracotta-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${total}%` }}
            />
          </div>
        </div>

        {/* Seções expandíveis */}
        <div className="space-y-3">
          {secoesExpandiveis.map((secao) => (
            <div
              key={secao.id}
              className={`bg-white rounded-xl border transition-all ${
                secaoAberta === secao.id 
                  ? "border-terracotta-300 shadow-md" 
                  : "border-stone-200 hover:border-terracotta-300"
              }`}
            >
              <button
                onClick={() => setSecaoAberta(secaoAberta === secao.id ? null : secao.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{secao.icon}</span>
                    <div>
                      <h3 className="font-medium text-stone-800">{secao.titulo}</h3>
                      <p className="text-sm text-stone-500">{secao.descricao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      secao.progresso === 100 ? "text-sage-600" : "text-stone-600"
                    }`}>
                      {secao.progresso}%
                    </span>
                    <StatusIcon progresso={secao.progresso} />
                    <svg 
                      className={`w-5 h-5 text-stone-400 transition-transform ${
                        secaoAberta === secao.id ? "rotate-180" : ""
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {secaoAberta === secao.id && (
                <div className="px-4 pb-4 border-t border-stone-100">
                  <div className="pt-4">
                    {renderSecaoContent(secao.id)}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Seções com modal */}
          {secoesModal.map((secao) => (
            <button
              key={secao.id}
              onClick={() => modal.abrirModal(secao.id)}
              className="w-full p-4 bg-white rounded-xl border border-stone-200 hover:border-terracotta-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{secao.icon}</span>
                  <div>
                    <h3 className="font-medium text-stone-800">{secao.titulo}</h3>
                    <p className="text-sm text-stone-500">{secao.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${
                    secao.progresso === 100 ? "text-sage-600" : "text-stone-600"
                  }`}>
                    {secao.progresso}%
                  </span>
                  <StatusIcon progresso={secao.progresso} />
                  <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Modais */}
      {modal.isOpen('profissionais') && (
        <ModalProfissionais
          dados={dados}
          onClose={() => modal.fecharModal()}
          onSave={handleSaveModal}
        />
      )}

      {modal.isOpen('servicos') && (
        <ModalServicos
          dados={dados}
          onClose={() => modal.fecharModal()}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}
