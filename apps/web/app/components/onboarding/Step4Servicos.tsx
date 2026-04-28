import React, { useState } from "react";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Toggle } from "~/components/ui/Toggle";
import { DURACOES_SERVICO, gerarSlug } from "~/lib/utils";
import type { Servico, Profissional } from "~/lib/mock";

interface Step4ServicosProps {
  servicos: Servico[];
  profissionais: Profissional[];
  onChange: (servicos: Servico[]) => void;
}

export function Step4Servicos({
  servicos,
  profissionais,
  onChange,
}: Step4ServicosProps) {
  const [novoServico, setNovoServico] = useState<Partial<Servico> & { profissionais_habilitados?: string[] }>({
    nome: "",
    preco: undefined,
    duracao_minutos: 60,
    slug: "",
    profissionais_habilitados: [],
    requer_foto_referencia: false,
  });
  const [duracaoCustom, setDuracaoCustom] = useState<number>(60);
  const [error, setError] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const nome = e.target.value;
    setNovoServico((prev: typeof novoServico) => ({
      ...prev,
      nome,
      slug: slugEditado ? prev.slug : gerarSlug(nome),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSlugEditado(true);
    setNovoServico((prev: typeof novoServico) => ({ ...prev, slug: e.target.value }));
  };

  const toggleProfissional = (profId: string): void => {
    setNovoServico((prev: typeof novoServico) => {
      const lista = prev.profissionais_habilitados || [];
      return {
        ...prev,
        profissionais_habilitados: lista.includes(profId)
          ? lista.filter((id: string) => id !== profId)
          : [...lista, profId],
      };
    });
  };

  const adicionarServico = (): void => {
    if (!novoServico.nome?.trim()) {
      setError("Digite o nome do serviço");
      return;
    }
    if (!novoServico.preco || novoServico.preco <= 0) {
      setError("Digite um preço válido");
      return;
    }
    if (!novoServico.profissionais_habilitados?.length) {
      setError("Selecione pelo menos um profissional");
      return;
    }

    const duracao =
      novoServico.duracao_minutos === -1
        ? duracaoCustom
        : novoServico.duracao_minutos;

    const servico: Servico = {
      nome: novoServico.nome,
      preco: novoServico.preco,
      duracao_minutos: duracao || 60,
      slug: novoServico.slug || gerarSlug(novoServico.nome),
      profissionais_habilitados: novoServico.profissionais_habilitados,
      requer_foto_referencia: novoServico.requer_foto_referencia || false,
    };

    onChange([...servicos, servico]);
    setNovoServico({
      nome: "",
      preco: undefined,
      duracao_minutos: 60,
      slug: "",
      profissionais_habilitados: [],
      requer_foto_referencia: false,
    });
    setSlugEditado(false);
    setDuracaoCustom(60);
    setError("");
  };

  const removerServico = (index: number): void => {
    onChange(servicos.filter((_, i) => i !== index));
  };

  const duracaoValue = novoServico.duracao_minutos ?? 60;
  const isCustom = duracaoValue === -1;

  return (
    <div className="space-y-6">
      {/* Lista de serviços adicionados */}
      {servicos.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">
            Serviços adicionados ({servicos.length})
          </label>
          <div className="space-y-2">
            {servicos.map((servico, idx) => (
              <div
                key={`${servico.slug}-${idx}`}
                className="flex items-center justify-between bg-cream-50 border border-cream-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-800">{servico.nome}</p>
                  <p className="text-sm text-stone-600">
                    R$ {servico.preco.toFixed(2)} • {servico.duracao_minutos}min •
                    slug: {servico.slug}
                    {servico.requer_foto_referencia && " 📸"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removerServico(idx)}
                  className="text-stone-400 hover:text-red-500 transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
          Adicionar serviço
        </label>
        <div className="space-y-4">
          <Input
            placeholder="Nome do serviço (ex: Corte Feminino)"
            value={novoServico.nome || ""}
            onChange={handleNomeChange}
          />

          {/* Slug */}
          <div>
            <label className="block text-sm text-stone-600 mb-1">
              Slug (identificador único):
            </label>
            <Input
              value={novoServico.slug || ""}
              onChange={handleSlugChange}
              placeholder="corte-feminino"
              helperText="Usado para identificar o serviço no sistema"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Preço (R$)"
              value={novoServico.preco || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNovoServico((prev: typeof novoServico) => ({
                  ...prev,
                  preco: parseFloat(e.target.value),
                }))
              }
            />
            <Select
              value={duracaoValue}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNovoServico((prev: typeof novoServico) => ({
                  ...prev,
                  duracao_minutos: parseInt(e.target.value),
                }))
              }
              options={DURACOES_SERVICO}
            />
          </div>

          {isCustom && (
            <Input
              type="number"
              label="Duração personalizada (minutos)"
              placeholder="Ex: 75"
              value={duracaoCustom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuracaoCustom(parseInt(e.target.value) || 0)}
            />
          )}

          {/* Profissionais habilitados */}
          <div>
            <label className="block text-sm text-stone-600 mb-2">
              Quem pode fazer este serviço?
            </label>
            <div className="flex flex-wrap gap-2">
              {profissionais.map((prof: Profissional) => {
                const selecionado =
                  novoServico.profissionais_habilitados?.includes(prof.id);
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => toggleProfissional(prof.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selecionado
                        ? "bg-terracotta-500 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {prof.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle foto de referência */}
          <Toggle
            checked={novoServico.requer_foto_referencia || false}
            onCheckedChange={(checked: boolean) =>
              setNovoServico((prev: typeof novoServico) => ({
                ...prev,
                requer_foto_referencia: checked,
              }))
            }
            label="Precisa de foto de referência?"
            description="O cliente deve enviar uma foto antes do agendamento"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            variant="outline"
            onClick={adicionarServico}
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
            Adicionar serviço
          </Button>
        </div>
      </div>

      {servicos.length === 0 && (
        <p className="text-sm text-stone-500 text-center py-4">
          Adicione pelo menos um serviço para continuar
        </p>
      )}
    </div>
  );
}
