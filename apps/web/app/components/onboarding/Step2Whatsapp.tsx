import React, { useState, useEffect } from "react";
import { Input } from "~/components/ui/Input";
import { mascaraWhatsApp, paraFormatoInternacional } from "~/lib/utils";
import { AlertCircle } from "lucide-react";

interface Step2Data {
  whatsappBusiness: string;
  whatsappDono: string;
}

interface Step2WhatsappProps {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

export function Step2Whatsapp({ data, onChange }: Step2WhatsappProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [displayValues, setDisplayValues] = useState({
    whatsappBusiness: mascaraWhatsApp(data.whatsappBusiness),
    whatsappDono: mascaraWhatsApp(data.whatsappDono),
  });

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, "");
    return clean.length >= 10 && clean.length <= 11;
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Step2Data, string>> = {};
    if (!data.whatsappBusiness || !validatePhone(data.whatsappBusiness)) {
      newErrors.whatsappBusiness = "Número de WhatsApp inválido";
    }
    if (!data.whatsappDono || !validatePhone(data.whatsappDono)) {
      newErrors.whatsappDono = "Número pessoal é obrigatório";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validate();
  }, [data]);

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = mascaraWhatsApp(e.target.value);
    setDisplayValues((prev) => ({ ...prev, whatsappBusiness: masked }));
    const internacional = paraFormatoInternacional(masked);
    onChange({ ...data, whatsappBusiness: internacional });
  };

  const handleDonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = mascaraWhatsApp(e.target.value);
    setDisplayValues((prev) => ({ ...prev, whatsappDono: masked }));
    const internacional = paraFormatoInternacional(masked);
    onChange({ ...data, whatsappDono: internacional });
  };

  return (
    <div className="space-y-6">
      <div>
        <Input
          label="WhatsApp Business do salão"
          placeholder="(35) 99999-9999"
          value={displayValues.whatsappBusiness}
          onChange={handleBusinessChange}
          error={errors.whatsappBusiness}
          required
          maxLength={15}
        />
      </div>

      <div>
        <Input
          label="Seu WhatsApp pessoal"
          placeholder="(35) 99999-9999"
          value={displayValues.whatsappDono}
          onChange={handleDonoChange}
          error={errors.whatsappDono}
          helperText="Aqui você vai receber avisos de novos agendamentos"
          required
          maxLength={15}
        />
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800 font-medium">
            Configuração técnica do WhatsApp Business
          </p>
          <p className="text-sm text-amber-700 mt-1">
            A configuração técnica do WhatsApp Business será feita por nossa
            equipe após o cadastro. Não se preocupe com isso agora!
          </p>
        </div>
      </div>
    </div>
  );
}

export type { Step2Data };
