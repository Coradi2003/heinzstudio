"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useFinanceiroStore, DespesaFixa } from "@/store/useFinanceiroStore";
import { Trash2, Plus, Zap, AlertCircle, CheckCircle2, Loader2, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface ModalDespesasFixasProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalDespesasFixas({ isOpen, onClose }: ModalDespesasFixasProps) {
  const { despesasFixas, transacoes, carregarDespesasFixas, addDespesaFixa, removeDespesaFixa, addTransacao } = useFinanceiroStore();
  
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("1");
  const [categoria, setCategoria] = useState("Fixo");
  const [conta, setConta] = useState<'Empresa' | 'Particular'>('Empresa');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) carregarDespesasFixas();
  }, [isOpen]);

  const handleAdd = async () => {
    if (!descricao || !valor) return;
    await addDespesaFixa({
      descricao,
      valor: Number(valor),
      vencimento: Number(vencimento),
      categoria,
      conta
    });
    setDescricao("");
    setValor("");
  };

  const lancarDespesas = async () => {
    setIsProcessing(true);
    const inicioMes = startOfMonth(new Date());
    const fimMes = endOfMonth(new Date());

    // Filtrar o que já foi lançado esse mês (pela descrição)
    const jaLancadas = transacoes
      .filter(t => isWithinInterval(parseISO(t.data), { start: inicioMes, end: fimMes }))
      .map(t => t.descricao.toLowerCase());

    const paraLancar = despesasFixas.filter(df => !jaLancadas.includes(df.descricao.toLowerCase()));

    if (paraLancar.length === 0) {
      alert("Todas as despesas fixas deste mês já foram lançadas!");
      setIsProcessing(false);
      return;
    }

    try {
      for (const df of paraLancar) {
        await addTransacao({
          tipo: 'despesa',
          descricao: df.descricao,
          valor: df.valor,
          categoria: df.categoria,
          metodo: 'Pix',
          data: new Date().toISOString(), // Usa data atual do lançamento
          conta: df.conta
        });
      }
      alert(`${paraLancar.length} despesas lançadas com sucesso!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Despesas Fixas">
      <div className="space-y-6">
        
        {/* Formulário de Adição */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Novo Modelo de Despesa</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              placeholder="Ex: Aluguel" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
            <input 
              type="number"
              placeholder="Valor R$" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
              value={valor}
              onChange={e => setValor(e.target.value)}
            />
            <div className="flex gap-2">
              <select 
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white"
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
              >
                {[...Array(31)].map((_, i) => (
                  <option key={i+1} value={i+1}>Dia {i+1}</option>
                ))}
              </select>
              <select 
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white"
                value={conta}
                onChange={e => setConta(e.target.value as any)}
              >
                <option value="Empresa">Empresa</option>
                <option value="Particular">Particular</option>
              </select>
            </div>
            <button 
              onClick={handleAdd}
              className="bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition py-2.5"
            >
              <Plus size={18} /> Salvar Modelo
            </button>
          </div>
        </div>

        {/* Botão de Lançamento em Massa */}
        {despesasFixas.length > 0 && (
          <button 
            onClick={lancarDespesas}
            disabled={isProcessing}
            className="w-full bg-primary text-white p-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
            Lançar Despesas do Mês Atual
          </button>
        )}

        {/* Listagem */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Suas Contas Recorrentes</p>
          {despesasFixas.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 text-sm uppercase font-bold">Nenhum modelo cadastrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {despesasFixas.map((df) => (
                <div key={df.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-[10px] font-black leading-none">
                      <span className="text-gray-400 uppercase">Dia</span>
                      <span className="text-gray-900 text-lg">{df.vencimento}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{df.descricao}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded">{df.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{df.conta}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeDespesaFixa(df.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
