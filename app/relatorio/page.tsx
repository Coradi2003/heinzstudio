"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, ArrowLeft, BarChart2, TrendingUp, TrendingDown, Wallet } from "lucide-react";

import { Suspense } from "react";

function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tipo = searchParams.get("tipo") || "mensal";
  const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") || String(new Date().getFullYear()));

  const { agendamentos } = useAgendaStore();
  const { transacoes } = useFinanceiroStore();

  // 1. Definir Intervalo
  let startDate: Date;
  let endDate: Date;

  if (tipo === "mensal") {
    const baseDate = new Date(ano, mes - 1, 1);
    startDate = startOfMonth(baseDate);
    endDate = endOfMonth(baseDate);
  } else {
    const baseDate = new Date(ano, 0, 1);
    startDate = startOfYear(baseDate);
    endDate = endOfYear(baseDate);
  }

  // 2. Filtrar Dados
  const transactionsPeriod = transacoes.filter(t => {
    const d = new Date(t.data);
    return isWithinInterval(d, { start: startDate, end: endDate });
  });

  const agendamentosPeriod = agendamentos.filter(a => {
    const d = parseISO(a.dataInicio);
    return isWithinInterval(d, { start: startDate, end: endDate });
  });

  // 3. Cálculos Financeiros
  const receitas = transactionsPeriod.filter(t => t.tipo === 'receita');
  const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transactionsPeriod.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
  const lucro = totalReceitas - totalDespesas;

  const porPix = receitas.filter(t => t.metodo === 'Pix').reduce((acc, t) => acc + t.valor, 0);
  const porDinheiro = receitas.filter(t => t.metodo === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const porCartao = receitas.filter(t => t.metodo === 'Cartão').reduce((acc, t) => acc + t.valor, 0);

  // 4. Cálculos Agenda
  const concluidos = agendamentosPeriod.filter(a => a.status === 'concluido');
  const cancelados = agendamentosPeriod.filter(a => a.status === 'cancelado');
  const pendentes = agendamentosPeriod.filter(a => a.status === 'agendado' || a.status === 'pendente');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans max-w-4xl mx-auto shadow-2xl my-0 md:my-10 rounded-sm border-x border-gray-100 flex flex-col">
      <style jsx global>{`
        /* Forçar modo claro absoluto para esta página */
        body { background-color: #f3f4f6 !important; color: black !important; }
        .dark-theme body { background-color: #f3f4f6 !important; }
        * { border-color: #e5e7eb !important; }
        
        @media print {
          body { background-color: white !important; }
          .min-h-screen { margin: 0 !important; padding: 0 !important; shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Barra de Ações (Sone na Impressão) */}
      <div className="flex justify-between items-center mb-10 no-print bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition">
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">Relatório Oficial</span>
          <button 
            onClick={handlePrint}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition shadow-lg"
          >
            <Printer size={16} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="border-b-4 border-black pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Relatório</h1>
          <p className="text-xl font-black text-gray-800 uppercase tracking-tight">
            ESTÚDIO {tipo === 'mensal' ? `/ ${format(startDate, 'MMMM yyyy', { locale: ptBR })}` : `/ ANO ${ano}`}
          </p>
        </div>
        <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-black pl-4 md:pr-4">
          <p className="text-xs font-black uppercase tracking-widest">Heinz Tattoo Studio</p>
          <p className="text-[10px] font-bold text-gray-500">Documento Gerado: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>

      {/* GRID DE RESUMO RÁPIDO - Fix Padding and Content Fit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="border-2 border-black p-5 rounded-2xl flex flex-col justify-center min-h-[100px]">
          <p className="text-[10px] font-black uppercase mb-1 text-gray-400 tracking-widest">Total Receitas</p>
          <p className="text-2xl font-black truncate">{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="border-2 border-black p-5 rounded-2xl flex flex-col justify-center min-h-[100px]">
          <p className="text-[10px] font-black uppercase mb-1 text-gray-400 tracking-widest">Total Despesas</p>
          <p className="text-2xl font-black truncate">{totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-black text-white p-5 rounded-2xl shadow-xl flex flex-col justify-center min-h-[100px]">
          <p className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-widest">Lucro Líquido</p>
          <p className="text-2xl font-black truncate">{lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      {/* SEÇÃO: FINANCEIRO DETALHADO */}
      <div className="mb-14">
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
          <Wallet size={20} />
          Detalhamento Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
             <div className="flex justify-between border-b-2 border-gray-50 py-2">
                <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider">Entradas via PIX</span>
                <span className="font-black text-lg">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
             <div className="flex justify-between border-b-2 border-gray-50 py-2">
                <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider">Entradas em Dinheiro</span>
                <span className="font-black text-lg">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
             <div className="flex justify-between border-b-2 border-gray-50 py-2">
                <span className="font-bold text-gray-500 uppercase text-[11px] tracking-wider">Entradas em Cartão</span>
                <span className="font-black text-lg">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
          </div>
          <div className="bg-gray-100 p-6 rounded-3xl border-l-4 border-black">
             <p className="text-[10px] font-black uppercase text-black mb-3 tracking-widest underline decoration-2 underline-offset-4">Análise Operacional</p>
             <p className="text-sm leading-relaxed font-medium">
               Relatório referente ao faturamento bruto de <b>{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>. 
               {lucro > 0 ? " O resultado operacional demonstra saúde financeira positiva no período analisado." : " Recomenda-se uma revisão estratégica dos custos fixos e variáveis."} 
               Predominância de recebimento: {porPix > porDinheiro && porPix > porCartao ? "PIX" : porCartao > porDinheiro ? "CARTÃO" : "DINHEIRO"}.
             </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO: PERFORMANCE DE AGENDAMENTOS */}
      <div className="mb-14">
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
          <BarChart2 size={20} />
          Evolução Comercial
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 border-2 border-gray-100 rounded-2xl text-center">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Carga Total</p>
               <p className="text-3xl font-black">{agendamentosPeriod.length}</p>
            </div>
            <div className="p-5 border-2 border-gray-100 rounded-2xl text-center bg-gray-50">
               <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Concluídos</p>
               <p className="text-3xl font-black">{concluidos.length}</p>
            </div>
            <div className="p-5 border-2 border-gray-100 rounded-2xl text-center">
               <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Rejeitados</p>
               <p className="text-3xl font-black">{cancelados.length}</p>
            </div>
            <div className="p-5 border-2 border-gray-100 rounded-2xl text-center">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendentes</p>
               <p className="text-3xl font-black">{pendentes.length}</p>
            </div>
        </div>
      </div>

      {/* SEÇÃO: LISTAGEM DE TRANSAÇÕES */}
      <div className="flex-1">
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-tight">Registro de Movimentações</h2>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50 text-gray-500">
              <th className="p-3 uppercase font-black">Data</th>
              <th className="p-3 uppercase font-black">Descrição do Item</th>
              <th className="p-3 uppercase font-black">Categoria</th>
              <th className="p-3 uppercase font-black text-right">Valor Líquido</th>
            </tr>
          </thead>
          <tbody>
            {transactionsPeriod.slice(0, 100).map((t, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-3 font-bold">{format(new Date(t.data), "dd/MM")}</td>
                <td className="p-3 font-bold text-sm">{t.descricao}</td>
                <td className="p-3 uppercase text-[9px] font-black text-gray-400">{t.categoria}</td>
                <td className={`p-3 text-right font-black text-sm ${t.tipo === 'receita' ? 'text-black' : 'text-gray-400'}`}>
                  {t.tipo === 'despesa' ? '-' : ''}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactionsPeriod.length > 100 && (
          <p className="text-[10px] italic text-gray-400 mt-4 p-4 bg-gray-50 rounded-xl text-center font-bold">
            * Lista limitada às primeiras 100 movimentações para otimização do documento.
          </p>
        )}
      </div>

      <div className="mt-16 pt-10 border-t-2 border-black text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-black">Heinz Tattoo Studio - Documento de Validade Interna</p>
        <p className="text-[9px] text-gray-400 mt-1 italic">Este relatório é gerado automaticamente pelo sistema de gestão Heinz Studio.</p>
      </div>

    </div>
  );
}

export default function RelatorioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Carregando relatório...</div>}>
      <RelatorioContent />
    </Suspense>
  );
}
