import React, { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { ChatOnboarding } from "~/components/onboarding/ChatOnboarding";
import { Button } from "~/components/ui/Button";
import { criarTenant } from "~/lib/api";
import type { Configuracoes } from "~/lib/mock";

export default function OnboardingChat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleComplete = async (dados: {
    nome: string;
    configuracoes: Configuracoes;
    whatsapp_dono: string;
  }) => {
    setLoading(true);
    try {
      const tenant = await criarTenant({
        nome: dados.nome,
        configuracoes: dados.configuracoes,
        whatsapp_dono: dados.whatsapp_dono,
        whatsapp_phone_number_id: "",
      });

      localStorage.setItem("tenant_id", tenant.id);
      localStorage.setItem("onboarding_completed", "true");
      localStorage.removeItem("onboarding_step");
      localStorage.removeItem("onboarding_data");
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const goBack = () => {
    navigate("/onboarding");
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-sage-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold text-stone-800 mb-3">
            Tudo pronto!
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            Sua secretaria virtual está sendo ativada. Você já pode começar a usar o painel.
          </p>
          <Button variant="primary" size="lg" onClick={goToDashboard} fullWidth>
            Ir para o painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={goBack}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar
          </Button>
          <div className="text-sm text-stone-500">
            Configuração por chat
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-stone-800 mb-2">
            Configure com a assistente
          </h1>
          <p className="text-stone-600">
            Converse naturalmente com nossa IA para configurar seu sistema
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading && !completed ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-terracotta-200 border-t-terracotta-600 rounded-full animate-spin mb-4" />
            <p className="text-stone-600">Configurando seu sistema...</p>
          </div>
        ) : (
          <ChatOnboarding onComplete={handleComplete} onError={handleError} />
        )}
      </div>
    </div>
  );
}
