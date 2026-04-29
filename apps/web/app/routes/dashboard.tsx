import React, { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { mockTenant, type Profissional, type Servico, type Tenant } from "~/lib/mock";
import { obterTenant } from "~/lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
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
    { label: "Gerenciar Profissionais", icon: "👥", onClick: () => navigate("/perfil") },
    { label: "Configurar Serviços", icon: "⚙️", onClick: () => navigate("/perfil") },
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
      </main>
    </div>
  );
}
