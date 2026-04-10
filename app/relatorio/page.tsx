"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, ArrowLeft, BarChart2, Wallet, QrCode, Banknote, CreditCard, MessageCircle, Loader2, Download, Save } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";


function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tipo = searchParams.get("tipo") || "mensal";
  const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") || String(new Date().getFullYear()));
  const metodoFiltro = searchParams.get("metodo") || "todos";
  const contaFiltro = searchParams.get("conta") || "Empresa";

  useEffect(() => {
    const root = document.documentElement;
    const wasDarkTheme = root.classList.contains('dark-theme');
    const wasStyleDark = root.classList.contains('dark');
    if (wasDarkTheme) root.classList.remove('dark-theme');
    if (wasStyleDark) root.classList.remove('dark');
    window.scrollTo(0, 0);
    return () => {
      if (wasDarkTheme) root.classList.add('dark-theme');
      if (wasStyleDark) root.classList.add('dark');
    };
  }, []);

  const { agendamentos } = useAgendaStore();
  const { transacoes } = useFinanceiroStore();

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

  let transactionsPeriod = transacoes.filter(t => {
    const d = new Date(t.data);
    return isWithinInterval(d, { start: startDate, end: endDate }) && t.conta === contaFiltro;
  });

  if (metodoFiltro !== "todos") {
    transactionsPeriod = transactionsPeriod.filter(t => t.metodo === metodoFiltro);
  }

  const agendamentosPeriod = agendamentos.filter(a =>
    isWithinInterval(parseISO(a.dataInicio), { start: startDate, end: endDate })
  );

  const receitas = transactionsPeriod.filter(t => t.tipo === 'receita');
  const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transactionsPeriod.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
  const lucro = totalReceitas - totalDespesas;

  const porPix = receitas.filter(t => t.metodo === 'Pix').reduce((acc, t) => acc + t.valor, 0);
  const porDinheiro = receitas.filter(t => t.metodo === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const porCartao = receitas.filter(t => t.metodo === 'Cartão').reduce((acc, t) => acc + t.valor, 0);

  const concluidos = agendamentosPeriod.filter(a => a.status === 'concluido');
  const cancelados = agendamentosPeriod.filter(a => a.status === 'cancelado');
  const pendentes = agendamentosPeriod.filter(a => a.status === 'agendado' || a.status === 'pendente');

  // ------------ HELPER: Gera o PDF a partir do conteúdo do relatório ------------
  const generatePDF = async () => {
    if (!reportRef.current) throw new Error('Elemento não encontrado');

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Força largura A4 (794px @ 96dpi) para que a tabela não fique cortada em telas estreitas
    const el = reportRef.current;
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    const prevOverflow = el.style.overflow;
    el.style.width = '794px';
    el.style.maxWidth = '794px';
    el.style.overflow = 'visible';

    let canvas;
    try {
      canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });
    } finally {
      // Restaura estilos originais
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      el.style.overflow = prevOverflow;
    }

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const periodoLabel = tipo === 'mensal'
      ? format(startDate, "MMMM-yyyy", { locale: ptBR })
      : `ano-${ano}`;
    const fileName = `relatorio-heinz-${contaFiltro.toLowerCase()}-${periodoLabel}.pdf`;

    return { pdf, fileName };
  };

  // ------------ COMPARTILHAR via WhatsApp (Web Share API) ------------
  const handleSharePDF = async () => {
    setIsSharing(true);
    try {
      const { pdf, fileName } = await generatePDF();

      if (navigator.share && navigator.canShare) {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'Relatório Heinz Studio', files: [file] });
          return;
        }
      }
      // Fallback desktop
      pdf.save(fileName);
      alert('PDF baixado! Anexe manualmente no WhatsApp Web.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        alert('Erro ao gerar PDF. Use o botão Imprimir.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // ------------ SALVAR em pasta escolhida (File System Access API) ------------
  const handleSavePDF = async () => {
    setIsSaving(true);
    try {
      const { pdf, fileName } = await generatePDF();
      const pdfBlob = pdf.output('blob');

      // File System Access API — abre o seletor de pasta nativo
      const showSaveFilePicker = (window as any).showSaveFilePicker;
      if (showSaveFilePicker) {
        try {
          const fileHandle = await showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }

      // Fallback: download direto (iOS Safari, Firefox, etc.)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar PDF. Tente o botão Imprimir / PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const isProcessing = isSharing || isSaving;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto h-screen w-screen selection:bg-black selection:text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-10 flex flex-col min-h-full">
        <style jsx global>{`
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

        {/* Barra de Ações */}
        <div className="flex justify-between items-center mb-10 no-print bg-gray-50 p-4 rounded-2xl border border-gray-200 gap-2 flex-wrap">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-900 font-bold px-4 py-2 rounded-xl transition hover:bg-gray-200 shrink-0"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden lg:inline">
              Relatório {metodoFiltro === 'todos' ? 'Geral' : metodoFiltro.toUpperCase()}
            </span>

            {/* Compartilhar WhatsApp */}
            <button
              onClick={handleSharePDF}
              disabled={isProcessing}
              className="bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-wait text-sm"
            >
              {isSharing
                ? <><Loader2 size={15} className="animate-spin" /> Gerando...</>
                : <><MessageCircle size={15} /> <span className="hidden sm:inline">Compartilhar</span></>
              }
            </button>

            {/* Salvar em pasta */}
            <button
              onClick={handleSavePDF}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-wait text-sm"
            >
              {isSaving
                ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                : <><Save size={15} /> <span className="hidden sm:inline">Salvar PDF</span></>
              }
            </button>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className="bg-black text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition disabled:opacity-50 text-sm"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* CONTEÚDO DO RELATÓRIO (capturado para gerar o PDF) */}
        <div ref={reportRef}>

          {/* CABEÇALHO */}
          <div className="border-b-4 border-black pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Relatório {contaFiltro}</h1>
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

          {/* RESUMO RÁPIDO */}
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

          {/* FINANCEIRO DETALHADO */}
          <div className="mb-14">
            <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
              <Wallet size={20} /> Detalhamento por Meio de Pagamento
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

          {/* AGENDAMENTOS */}
          <div className="mb-14">
            <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
              <BarChart2 size={20} /> Evolução Comercial (Geral)
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

          {/* LISTAGEM DE TRANSAÇÕES */}
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
