import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import type { TenantConfig } from '~/types';

interface ModalProfissionaisProps {
  dados: TenantConfig;
  onClose: () => void;
  onSave: (dados: TenantConfig) => void;
}

export function ModalProfissionais({ dados, onClose, onSave }: ModalProfissionaisProps) {
  const [profissionais, setProfissionais] = useState(dados.profissionais || []);
  const [novoNome, setNovoNome] = useState('');
  const [novasEspecialidades, setNovasEspecialidades] = useState('');

  const adicionarProfissional = () => {
    if (!novoNome.trim()) return;
    setProfissionais([
      ...profissionais,
      {
        id: crypto.randomUUID(),
        nome: novoNome,
        especialidades: novasEspecialidades.split(',').map(s => s.trim()).filter(Boolean),
        dias_trabalho: ['seg', 'ter', 'qua', 'qui', 'sex'],
      },
    ]);
    setNovoNome('');
    setNovasEspecialidades('');
  };

  const deletarProfissional = (id: string) => {
    setProfissionais(profissionais.filter((p) => p.id !== id));
  };

  const salvar = () => {
    onSave({
      ...dados,
      profissionais,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-display">Profissionais</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lista atual */}
          {profissionais.length === 0 && (
            <p className="text-stone-500 text-center py-4">Nenhum profissional cadastrado</p>
          )}
          {profissionais.map((prof) => (
            <div key={prof.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium">{prof.nome}</p>
                <p className="text-sm text-stone-500">
                  {prof.especialidades.length} especialidades
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletarProfissional(prof.id)}
                className="text-red-500 hover:text-red-700"
              >
                Deletar
              </Button>
            </div>
          ))}

          {/* Adicionar novo */}
          <div className="p-4 bg-stone-50 rounded-lg space-y-3 border-t pt-4">
            <Input
              label="Nome do profissional"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              onKeyPress={(e) => e.key === 'Enter' && adicionarProfissional()}
            />
            <Input
              label="Especialidades (separadas por vírgula)"
              value={novasEspecialidades}
              onChange={(e) => setNovasEspecialidades(e.target.value)}
              placeholder="Ex: Corte, Coloração, Manicure"
            />
            <Button 
              variant="secondary"
              onClick={adicionarProfissional}
              disabled={!novoNome.trim()}
              className="w-full"
            >
              + Adicionar
            </Button>
          </div>
        </div>

        <div className="border-t p-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}
