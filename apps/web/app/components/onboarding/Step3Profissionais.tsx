import React, { useState } from "react";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { DIAS_SEMANA, gerarSlug } from "~/lib/utils";
import type { Profissional } from "~/lib/mock";

interface Step3ProfissionaisProps {
  profissionais: Profissional[];
  onChange: (profissionais: Profissional[]) => void;
}

export function Step3Profissionais({
  profissionais,
  onChange,
}: Step3ProfissionaisProps) {
  const [novoProfissional, setNovoProfissional] = useState({
    nome: "",
    dias: [] as string[],
  });
  const [error, setError] = useState("");

  const toggleDia = (dia: string): void => {
    setNovoProfissional((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter((d) => d !== dia)
        : [...prev.dias, dia],
    }));
  };

  const adicionarProfissional = () => {
    if (!novoProfissional.nome.trim()) {
      setError("Digite o nome do profissional");
      return;
    }
    if (novoProfissional.dias.length === 0) {
      setError("Selecione pelo menos um dia de trabalho");
      return;
    }

    const id = gerarSlug(novoProfissional.nome);
    const profissional: Profissional = {
      nome: novoProfissional.nome,
      id,
      especialidades: [],
      dias_trabalho: novoProfissional.dias,
    };

    onChange([...profissionais, profissional]);
    setNovoProfissional({ nome: "", dias: [] });
    setError("");
  };

  const removerProfissional = (id: string) => {
    onChange(profissionais.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Lista de profissionais adicionados */}
      {profissionais.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">
            Profissionais adicionados ({profissionais.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {profissionais.map((prof) => (
              <div
                key={prof.id}
                className="flex items-center gap-2 bg-sage-50 border border-sage-200 rounded-full px-4 py-2"
              >
                <span className="text-sm font-medium text-stone-700">
                  {prof.nome}
                </span>
                <span className="text-xs text-stone-500">
                  {prof.dias_trabalho.map((d: string) => DIAS_SEMANA.find((ds: {value: string, label: string}) => ds.value === d)?.label)
                    .join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => removerProfissional(prof.id)}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form para adicionar novo */}
      <div className="border-t border-stone-200 pt-6">
        <label className="block text-sm font-medium text-stone-700 mb-3">
          Adicionar profissional
        </label>
        <div className="space-y-4">
          <Input
            placeholder="Nome completo do profissional"
            value={novoProfissional.nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNovoProfissional((prev) => ({ ...prev, nome: e.target.value }))
            }
          />

          <div>
            <label className="block text-sm text-stone-600 mb-2">
              Dias que trabalha:
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia: {label: string, value: string}) => {
                const selecionado = novoProfissional.dias.includes(dia.value);
                return (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => toggleDia(dia.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selecionado
                        ? "bg-terracotta-500 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            variant="outline"
            onClick={adicionarProfissional}
            fullWidth
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adicionar profissional
          </Button>
        </div>
      </div>

      {profissionais.length === 0 && (
        <p className="text-sm text-stone-500 text-center py-4">
          Adicione pelo menos um profissional para continuar
        </p>
      )}
    </div>
  );
}
