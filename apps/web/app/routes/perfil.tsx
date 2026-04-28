import React, { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Toggle } from "~/components/ui/Toggle";
import { Step3Profissionais } from "~/components/onboarding/Step3Profissionais";
import { Step4Servicos } from "~/components/onboarding/Step4Servicos";
import { atualizarConfiguracoes } from "~/lib/api";
import { mockTenant, type Configuracoes, type Profissional, type Servico } from "~/lib/mock";
import { calcularProgressoPerfil } from "~/lib/utils";

export default function Perfil() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<Configuracoes>(mockTenant.configuracoes);
  const [loading, setLoading] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("regras");

  const progresso = calcularProgressoPerfil(config);

  const handleSave = async (section: string, data: Partial<Configuracoes>) => {
    setLoading(section);
    try {
      await atualizarConfiguracoes("mock-tenant-123", data);
      setConfig({ ...config, ...data });
      setSaved(section);
      setTimeout(() => setSaved(null), 3000);
    } catch (error) {
      alert("Erro ao salvar: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setLoading(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  const mensagensPadrao = {
    saudacao: "Olá! Sou a assistente virtual do {nome_salao}. Como posso te ajudar hoje? 💅",
    confirmacao_agendamento: "Seu agendamento foi confirmado! Te esperamos no dia {data} às {hora}. ✨",
    lembrete: "Lembrete: Você tem um agendamento amanhã às {hora}. Nos vemos lá! 💖",
    fallback_ia: "Só um minutinho, estou processando sua mensagem... ⏳",
  };

  const sections = [
    {
      id: "regras",
      title: "Regras do Negócio",
      badge: config.regras_negocio ? "Completo" : "Pendente",
    },
    {
      id: "mensagens",
      title: "Mensagens Personalizadas",
      badge: Object.values(config.mensagens_padrao || {}).every(m => m && m !== "") ? "Completo" : "Pendente",
    },
    {
      id: "profissionais",
      title: "Mais Profissionais",
      badge: config.profissionais.length > 0 ? "Completo" : "Pendente",
    },
    {
      id: "servicos",
      title: "Mais Serviços",
      badge: config.catalogo_servicos.length > 0 ? "Completo" : "Pendente",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <h1 className="font-display font-semibold text-stone-800">
                Complete seu Perfil
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">
              Progresso do perfil
            </span>
            <span className="text-sm font-medium text-terracotta-600">
              {progresso}%
            </span>
          </div>
          <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Regras do Negócio */}
          <Card>
            <button
              onClick={() => toggleSection("regras")}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div className="text-left">
                  <h3 className="font-display font-medium text-stone-800">
                    Regras do Negócio
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  config.regras_negocio ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {config.regras_negocio ? "Completo" : "Pendente"}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 transition-transform ${
                    expanded === "regras" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expanded === "regras" && (
              <CardContent className="border-t border-stone-100 pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Select
                    label="Tolerância de atraso"
                    value={config.regras_negocio?.tolerancia_atraso_minutos || 15}
                    onChange={(e) => setConfig({
                      ...config,
                      regras_negocio: {
                        ...config.regras_negocio,
                        tolerancia_atraso_minutos: parseInt(e.target.value),
                      },
                    })}
                    options={[
                      { label: "10 minutos", value: 10 },
                      { label: "15 minutos", value: 15 },
                      { label: "20 minutos", value: 20 },
                      { label: "30 minutos", value: 30 },
                    ]}
                  />
                  <Select
                    label="Cancelamento com antecedência"
                    value={config.regras_negocio?.cancelamento_antecedencia_horas || 24}
                    onChange={(e) => setConfig({
                      ...config,
                      regras_negocio: {
                        ...config.regras_negocio,
                        cancelamento_antecedencia_horas: parseInt(e.target.value),
                      },
                    })}
                    options={[
                      { label: "12 horas", value: 12 },
                      { label: "24 horas", value: 24 },
                      { label: "48 horas", value: 48 },
                      { label: "72 horas", value: 72 },
                    ]}
                  />
                  <div>
                    <Toggle
                      checked={config.regras_negocio?.exige_sinal_pix || false}
                      onChange={(checked) => setConfig({
                        ...config,
                        regras_negocio: {
                          ...config.regras_negocio,
                          exige_sinal_pix: checked,
                        },
                      })}
                      label="Exige sinal via Pix?"
                      description="O cliente precisa pagar um sinal para confirmar o agendamento"
                    />
                    {config.regras_negocio?.exige_sinal_pix && (
                      <div className="mt-4">
                        <label className="block text-sm text-stone-600 mb-2">
                          Percentual do sinal: {config.regras_negocio?.percentual_sinal || 30}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          value={config.regras_negocio?.percentual_sinal || 30}
                          onChange={(e) => setConfig({
                            ...config,
                            regras_negocio: {
                              ...config.regras_negocio,
                              percentual_sinal: parseInt(e.target.value),
                            },
                          })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave("regras", { regras_negocio: config.regras_negocio })}
                    loading={loading === "regras"}
                  >
                    {saved === "regras" ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvo!
                      </>
                    ) : (
                      "Salvar Regras"
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Mensagens Personalizadas */}
          <Card>
            <button
              onClick={() => toggleSection("mensagens")}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div className="text-left">
                  <h3 className="font-display font-medium text-stone-800">
                    Mensagens Personalizadas
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  Object.values(config.mensagens_padrao || {}).every(m => m && m !== "")
                    ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {Object.values(config.mensagens_padrao || {}).every(m => m && m !== "") ? "Completo" : "Pendente"}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 transition-transform ${
                    expanded === "mensagens" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expanded === "mensagens" && (
              <CardContent className="border-t border-stone-100 pt-6">
                <div className="space-y-4">
                  {[
                    { key: "saudacao", label: "Saudação da IA", placeholder: mensagensPadrao.saudacao },
                    { key: "confirmacao_agendamento", label: "Confirmação de Agendamento", placeholder: mensagensPadrao.confirmacao_agendamento },
                    { key: "lembrete", label: "Lembrete", placeholder: mensagensPadrao.lembrete },
                    { key: "fallback_ia", label: "Fallback (quando não entendeu)", placeholder: mensagensPadrao.fallback_ia },
                  ].map((msg) => (
                    <div key={msg.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-stone-700">
                          {msg.label}
                        </label>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            mensagens_padrao: {
                              ...config.mensagens_padrao,
                              [msg.key]: msg.placeholder,
                            },
                          })}
                          className="text-xs text-terracotta-600 hover:text-terracotta-700"
                        >
                          Usar padrão
                        </button>
                      </div>
                      <textarea
                        value={config.mensagens_padrao?.[msg.key as keyof typeof config.mensagens_padrao] || ""}
                        onChange={(e) => setConfig({
                          ...config,
                          mensagens_padrao: {
                            ...config.mensagens_padrao,
                            [msg.key]: e.target.value,
                          },
                        })}
                        placeholder={msg.placeholder}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-terracotta-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave("mensagens", { mensagens_padrao: config.mensagens_padrao })}
                    loading={loading === "mensagens"}
                  >
                    {saved === "mensagens" ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvo!
                      </>
                    ) : (
                      "Salvar Mensagens"
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Profissionais */}
          <Card>
            <button
              onClick={() => toggleSection("profissionais")}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👩‍💼</span>
                <div className="text-left">
                  <h3 className="font-display font-medium text-stone-800">
                    Mais Profissionais
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  config.profissionais.length > 0 ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {config.profissionais.length > 0 ? "Completo" : "Pendente"}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 transition-transform ${
                    expanded === "profissionais" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expanded === "profissionais" && (
              <CardContent className="border-t border-stone-100 pt-6">
                <Step3Profissionais
                  profissionais={config.profissionais}
                  onChange={(profissionais) => setConfig({ ...config, profissionais })}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave("profissionais", { profissionais: config.profissionais })}
                    loading={loading === "profissionais"}
                  >
                    {saved === "profissionais" ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvo!
                      </>
                    ) : (
                      "Salvar Profissionais"
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Serviços */}
          <Card>
            <button
              onClick={() => toggleSection("servicos")}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✂️</span>
                <div className="text-left">
                  <h3 className="font-display font-medium text-stone-800">
                    Mais Serviços
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  config.catalogo_servicos.length > 0 ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {config.catalogo_servicos.length > 0 ? "Completo" : "Pendente"}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 transition-transform ${
                    expanded === "servicos" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expanded === "servicos" && (
              <CardContent className="border-t border-stone-100 pt-6">
                <Step4Servicos
                  servicos={config.catalogo_servicos}
                  profissionais={config.profissionais}
                  onChange={(catalogo_servicos) => setConfig({ ...config, catalogo_servicos })}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave("servicos", { catalogo_servicos: config.catalogo_servicos })}
                    loading={loading === "servicos"}
                  >
                    {saved === "servicos" ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvo!
                      </>
                    ) : (
                      "Salvar Serviços"
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
