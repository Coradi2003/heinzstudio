"use client";

import { useState } from "react";
import { Plus, Building2, User, ArrowUpRight, ArrowDownRight, Wallet, Pencil, Trash2 } from "lucide-react";
import { useFinanceiroStore, Transacao } from "@/store/useFinanceiroStore";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModalTransacao } from "@/components/financeiro/ModalTransacao";

export default function FinanceiroPage() {
  const { transacoes, removeTransacao } = useFinanceiroStore();
  const [contaVisualizacao, setContaVisualizacao] = useState<'Empresa' | 'Particular'>('Empresa');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transEdit, setTransEdit] = useState<Transacao | null>(null);

  const transacoesFiltradas = transacoes.filter(t => t.conta === contaVisualizacao);
  
  const totalReceitas = transacoesFiltradas.filter(t => t.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
  const totalDespesas = transacoesFiltradas.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Financeiro</h2>
          <p className="text-gray-500">Controle completo de caixa e faturamento</p>
        </div>
        <button onClick={() => { setTransEdit(null); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20">
          <Plus size={20} />
          <span>Novo Registro</span>
        </button>
      </div>

      {/* Abas */}
      <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-sm mb-8">
        <button 
          onClick={() => setContaVisualizacao('Empresa')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${contaVisualizacao === 'Empresa' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Building2 size={18} /> Empresa
        </button>
        <button 
          onClick={() => setContaVisualizacao('Particular')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${contaVisualizacao === 'Particular' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <User size={18} /> Particular
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
            <p className="text-gray-500 font-medium">Saldo Atual</p>
          </div>
          <h3 className="text-4xl font-bold text-gray-800 tracking-tight mt-4">
            {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <ArrowUpRight size={20} />
            </div>
            <p className="text-gray-500 font-medium">Entradas</p>
          </div>
          <h3 className="text-4xl font-bold text-green-600 tracking-tight mt-4">
            {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <ArrowDownRight size={20} />
            </div>
            <p className="text-gray-500 font-medium">Saídas</p>
          </div>
          <h3 className="text-4xl font-bold text-red-600 tracking-tight mt-4">
            {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Histórico de Transações</h3>
        </div>
        
        <div className="p-0">
          {transacoesFiltradas.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {transacoesFiltradas.map((t) => (
                <div key={t.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.tipo === 'receita' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {t.tipo === 'receita' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{t.descricao}</h4>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-gray-500">{format(parseISO(t.data), "dd/MM/yyyy • HH:mm", { locale: ptBR })}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-600 px-2 py-0.5 bg-gray-100 rounded-md">{t.categoria}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-600">{t.metodo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-4 md:mt-0">
                    <div className={`text-xl font-bold ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.tipo === 'receita' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition">
                      <button onClick={() => { setTransEdit(t); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={18} /></button>
                      <button onClick={() => { if(confirm('Apagar registro financeiro?')) removeTransacao(t.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Wallet size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">Nenhuma movimentação registrada.</p>
              <p className="text-sm mt-1">As entradas aparecerão aqui quando você concluir um agendamento.</p>
            </div>
          )}
        </div>
      </div>

      <ModalTransacao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={transEdit} />
    </div>
  );
}
