"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, ArrowLeft, BarChart2, Wallet, QrCode, Banknote, CreditCard } from "lucide-react";

import { Suspense, useEffect } from "react";

function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tipo = searchParams.get("tipo") || "mensal";
  const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") || String(new Date().getFullYear()));
  const metodoFiltro = searchParams.get("metodo") || "todos";

  useEffect(() => {
    // Forçamos o modo claro removendo as classes do topo do site
    const root = document.documentElement;
    const wasDarkTheme = root.classList.contains('dark-theme');
    const wasStyleDark = root.classList.contains('dark');
    
    if (wasDarkTheme) root.classList.remove('dark-theme');
    if (wasStyleDark) root.classList.remove('dark');
    
    // Garantir que o scroll comece no topo
    window.scrollTo(0, 0);

    return () => {
      // Quando sair do relatório, devolvemos as classes do Dashboard
      if (wasDarkTheme) root.classList.add('dark-theme');
      if (wasStyleDark) root.classList.add('dark');
    };
  }, []);

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
  let transactionsPeriod = transacoes.filter(t => {
    const d = new Date(t.data);
    return isWithinInterval(d, { start: startDate, end: endDate });
  });

  // Filtro por Método de Pagamento (Filtra TUDO como solicitado)
  if (metodoFiltro !== "todos") {
    transactionsPeriod = transactionsPeriod.filter(t => t.metodo === metodoFiltro);
  }

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
    <div className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto h-screen w-screen selection:bg-black selection:text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-10 flex flex-col min-h-full">
        <style jsx global>{`
          /* Reset total de cores para o relatório */
          .fixed * { color: #000000 !important; border-color: #000000 !important; background-color: transparent !important; }
          .fixed .bg-black, .fixed .bg-black * { background-color: #000000 !important; color: #ffffff !important; }
          .fixed .bg-gray-50, .fixed .bg-gray-100 { background-color: #f9fafb !important; }
          .fixed button { border: 1px solid #000 !important; }
          
          @media print {
            @page { margin: 1cm; }
            body { background-color: white !important; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .fixed { position: static !important; overflow: visible !important; height: auto !important; width: auto !important; }
          }
        `}</style>

        {/* Barra de Ações (Some na Impressão) */}
        <div className="flex justify-between items-center mb-10 no-print bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-900 font-bold px-4 py-2 rounded-xl transition hover:bg-gray-200">
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden md:inline">Relatório {metodoFiltro === 'todos' ? 'Geral' : metodoFiltro.toUpperCase()}</span>
            <button 
              onClick={handlePrint}
              className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition"
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
            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
              ESTÚDIO {tipo === 'mensal' ? `/ ${format(startDate, 'MMMM yyyy', { locale: ptBR })}` : `/ ANO ${ano}`}
              {metodoFiltro !== 'todos' && <span className="text-gray-500 ml-2">[{metodoFiltro}]</span>}
            </p>
          </div>
          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-black pl-4 md:pr-4">
            <p className="text-xs font-black uppercase tracking-widest">Heinz Tattoo Studio</p>
            <p className="text-[10px] font-bold text-gray-800">Documento Gerado: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>

        {/* GRID DE RESUMO RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
            <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total Receitas</p>
            <p className="text-2xl font-black truncate">{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
            <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total Despesas</p>
            <p className="text-2xl font-black truncate">{totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="bg-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80 tracking-widest text-white">Lucro Líquido</p>
            <p className="text-2xl font-black truncate text-white">{lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        {/* SEÇÃO: FINANCEIRO DETALHADO */}
        <div className="mb-14">
          <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
            <Wallet size={20} />
            Detalhamento por Meio de Pagamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
               <div className="flex justify-between border-b border-black py-2">
                  <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><QrCode size={14}/> Pix</span>
                  <span className="font-black text-lg">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
               </div>
               <div className="flex justify-between border-b border-black py-2">
                  <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><Banknote size={14}/> Dinheiro</span>
                  <span className="font-black text-lg">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
               </div>
               <div className="flex justify-between border-b border-black py-2">
                  <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><CreditCard size={14}/> Cartão</span>
                  <span className="font-black text-lg">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
               </div>
            </div>
            <div className="bg-gray-50 p-6 border-l-4 border-black">
               <p className="text-[10px] font-black uppercase text-black mb-3 tracking-widest underline decoration-2 underline-offset-4">Nota Operacional</p>
               <p className="text-sm leading-relaxed font-bold">
                 Este relatório contém dados filtrados {metodoFiltro === 'todos' ? 'de todas as formas de pagamento' : `exclusivamente para pagamentos via ${metodoFiltro.toUpperCase()}`}. 
                 O volume total capturado é de <b>{totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>.
               </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO: PERFORMANCE DE AGENDAMENTOS */}
        <div className="mb-14">
          <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
            <BarChart2 size={20} />
            Evolução Comercial (Geral)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 border border-black rounded-sm text-center">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total</p>
                 <p className="text-3xl font-black">{agendamentosPeriod.length}</p>
              </div>
              <div className="p-5 border border-black rounded-sm text-center">
                 <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-1">Concluídos</p>
                 <p className="text-3xl font-black">{concluidos.length}</p>
              </div>
              <div className="p-5 border border-black rounded-sm text-center">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Cancelados</p>
                 <p className="text-3xl font-black">{cancelados.length}</p>
              </div>
              <div className="p-5 border border-black rounded-sm text-center">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Pendentes</p>
                 <p className="text-3xl font-black">{pendentes.length}</p>
              </div>
          </div>
        </div>

        {/* SEÇÃO: LISTAGEM DE TRANSAÇÕES */}
        <div className="flex-1 overflow-x-auto">
          <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-tight">Registro de Movimentações</h2>
          <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100">
                <th className="p-3 uppercase font-black border border-black">Data</th>
                <th className="p-3 uppercase font-black border border-black">Descrição</th>
                <th className="p-3 uppercase font-black border border-black">Método</th>
                <th className="p-3 uppercase font-black border border-black text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactionsPeriod.map((t, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="p-3 font-bold border border-black whitespace-nowrap">{format(new Date(t.data), "dd/MM")}</td>
                  <td className="p-3 font-bold text-sm border border-black">{t.descricao}</td>
                  <td className="p-3 uppercase text-[9px] font-black border border-black whitespace-nowrap">{t.metodo}</td>
                  <td className="p-3 text-right font-black text-sm border border-black whitespace-nowrap">
                    {t.tipo === 'despesa' ? '-' : ''}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 pt-10 border-t-2 border-black text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Heinz Tattoo Studio - Documento de Validade Interna</p>
          <p className="text-[9px] text-gray-500 mt-1 italic">Este relatório é gerado automaticamente pelo sistema de gestão Heinz Studio.</p>
        </div>
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
