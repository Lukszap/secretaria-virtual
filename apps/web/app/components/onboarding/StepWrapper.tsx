import React from "react";
import { Button } from "~/components/ui/Button";

interface StepWrapperProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isLastStep?: boolean;
  loading?: boolean;
}

const stepTitles = [
  "Informações Básicas",
  "WhatsApp",
  "Profissionais",
  "Serviços",
  "Horários",
];

export function StepWrapper({
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canGoNext,
  isLastStep,
  loading,
}: StepWrapperProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-600">
            Passo {currentStep} de {totalSteps}
          </span>
          <span className="text-sm text-stone-500">
            {stepTitles[currentStep - 1]}
          </span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {stepTitles.map((stepTitle, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div
                key={stepNum}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  stepNum > currentStep ? "opacity-40" : "opacity-100"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-terracotta-600 text-white shadow-md"
                      : isCompleted
                      ? "bg-sage-500 text-white"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
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
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    isActive ? "text-terracotta-700 font-medium" : "text-stone-500"
                  }`}
                >
                  {stepTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-lg p-6 sm:p-8 animate-slide-up">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-semibold text-stone-800 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-600 leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="space-y-6">{children}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!onBack || loading}
          >
            {onBack && (
              <>
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
              </>
            )}
          </Button>

          <Button
            variant="primary"
            onClick={onNext}
            disabled={!canGoNext || loading}
            loading={loading}
          >
            {isLastStep ? (
              <>
                Finalizar
                <svg
                  className="w-4 h-4 ml-2"
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
              </>
            ) : (
              <>
                Continuar
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
