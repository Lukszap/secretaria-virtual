import { useState } from 'react';

export function useModal(initialModal: string | null = null) {
  const [modalAberto, setModalAberto] = useState<string | null>(initialModal);

  return {
    modalAberto,
    abrirModal: (nome: string) => setModalAberto(nome),
    fecharModal: () => setModalAberto(null),
    isOpen: (nome: string) => modalAberto === nome,
  };
}
