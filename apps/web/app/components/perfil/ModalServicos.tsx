import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import type { TenantConfig } from '~/types';

interface ModalServicosProps {
  dados: TenantConfig;
  onClose: () => void;
  onSave: (dados: TenantConfig) => void;
}

export function ModalServicos({ dados, onClose, onSave }: ModalServicosProps) {
  const [servicos, setServicos] = useState(dados.catalogo_servicos || []);
  const [formAberto, setFormAberto] = useState(false);
  const [novoServico, setNovoServico] = useState({
    nome: '',
    preco: '',
    duracao_minutos: 60,
  });

  const adicionarServico = () => {
    if (!novoServico.nome.trim() || !novoServico.preco) return;
    setServicos([
      ...servicos,
      {
        nome: novoServico.nome,
        slug: novoServico.nome.toLowerCase().replace(/\s+/g, '-'),
        preco: parseFloat(novoServico.preco),
        duracao_minutos: novoServico.duracao_minutos,
        profissionais_habilitados: [],
      },
    ]);
    setNovoServico({ nome: '', preco: '', duracao_minutos: 60 });
    setFormAberto(false);
  };

  const deletarServico = (slug: string) => {
    setServicos(servicos.filter((s) => s.slug !== slug));
  };

  const salvar = () => {
    onSave({
      ...dados,
      catalogo_servicos: servicos,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-display">Serviços</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lista atual */}
          {servicos.length === 0 && (
            <p className="text-stone-500 text-center py-4">Nenhum serviço cadastrado</p>
          )}
          {servicos.map((serv) => (
            <div key={serv.slug} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium">{serv.nome}</p>
                <p className="text-sm text-stone-500">
                  R$ {serv.preco.toFixed(2)} • {serv.duracao_minutos}min
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletarServico(serv.slug)}
                className="text-red-500 hover:text-red-700"
              >
                Deletar
              </Button>
            </div>
          ))}

          {/* Form adicionar */}
          {formAberto && (
            <div className="p-4 bg-stone-50 rounded-lg space-y-3 border-t">
              <Input
                label="Nome do serviço"
                value={novoServico.nome}
                onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                placeholder="Ex: Corte Feminino"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Preço (R$)"
                  type="number"
                  value={novoServico.preco}
                  onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
                  placeholder="50"
                />
                <Input
                  label="Duração (min)"
                  type="number"
                  value={novoServico.duracao_minutos}
                  onChange={(e) => setNovoServico({ ...novoServico, duracao_minutos: parseInt(e.target.value) || 0 })}
                  placeholder="60"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={adicionarServico}
                  disabled={!novoServico.nome.trim() || !novoServico.preco}
                  className="flex-1"
                >
                  Adicionar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setFormAberto(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {!formAberto && (
            <button
              onClick={() => setFormAberto(true)}
              className="w-full p-3 border-2 border-dashed border-stone-300 rounded-lg text-stone-600 hover:border-terracotta-300 hover:text-terracotta-600"
            >
              + Adicionar serviço
            </button>
          )}
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
