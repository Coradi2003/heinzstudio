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
  const [conta, setConta] = useState<'Empresa' | 'Particular'>('Empresa');
  const [metodo, setMetodo] = useState<'Dinheiro' | 'Cartão' | 'Pix'>('Pix');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setDesc(initialData.descricao);
      setValor(initialData.valor.toString());
      setCat(initialData.categoria);
      setConta(initialData.conta);
      setMetodo(initialData.metodo);
      setData(initialData.data.slice(0, 10));
    } else {
      setTipo('receita');
      setDesc("");
      setValor("");
      setCat("Venda Genérica");
      setConta('Empresa');
      setMetodo('Pix');
      setData(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    // Combina data selecionada com hora atual
    const dataISO = new Date(data + 'T' + new Date().toTimeString().slice(0, 8)).toISOString();

    if (initialData) {
      updateTransacao(initialData.id, {
        tipo,
        descricao: desc,
        valor: Number(valor),
        categoria: cat,
        conta,
        metodo,
        data: dataISO
      });
    } else {
      addTransacao({
        tipo,
        categoria: cat,
        descricao: desc || "Registro Avulso",
        valor: Number(valor) || 0,
        conta,
        metodo,
        data: dataISO
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Registro" : "Novo Registro Manual"}>
      <div className="space-y-3">

        {/* Tipo */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as any)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white font-semibold"
          >
            <option value="receita">📈 Receita (Entrada)</option>
            <option value="despesa">📉 Despesa (Saída)</option>
          </select>
        </div>

        {/* Conta */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Conta</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConta('Empresa')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition ${conta === 'Empresa' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              🏢 Empresa
            </button>
            <button
              type="button"
              onClick={() => setConta('Particular')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition ${conta === 'Particular' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              👤 Particular
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descrição</label>
          <input
            type="text"
            placeholder="Luz, Internet, Água, Aluguel..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Categoria</label>
          <input
            type="text"
            placeholder="ex: Despesas Fixas, Serviços..."
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800"
          />
        </div>

        {/* Valor e Método */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Método</label>
            <select
              value={metodo}
              onChange={e => setMetodo(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white font-semibold"
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold"
          />
        </div>

      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">
          {initialData ? "Atualizar" : "Salvar e Lançar"}
        </button>
      </div>
    </Modal>
  );
}
