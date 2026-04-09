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
    <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans max-w-4xl mx-auto">
      
      {/* Barra de Ações (Sone na Impressão) */}
      <div className="flex justify-between items-center mb-10 no-print bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition">
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visualizando Relatório</span>
          <button 
            onClick={handlePrint}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20"
          >
            <Printer size={18} />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Relatório de Gestão</h1>
          <p className="text-lg font-bold text-gray-600 uppercase">
            {tipo === 'mensal' ? `${format(startDate, 'MMMM yyyy', { locale: ptBR })}` : `Ano Base: ${ano}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400">HEINZ TATTOO STUDIO</p>
          <p className="text-[10px] text-gray-300">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>
      </div>

      {/* GRID DE RESUMO RÁPIDO */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="border-2 border-black p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase mb-1 text-gray-400">Total Receitas</p>
          <p className="text-2xl font-black">{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="border-2 border-black p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase mb-1 text-gray-400">Total Despesas</p>
          <p className="text-2xl font-black">{totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-black text-white p-4 rounded-xl shadow-lg">
          <p className="text-[10px] font-black uppercase mb-1 opacity-70">Lucro Líquido</p>
          <p className="text-2xl font-black">{lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      {/* SEÇÃO: FINANCEIRO DETALHADO */}
      <div className="mb-12">
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 flex items-center gap-2 pb-1">
          <Wallet size={20} />
          Detalhamento Financeiro
        </h2>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-3">
             <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="font-bold text-gray-600">Entradas via PIX</span>
                <span className="font-black">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="font-bold text-gray-600">Entradas via Dinheiro</span>
                <span className="font-black">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 py-1">
                <span className="font-bold text-gray-600">Entradas via Cartão</span>
                <span className="font-black">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[10px] font-black uppercase text-gray-400 mb-2 underline decoration-black decoration-2 underline-offset-4">Insights de Período</p>
             <p className="text-xs leading-relaxed">
               Este relatório contempla um faturamento de <b>{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>. 
               {lucro > 0 ? " O resultado operacional foi positivo." : " Atenção ao controle de despesas."} 
               A maior parte dos recebimentos veio via {porPix > porDinheiro && porPix > porCartao ? "Pix" : porCartao > porDinheiro ? "Cartão" : "Dinheiro"}.
             </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO: PERFORMANCE DE AGENDAMENTOS */}
      <div className="mb-12">
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 flex items-center gap-2 pb-1">
          <BarChart2 size={20} />
          Evolução de Agendamentos
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 border border-gray-200 rounded-xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase">Total Geral</p>
               <p className="text-xl font-black">{agendamentosPeriod.length}</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl bg-green-50/30">
               <p className="text-[10px] font-bold text-green-600 uppercase">Concluídos</p>
               <p className="text-xl font-black">{concluidos.length}</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl bg-red-50/30">
               <p className="text-[10px] font-bold text-red-600 uppercase">Rejeitados</p>
               <p className="text-xl font-black">{cancelados.length}</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase">Em Espera</p>
               <p className="text-xl font-black">{pendentes.length}</p>
            </div>
        </div>
      </div>

      {/* SEÇÃO: LISTAGEM DE TRANSAÇÕES (Compacta) */}
      <div>
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1">Documento de Movimentação</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Data</th>
              <th className="py-2">Descrição</th>
              <th className="py-2">Categoria</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactionsPeriod.slice(0, 50).map((t, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2">{format(new Date(t.data), "dd/MM")}</td>
                <td className="py-2 font-bold">{t.descricao}</td>
                <td className="py-2 uppercase text-[10px] text-gray-400">{t.categoria}</td>
                <td className={`py-2 text-right font-black ${t.tipo === 'receita' ? 'text-black' : 'text-gray-400'}`}>
                  {t.tipo === 'despesa' ? '-' : ''}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactionsPeriod.length > 50 && (
          <p className="text-[10px] italic text-gray-400 mt-2">* Exibindo apenas as primeiras 50 transações.</p>
        )}
      </div>

      <div className="mt-20 pt-10 border-t border-dashed border-gray-200 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fim do Relatório</p>
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
