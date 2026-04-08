"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useFinanceiroStore, Transacao } from "@/store/useFinanceiroStore";

interface Props { isOpen: boolean; onClose: () => void; initialData?: Transacao | null;}

export function ModalTransacao({ isOpen, onClose, initialData }: Props) {
  const { addTransacao, updateTransacao } = useFinanceiroStore();
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [cat, setCat] = useState("Venda Genérica");

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setDesc(initialData.descricao);
      setValor(initialData.valor.toString());
      setCat(initialData.categoria);
    } else {
      setTipo('receita'); setDesc(""); setValor(""); setCat("Venda Genérica");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (initialData) {
        updateTransacao(initialData.id, { tipo, descricao: desc, valor: Number(valor), categoria: cat });
    } else {
        addTransacao({
          tipo,
          categoria: cat,
          descricao: desc || "Registro Avulso",
          valor: Number(valor) || 0,
          conta: 'Empresa',
          metodo: 'Pix',
          data: new Date().toISOString()
        });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Registro" : "Novo Registro Manual"}>
      <div className="space-y-4">
        <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border text-gray-800">
          <option value="receita">Receita (Entrada)</option>
          <option value="despesa">Despesa (Saída)</option>
        </select>
        <input type="text" placeholder="Luz, Internet, Água, Aluguel..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-gray-800" />
        <input type="text" placeholder="Categoria (ex: Despesas Fixas)" value={cat} onChange={e => setCat(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-gray-800" />
        <input type="number" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-4 py-3 rounded-xl border font-bold text-gray-800" />
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">{initialData ? "Atualizar" : "Salvar e Lançar"}</button>
      </div>
    </Modal>
  );
}
