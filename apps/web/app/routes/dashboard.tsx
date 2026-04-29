import React, { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { mockTenant, type Profissional, type Servico, type Tenant } from "~/lib/mock";
import { obterTenant } from "~/lib/api";
import { useLocalStorage, clearAllTestData } from "~/hooks/useLocalStorage";

export default function Dashboard() {
  const navigate = useNavigate();
  // TODO: remover quando USE_MOCK = false - modo de dados mock vs real
  const [dataMode, setDataMode] = useLocalStorage<"mock" | "real">("data_mode", "mock");
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [tenant, setTenant] = useState<Tenant>(mockTenant);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantId = localStorage.getItem("tenant_id");
        if (tenantId) {
          const tenantData = await obterTenant(tenantId);
          setTenant(tenantData);
        }
      } catch (error) {
        console.error("Erro ao carregar tenant:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const stats = [
    { label: "Agendamentos Hoje", value: "8", icon: "📅" },
    { label: "Profissionais", value: tenant.configuracoes.profissionais.length.toString(), icon: "👩‍💼" },
    { label: "Serviços", value: tenant.configuracoes.catalogo_servicos.length.toString(), icon: "✂️" },
    { label: "Clientes", value: "124", icon: "👥" },
  ];

  const quickActions = [
    { label: "Novo Agendamento", icon: "➕", onClick: () => {} },
    { label: "Gerenciar Profissionais", icon: "👥", onClick: () => navigate("/perfil/profissionais") },
    { label: "Configurar Serviços", icon: "⚙️", onClick: () => navigate("/perfil/servicos") },
    { label: "Ver Calendário", icon: "📅", onClick: () => {} },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-terracotta-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✨</span>
          </div>
          <p className="text-stone-600">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="font-display font-semibold text-stone-800">
                  {tenant.nome}
                </h1>
                <p className="text-xs text-stone-500">Secretaria Virtual</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/perfil")}
                title="Configurações"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAllTestData();
                  navigate("/onboarding");
                }}
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-semibold text-stone-800">
            Bem-vinda de volta! 👋
          </h2>
          <p className="text-stone-600 mt-1">
            Aqui está o resumo do seu negócio hoje
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600">{stat.label}</p>
                    <p className="text-3xl font-display font-semibold text-stone-800 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-display font-medium text-stone-800 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-terracotta-300 hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <span className="text-sm font-medium text-stone-700">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profissionais */}
          <Card>
            <CardHeader className="border-b border-stone-100">
              <h3 className="font-display font-medium text-stone-800">
                Profissionais
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              {tenant.configuracoes.profissionais.map((prof: Profissional) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between px-6 py-4 border-b border-stone-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                      <span className="text-sage-600 font-medium">
                        {prof.nome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{prof.nome}</p>
                      <p className="text-sm text-stone-500">
                        {prof.especialidades.length} serviços
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">
                    {prof.dias_trabalho.length} dias/semana
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader className="border-b border-stone-100">
              <h3 className="font-display font-medium text-stone-800">
                Serviços
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              {tenant.configuracoes.catalogo_servicos.map((servico: Servico) => (
                <div
                  key={servico.slug}
                  className="flex items-center justify-between px-6 py-4 border-b border-stone-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-stone-800">{servico.nome}</p>
                    <p className="text-sm text-stone-500">
                      {servico.duracao_minutos} min • {" "}
                      {servico.profissionais_habilitados.length} profissional(s)
                    </p>
                  </div>
                  <span className="font-medium text-terracotta-600">
                    R$ {servico.preco.toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer - Test Mode Controls */}
        <footer className="mt-12 pt-6 border-t border-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTestModeModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm text-stone-600 transition-colors"
              >
                <span>🧪</span>
                <span>Modo: {dataMode === "mock" ? "Mock" : "Real"}</span>
              </button>
              
              <button
                onClick={() => {
                  clearAllTestData();
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Limpar dados de teste</span>
              </button>
            </div>
            
            <p className="text-xs text-stone-400">
              Secretaria Virtual v0.1.0
            </p>
          </div>
        </footer>
      </main>

      {/* Test Mode Modal */}
      {showTestModeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-display font-semibold text-stone-800 mb-4">
              🧪 Modo de Teste
            </h3>
            <p className="text-sm text-stone-600 mb-6">
              Escolha como os dados devem ser carregados:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setDataMode("mock");
                  setShowTestModeModal(false);
                  window.location.reload();
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  dataMode === "mock" 
                    ? "border-terracotta-500 bg-terracotta-50" 
                    : "border-stone-200 hover:border-terracotta-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="font-medium text-stone-800">Dados Mockados</p>
                    <p className="text-xs text-stone-500">Usar dados de exemplo para testes</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setDataMode("real");
                  setShowTestModeModal(false);
                  window.location.reload();
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  dataMode === "real" 
                    ? "border-sage-500 bg-sage-50" 
                    : "border-stone-200 hover:border-sage-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <p className="font-medium text-stone-800">Carregar da API</p>
                    <p className="text-xs text-stone-500">Buscar dados do servidor (quando disponível)</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  // TODO: remover quando USE_MOCK = false - modo edição manual
                  const editableMock = { ...mockTenant, nome: mockTenant.nome + " (Editável)" };
                  localStorage.setItem("manual_tenant_data", JSON.stringify(editableMock));
                  setShowTestModeModal(false);
                  alert("Dados copiados para localStorage. Edite em 'manual_tenant_data'");
                }}
                className="w-full p-4 rounded-xl border-2 border-stone-200 hover:border-amber-300 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-medium text-stone-800">Editar Manualmente</p>
                    <p className="text-xs text-stone-500">Copiar mock e salvar em localStorage</p>
                  </div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowTestModeModal(false)}
              className="w-full mt-4 py-2 text-sm text-stone-500 hover:text-stone-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
