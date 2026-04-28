import React, { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { StepWrapper } from "~/components/onboarding/StepWrapper";
import { Step1Basico, type Step1Data } from "~/components/onboarding/Step1Basico";
import { Step2Whatsapp, type Step2Data } from "~/components/onboarding/Step2Whatsapp";
import { Step3Profissionais } from "~/components/onboarding/Step3Profissionais";
import { Step4Servicos } from "~/components/onboarding/Step4Servicos";
import { Step5Horarios } from "~/components/onboarding/Step5Horarios";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { criarTenant } from "~/lib/api";
import type { Configuracoes, Profissional, Servico } from "~/lib/mock";
import { getHorariosPadrao, gerarSlug } from "~/lib/utils";

const STORAGE_KEY = "onboarding_data";
const MODE_KEY = "onboarding_mode";
const STEP_KEY = "onboarding_step";

interface OnboardingData {
  step1: Step1Data;
  step2: Step2Data;
  profissionais: Profissional[];
  servicos: Servico[];
  configuracoes: Configuracoes;
}

const defaultData: OnboardingData = {
  step1: { nome: "", tipoNegocio: "", timezone: "" },
  step2: { whatsappBusiness: "", whatsappDono: "" },
  profissionais: [],
  servicos: [],
  configuracoes: {
    timezone: "America/Sao_Paulo",
    catalogo_servicos: [],
    profissionais: [],
    horario_funcionamento: getHorariosPadrao(),
    regras_negocio: {
      tolerancia_atraso_minutos: 15,
      exige_sinal_pix: false,
      percentual_sinal: 30,
      cancelamento_antecedencia_horas: 24,
      tempo_minimo_entre_agendamentos_minutos: 30,
      permite_agendamento_futuro_dias: 60,
    },
    mensagens_padrao: {
      saudacao: "Olá! Sou a assistente virtual do {nome_salao}. Como posso te ajudar hoje? 💅",
      confirmacao_agendamento: "Seu agendamento foi confirmado! Te esperamos no dia {data} às {hora}. ✨",
      lembrete: "Lembrete: Você tem um agendamento amanhã às {hora}. Nos vemos lá! 💖",
      fallback_ia: "Só um minutinho, estou processando sua mensagem... ⏳",
    },
  },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>(defaultData);

  // Load saved state
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_KEY);
    const savedStep = localStorage.getItem(STEP_KEY);
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedMode) {
      setShowModeSelection(false);
      if (savedMode === "chat") {
        navigate("/onboarding/chat");
        return;
      }
    }

    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }

    if (savedData) {
      try {
        setData({ ...defaultData, ...JSON.parse(savedData) });
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  // Save state on change
  useEffect(() => {
    if (!showModeSelection) {
      localStorage.setItem(STEP_KEY, step.toString());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [step, data, showModeSelection]);

  const selectMode = (mode: "form" | "chat") => {
    localStorage.setItem(MODE_KEY, mode);
    setShowModeSelection(false);
    if (mode === "chat") {
      navigate("/onboarding/chat");
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return (
          data.step1.nome.trim() !== "" &&
          data.step1.tipoNegocio !== "" &&
          data.step1.timezone !== ""
        );
      case 2:
        return (
          data.step2.whatsappBusiness.length >= 12 &&
          data.step2.whatsappDono.length >= 12
        );
      case 3:
        return data.profissionais.length > 0;
      case 4:
        return data.servicos.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Finalizar
      setLoading(true);
      try {
        const tenant = await criarTenant({
          nome: data.step1.nome,
          configuracoes: {
            ...data.configuracoes,
            timezone: data.step1.timezone,
            catalogo_servicos: data.servicos,
            profissionais: data.profissionais,
            horario_funcionamento: data.configuracoes.horario_funcionamento,
          },
          whatsapp_dono: data.step2.whatsappDono,
          whatsapp_phone_number_id: "",
        });

        localStorage.setItem("tenant_id", tenant.id);
        localStorage.setItem("onboarding_completed", "true");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STEP_KEY);
        setCompleted(true);
      } catch (error) {
        alert("Erro ao criar tenant: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  if (showModeSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold text-stone-800 mb-3">
              Bem-vinda à Secretaria Virtual
            </h1>
            <p className="text-lg text-stone-600">
              Como você prefere configurar seu sistema?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              hover
              className="cursor-pointer shine"
              onClick={() => selectMode("form")}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-terracotta-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-semibold text-stone-800 mb-2">
                  Modo Formulário
                </h3>
                <p className="text-stone-600">
                  Prefiro preencher por etapas de forma organizada
                </p>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer shine"
              onClick={() => selectMode("chat")}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-sage-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-semibold text-stone-800 mb-2">
                  Modo Chat
                </h3>
                <p className="text-stone-600">
                  Prefiro conversar com a assistente virtual
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
        <StepWrapper
          currentStep={step}
          totalSteps={5}
          title={
            step === 1
              ? "Vamos começar"
              : step === 2
              ? "Configurar WhatsApp"
              : step === 3
              ? "Quem trabalha com você?"
              : step === 4
              ? "Quais serviços você oferece?"
              : "Horários de funcionamento"
          }
          subtitle={
            step === 1
              ? "Conte-nos um pouco sobre seu negócio"
              : step === 2
              ? "Adicione os números de WhatsApp para comunicação"
              : step === 3
              ? "Cadastre os profissionais que atendem no seu salão"
              : step === 4
              ? "Liste os serviços disponíveis para agendamento"
              : "Defina os dias e horários de funcionamento"
          }
          onBack={step > 1 ? handleBack : undefined}
          onNext={handleNext}
          canGoNext={validateStep()}
          isLastStep={step === 5}
          loading={loading}
        >
          {step === 1 && (
            <Step1Basico
              data={data.step1}
              onChange={(step1) => setData({ ...data, step1 })}
            />
          )}
          {step === 2 && (
            <Step2Whatsapp
              data={data.step2}
              onChange={(step2) => setData({ ...data, step2 })}
            />
          )}
          {step === 3 && (
            <Step3Profissionais
              profissionais={data.profissionais}
              onChange={(profissionais) => setData({ ...data, profissionais })}
            />
          )}
          {step === 4 && (
            <Step4Servicos
              servicos={data.servicos}
              profissionais={data.profissionais}
              onChange={(servicos) => setData({ ...data, servicos })}
            />
          )}
          {step === 5 && (
            <Step5Horarios
              horarios={data.configuracoes.horario_funcionamento}
              onChange={(horario_funcionamento) =>
                setData({
                  ...data,
                  configuracoes: { ...data.configuracoes, horario_funcionamento },
                })
              }
            />
          )}
        </StepWrapper>
      </div>
    </div>
  );
}
