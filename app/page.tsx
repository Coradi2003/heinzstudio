"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { Users, FileText, Wrench, Briefcase, Box, Truck, TrendingUp, TrendingDown, BarChart2, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const { agendamentos } = useAgendaStore();
  const { transacoes } = useFinanceiroStore();
  const { produtos } = useProdutosStore();
  const { servicos } = useServicosStore();
  const { clientes } = useClientesStore();

  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7);

  // -- FINANCEIRO (Mensal) --
  const currentMonth = new Date().getMonth();
  const baseTrans = transacoes.filter(t => new Date(t.data).getMonth() === currentMonth);
  const faturamento = baseTrans.filter(t => t.tipo === 'receita').reduce((a,b) => a + b.valor, 0);
  const despesas = baseTrans.filter(t => t.tipo === 'despesa').reduce((a,b) => a + b.valor, 0);
  const saldo = faturamento - despesas;

  // -- EVOLUÇÃO (Orçamentos/Agendamentos) --
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - periodo);

  const agndsPeriodo = agendamentos.filter(a => new Date(a.dataInicio) >= dateLimit);

  const aprovadosTot = agndsPeriodo.filter(a => a.status === 'concluido' || a.status === 'agendado').reduce((acc, curr) => acc + curr.valorTotal, 0);
  const pendentesTot = agndsPeriodo.filter(a => a.status === 'pendente').reduce((acc, curr) => acc + curr.valorTotal, 0);
  const rejeitadosTot = agndsPeriodo.filter(a => a.status === 'cancelado').reduce((acc, curr) => acc + curr.valorTotal, 0);

  const maxVal = Math.max(aprovadosTot, pendentesTot, rejeitadosTot, 1);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-lg mx-auto md:max-w-4xl space-y-4 mb-20 md:mb-0">
      
      {/* 1. Header Card (Saldo) */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-[28px] shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <p className="text-sm font-medium opacity-80 mb-1 z-10 relative">Saldo do Mês</p>
        <h2 className="text-4xl font-bold mb-6 z-10 relative">{saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</h2>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Entradas</p>
              <p className="text-sm font-bold">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Saídas</p>
              <p className="text-sm font-bold">{despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid de 6 Atributos */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 pt-2">
        
        <Link href="/clientes" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
            <Users size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{clientes.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Clientes</p>
        </Link>

        <Link href="/agenda" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <FileText size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{agendamentos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Orçamentos</p>
        </Link>

        <Link href="/servicos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
            <Wrench size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{servicos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Serviços</p>
        </Link>

        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 cursor-not-allowed opacity-80">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-emerald-500">
            <Briefcase size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">0</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Contratos</p>
        </div>

        <Link href="/produtos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
            <Box size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{produtos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Produtos</p>
        </Link>

        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 cursor-not-allowed opacity-80">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Truck size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">0</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Fornecs.</p>
        </div>

      </div>

      {/* 3. Evolução dos Orçamentos */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 mt-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <BarChart2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">Evolução dos Orçamentos</h3>
            <p className="text-xs text-gray-400">Valores por período</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30].map(dia => (
            <button 
              key={dia}
              onClick={() => setPeriodo(dia as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${periodo === dia ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {dia} dias
            </button>
          ))}
        </div>

        {/* 3 Status Cards (Estilo Dark Colors na imagem mas usamos tailwind padrao q fica dark automatico no darkmode) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#f0fdf4] dark-theme:bg-green-900/10 border border-[#bbf7d0] dark-theme:border-green-900/30 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <div className="border border-green-200 rounded-full p-1 mb-2">
               <CheckCircle2 size={12} className="text-green-600" />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Aprovados</p>
            <p className="text-sm font-bold text-gray-800">{aprovadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fefce8] dark-theme:bg-yellow-900/10 border border-[#fef08a] dark-theme:border-yellow-900/30 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <div className="border border-yellow-200 rounded-full p-1 mb-2">
               <Clock size={12} className="text-yellow-600" />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Pendentes</p>
            <p className="text-sm font-bold text-gray-800">{pendentesTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fef2f2] dark-theme:bg-red-900/10 border border-[#fecaca] dark-theme:border-red-900/30 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <div className="border border-red-200 rounded-full p-1 mb-2">
               <XCircle size={12} className="text-red-500" />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Rejeitados</p>
            <p className="text-sm font-bold text-gray-800">{rejeitadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 md:gap-6 mb-4">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aprovados</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pendentes</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rejeitados</span></div>
        </div>

        {/* Graph area */}
        <div className="relative pt-6 pb-2">
          {/* Axis Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] border-b border-dashed border-gray-200"></div>
          
          <div className="flex items-end justify-center gap-6 md:gap-12 h-24 relative z-10 px-4">
            <div className="w-8 bg-green-500 rounded-t-md transition-all duration-700 shadow-sm" style={{ height: `${Math.max((aprovadosTot/maxVal)*100, 5)}%` }}></div>
            <div className="w-8 bg-yellow-500 rounded-t-md transition-all duration-700 shadow-sm" style={{ height: `${Math.max((pendentesTot/maxVal)*100, 5)}%` }}></div>
            <div className="w-8 bg-red-500 rounded-t-md transition-all duration-700 shadow-sm" style={{ height: `${Math.max((rejeitadosTot/maxVal)*100, 5)}%` }}></div>
          </div>
        </div>

      </div>

    </div>
  );
}
