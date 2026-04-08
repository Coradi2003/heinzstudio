"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { Users, FileText, Wrench, Box, TrendingUp, TrendingDown, BarChart2, CheckCircle2, Clock, XCircle, QrCode, Banknote, CreditCard, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const { agendamentos } = useAgendaStore();
  const { transacoes } = useFinanceiroStore();
  const { produtos } = useProdutosStore();
  const { servicos } = useServicosStore();
  const { clientes } = useClientesStore();

  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7);
  const [dataManual, setDataManual] = useState<string>("");

  // -- FINANCEIRO (Mensal) --
  const currentMonth = new Date().getMonth();
  const baseTrans = transacoes.filter(t => new Date(t.data).getMonth() === currentMonth);
  const receitas = baseTrans.filter(t => t.tipo === 'receita');
  const faturamento = receitas.reduce((a,b) => a + b.valor, 0);
  const despesas = baseTrans.filter(t => t.tipo === 'despesa').reduce((a,b) => a + b.valor, 0);
  const saldo = faturamento - despesas;

  // -- BREAKDOWN POR MÉTODO DE PAGAMENTO --
  const porPix = receitas.filter(t => t.metodo === 'Pix').reduce((a,b) => a + b.valor, 0);
  const porDinheiro = receitas.filter(t => t.metodo === 'Dinheiro').reduce((a,b) => a + b.valor, 0);
  const porCartao = receitas.filter(t => t.metodo === 'Cartão').reduce((a,b) => a + b.valor, 0);
  const totalMetodos = Math.max(porPix + porDinheiro + porCartao, 1);

  // -- EVOLUÇÃO (Agendamentos) --
  const dateLimit = new Date();
  if (dataManual) {
    const [year, month, day] = dataManual.split('-').map(Number);
    dateLimit.setFullYear(year, month - 1, day);
    dateLimit.setHours(0, 0, 0, 0);
  } else {
    dateLimit.setDate(dateLimit.getDate() - periodo);
  }
  const agndsPeriodo = agendamentos.filter(a => new Date(a.dataInicio) >= dateLimit);

  const aprovadosTot = agndsPeriodo.filter(a => a.status === 'concluido' || a.status === 'agendado').reduce((acc, curr) => acc + curr.valorTotal, 0);
  const pendentesTot = agndsPeriodo.filter(a => a.status === 'pendente').reduce((acc, curr) => acc + curr.valorTotal, 0);
  const rejeitadosTot = agndsPeriodo.filter(a => a.status === 'cancelado').reduce((acc, curr) => acc + curr.valorTotal, 0);

  const pendentesCount = agendamentos.filter(a => a.status === 'pendente' || a.status === 'agendado').length;
  const concluidosCount = agendamentos.filter(a => a.status === 'concluido').length;

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

      {/* 1.5 Bloco de Entradas por Método */}
      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100/50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Entradas do Mês por Forma de Pagamento</p>
        <div className="space-y-3">

          {/* PIX */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <QrCode size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-600">Pix</span>
                <span className="text-xs font-bold text-gray-800">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(porPix/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

          {/* DINHEIRO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 shrink-0">
              <Banknote size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-600">Dinheiro</span>
                <span className="text-xs font-bold text-gray-800">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${(porDinheiro/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

          {/* CARTÃO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <CreditCard size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-600">Cartão</span>
                <span className="text-xs font-bold text-gray-800">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${(porCartao/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Evolução dos Agendamentos */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 mt-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <BarChart2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">Evolução dos Agendamentos</h3>
            <p className="text-xs text-gray-400">Valores por período</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {[7, 14, 30].map(dia => (
            <button 
              key={dia}
              onClick={() => {
                setPeriodo(dia as any);
                setDataManual("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex-shrink-0 ${periodo === dia && !dataManual ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {dia} dias
            </button>
          ))}
          <div className="relative flex-shrink-0">
             <button 
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${dataManual ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              <Calendar size={14} />
              {dataManual ? new Date(dataManual + 'T00:00:00').toLocaleDateString('pt-BR') : 'Personalizado'}
            </button>
            <input 
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              onChange={(e) => {
                setDataManual(e.target.value);
                setPeriodo(7); // reset periodo logicamente mas o view prioriza dataManual
              }}
            />
          </div>
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

      {/* 3. Grid de Atributos */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
        <Link href="/agenda" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Clock size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{pendentesCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Agendamentos Pendentes</p>
        </Link>

        <Link href="/agenda" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <CheckCircle2 size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{concluidosCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Agendamentos Concluídos</p>
        </Link>
      </div>
    </div>
  );
}
