"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { Users, Scissors, Package, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { agendamentos } = useAgendaStore();
  const { transacoes } = useFinanceiroStore();
  const { produtos } = useProdutosStore();

  const currentMonth = new Date().getMonth();
  const baseTrans = transacoes.filter(t => new Date(t.data).getMonth() === currentMonth);
  
  const faturamento = baseTrans.filter(t => t.tipo === 'receita').reduce((a,b) => a + b.valor, 0);
  const despesas = baseTrans.filter(t => t.tipo === 'despesa').reduce((a,b) => a + b.valor, 0);

  // Calcula clientes unicos
  const totalClientes = new Set(agendamentos.map(a => a.clienteNome)).size;
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-12 pb-24 px-8 rounded-b-[40px] shadow-lg text-white">
        <h2 className="text-3xl font-bold mb-2">Visão Geral</h2>
        <p className="opacity-80">Acompanhe os resultados do estúdio neste mês.</p>
      </div>

      {/* Main Content Area */}
      <div className="px-8 -mt-12">
        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Faturamento do Mês</p>
              <h3 className="text-2xl font-bold text-gray-800">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Entradas Confirmadas</p>
              <h3 className="text-2xl font-bold text-gray-800">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <TrendingDown size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Saídas / Despesas</p>
              <h3 className="text-2xl font-bold text-gray-800">{despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</h3>
            </div>
          </div>
          
        </div>

        {/* System Summaries */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 mt-10">Resumo do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group cursor-pointer hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 font-medium mb-1">Total de Clientes</p>
              <h4 className="text-3xl font-bold text-gray-800">{totalClientes}</h4>
            </div>
            <Users className="text-gray-300 group-hover:text-primary transition-colors" size={40} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group cursor-pointer hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 font-medium mb-1">Serviços Listados</p>
              <h4 className="text-3xl font-bold text-gray-800">4</h4>
            </div>
            <Scissors className="text-gray-300 group-hover:text-primary transition-colors" size={40} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group cursor-pointer hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 font-medium mb-1">Produtos Únicos</p>
              <h4 className="text-3xl font-bold text-gray-800">{produtos.length}</h4>
            </div>
            <Package className="text-gray-300 group-hover:text-primary transition-colors" size={40} />
          </div>
        </div>

      </div>
    </div>
  );
}
