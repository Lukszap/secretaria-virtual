import React from "react";
import { Button } from "~/components/ui/Button";
import { DIAS_SEMANA } from "~/lib/utils";
import type { HorarioFuncionamento, HorarioDia } from "~/lib/mock";

interface Step5HorariosProps {
  horarios: HorarioFuncionamento;
  onChange: (horarios: HorarioFuncionamento) => void;
}

export function Step5Horarios({ horarios, onChange }: Step5HorariosProps) {
  const updateHorario = (
    dia: keyof HorarioFuncionamento,
    updates: Partial<HorarioDia>
  ) => {
    onChange({
      ...horarios,
      [dia]: {
        ...horarios[dia],
        ...updates,
      },
    });
  };

  const aplicarHorarioSemana = () => {
    const horarioSemana = horarios.seg;
    const diasSemana: (keyof HorarioFuncionamento)[] = [
      "ter",
      "qua",
      "qui",
      "sex",
    ];
    const novosHorarios = { ...horarios };
    diasSemana.forEach((dia) => {
      if (novosHorarios[dia].aberto) {
        novosHorarios[dia] = { ...horarioSemana };
      }
    });
    onChange(novosHorarios);
  };

  const dias: { key: keyof HorarioFuncionamento; label: string; full: string }[] = [
    { key: "seg", label: "Seg", full: "Segunda-feira" },
    { key: "ter", label: "Ter", full: "Terça-feira" },
    { key: "qua", label: "Qua", full: "Quarta-feira" },
    { key: "qui", label: "Qui", full: "Quinta-feira" },
    { key: "sex", label: "Sex", full: "Sexta-feira" },
    { key: "sab", label: "Sáb", full: "Sábado" },
    { key: "dom", label: "Dom", full: "Domingo" },
  ];

  return (
    <div className="space-y-6">
      {/* Grid de horários */}
      <div className="space-y-3">
        {dias.map(({ key, label, full }) => {
          const horario = horarios[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                horario.aberto
                  ? "bg-white border-stone-200"
                  : "bg-stone-50 border-stone-200"
              }`}
            >
              {/* Dia */}
              <div className="w-16 flex-shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    horario.aberto ? "text-stone-800" : "text-stone-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Toggle Aberto/Fechado */}
              <button
                type="button"
                onClick={() =>
                  updateHorario(key, { aberto: !horario.aberto })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  horario.aberto ? "bg-sage-500" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    horario.aberto ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <span
                className={`text-sm ${
                  horario.aberto ? "text-stone-600" : "text-stone-400"
                }`}
              >
                {horario.aberto ? "Aberto" : "Fechado"}
              </span>

              {/* Campos de horário (somente se aberto) */}
              {horario.aberto && (
                <>
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={horario.abre}
                      onChange={(e) =>
                        updateHorario(key, { abre: e.target.value })
                      }
                      className="w-24 px-2 py-1 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-terracotta-500"
                    />
                    <span className="text-stone-400">-</span>
                    <input
                      type="time"
                      value={horario.fecha}
                      onChange={(e) =>
                        updateHorario(key, { fecha: e.target.value })
                      }
                      className="w-24 px-2 py-1 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão aplicar horário da semana */}
      <Button
        type="button"
        variant="ghost"
        onClick={aplicarHorarioSemana}
        className="w-full"
      >
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Aplicar horário de segunda para todos os dias abertos
      </Button>
    </div>
  );
}
