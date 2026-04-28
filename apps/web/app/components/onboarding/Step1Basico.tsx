import React, { useState, useEffect } from "react";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { FUSOS_BRASIL, TIPOS_NEGOCIO } from "~/lib/utils";

interface Step1Data {
  nome: string;
  tipoNegocio: string;
  timezone: string;
}

interface Step1BasicoProps {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

export function Step1Basico({ data, onChange }: Step1BasicoProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof Step1Data, string>> = {};
    if (!data.nome.trim()) {
      newErrors.nome = "Nome do salão é obrigatório";
    }
    if (!data.tipoNegocio) {
      newErrors.tipoNegocio = "Selecione o tipo de negócio";
    }
    if (!data.timezone) {
      newErrors.timezone = "Selecione o fuso horário";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validate();
  }, [data]);

  return (
    <div className="space-y-6">
      <Input
        label="Nome do salão/clínica"
        placeholder="Ex: Salão Bella Rosa"
        value={data.nome}
        onChange={(e) => onChange({ ...data, nome: e.target.value })}
        error={errors.nome}
        required
      />

      <Select
        label="Tipo de negócio"
        placeholder="Selecione..."
        value={data.tipoNegocio}
        onChange={(e) => onChange({ ...data, tipoNegocio: e.target.value })}
        error={errors.tipoNegocio}
        options={TIPOS_NEGOCIO}
        required
      />

      <Select
        label="Fuso horário"
        placeholder="Selecione seu fuso horário..."
        value={data.timezone}
        onChange={(e) => onChange({ ...data, timezone: e.target.value })}
        error={errors.timezone}
        options={FUSOS_BRASIL.map((f) => ({ label: f.label, value: f.value }))}
        helperText="Escolha a região onde seu negócio está localizado"
        required
      />
    </div>
  );
}

export type { Step1Data };
