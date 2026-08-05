"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useClientesStore } from "@/store/useClientesStore";
import { parseLocalDate } from "@/lib/dashboard/dashboardCalculations";
import { useSearchParams, useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, ArrowLeft, BarChart2, Wallet, QrCode, Banknote, CreditCard, MessageCircle, Loader2, Save, User, Search } from "lucide-react";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";

function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { agendamentos: rawAgendamentos } = useAgendaStore();
  const agendamentos = useMemo(() => rawAgendamentos.filter(a => a.valorTotal > 0), [rawAgendamentos]);
  const { transacoes } = useFinanceiroStore();
  const { clientes, carregarClientes } = useClientesStore();

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Modos de Relatório: 'geral' | 'cliente'
  const [modoRelatorio, setModoRelatorio] = useState<'geral' | 'cliente'>('geral');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('');
  const [searchClienteText, setSearchClienteText] = useState<string>('');

  const tipo = searchParams.get("tipo") || "anual";
  const mesParam = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const anoParam = parseInt(searchParams.get("ano") || String(new Date().getFullYear()));
  const metodoFiltro = searchParams.get("metodo") || "todos";
  const contaFiltro = searchParams.get("conta") || "Empresa";

  const [tipoPeriodo, setTipoPeriodo] = useState<'anual' | 'mensal'>(tipo as any);
  const [mes, setMes] = useState(mesParam);
  const [ano, setAno] = useState(anoParam);
  const [conta, setConta] = useState(contaFiltro);
  const [metodo, setMetodo] = useState(metodoFiltro);

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

  // Lista de clientes filtrada para o campo de busca
  const clientesFiltrados = useMemo(() => {
    if (!searchClienteText.trim()) return clientes;
    const term = searchClienteText.toLowerCase();
    return clientes.filter(c => c.nome.toLowerCase().includes(term) || (c.telefone || '').includes(term));
  }, [clientes, searchClienteText]);

  // Cliente selecionado atualmente
  const clienteObj = useMemo(() => {
    return clientes.find(c => c.id === clienteSelecionadoId) || null;
  }, [clientes, clienteSelecionadoId]);

  // Agendamentos do Cliente Escolhido
  const agendamentosDoCliente = useMemo(() => {
    if (!clienteObj) return [];
    const nome = clienteObj.nome.toLowerCase().trim();
    return agendamentos.filter(a => (a.clienteNome || '').toLowerCase().trim() === nome);
  }, [agendamentos, clienteObj]);

  // Totais do Cliente
  const totalGastoCliente = useMemo(() => {
    return agendamentosDoCliente
      .filter(a => a.status === 'concluido' || a.status === 'agendado' || a.status === 'pendente')
      .reduce((acc, a) => acc + (a.valorTotal || 0), 0);
  }, [agendamentosDoCliente]);

  const totalSinaisCliente = useMemo(() => {
    return agendamentosDoCliente.reduce((acc, a) => acc + (a.valorSinal || 0), 0);
  }, [agendamentosDoCliente]);

  let startDate: Date;
  let endDate: Date;

  if (tipoPeriodo === "mensal") {
    const baseDate = new Date(ano, mes - 1, 1);
    startDate = startOfMonth(baseDate);
    endDate = endOfMonth(baseDate);
  } else {
    const baseDate = new Date(ano, 0, 1);
    startDate = startOfYear(baseDate);
    endDate = endOfYear(baseDate);
  }

  // Filtragem Geral de Transações
  let transactionsPeriod = transacoes.filter(t => {
    const d = parseLocalDate(t.data);
    const matchPeriod = tipoPeriodo === "mensal"
      ? (d.getFullYear() === ano && (d.getMonth() + 1) === mes)
      : d.getFullYear() === ano;
    return matchPeriod && t.conta === conta && t.tipo === 'receita';
  });

  if (metodo !== "todos") {
    transactionsPeriod = transactionsPeriod.filter(t => t.metodo === metodo);
  }

  const totalReceitasGeral = transactionsPeriod.reduce((acc, t) => acc + t.valor, 0);

  const porPixGeral = transactionsPeriod.filter(t => t.metodo === 'Pix').reduce((acc, t) => acc + t.valor, 0);
  const porDinheiroGeral = transactionsPeriod.filter(t => t.metodo === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const porCartaoGeral = transactionsPeriod.filter(t => t.metodo === 'Cartão').reduce((acc, t) => acc + t.valor, 0);

  // Helper para gerar PDF
  const generatePDF = async () => {
    if (!reportRef.current) throw new Error('Elemento não encontrado');

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

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

    const nameSlug = modoRelatorio === 'cliente' && clienteObj
      ? `cliente-${clienteObj.nome.toLowerCase().replace(/\s+/g, '-')}`
      : `geral-${tipoPeriodo}-${ano}`;

    const fileName = `relatorio-heinz-${nameSlug}.pdf`;
    return { pdf, fileName };
  };

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
      pdf.save(fileName);
      alert('PDF baixado! Anexe no WhatsApp.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        alert('Erro ao gerar PDF. Use o botão Imprimir.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleSavePDF = async () => {
    setIsSaving(true);
    try {
      const { pdf, fileName } = await generatePDF();
      const pdfBlob = pdf.output('blob');

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

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar PDF.');
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

        {/* Barra Superior de Navegação e Ações */}
        <div className="flex justify-between items-center mb-6 no-print bg-gray-50 p-4 rounded-2xl border border-gray-200 gap-3 flex-wrap">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-900 font-bold px-4 py-2 rounded-xl transition hover:bg-gray-200 shrink-0 text-sm"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          {/* Seleção do Modo de Relatório */}
          <div className="flex bg-gray-200/80 p-1 rounded-xl">
            <button
              onClick={() => setModoRelatorio('geral')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${modoRelatorio === 'geral' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              <BarChart2 size={14} /> Geral / Anual
            </button>
            <button
              onClick={() => setModoRelatorio('cliente')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${modoRelatorio === 'cliente' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              <User size={14} /> Por Cliente
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSharePDF}
              disabled={isProcessing}
              className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-600 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isSharing ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleSavePDF}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">Salvar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className="bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filtros de Seleção (Tela) */}
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl no-print space-y-4">
          {modoRelatorio === 'cliente' ? (
            /* BUSCA E SELEÇÃO DE CLIENTE */
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">
                Selecione o Cliente Cadastrado para o Relatório:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar cliente por nome..."
                    value={searchClienteText}
                    onChange={(e) => setSearchClienteText(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-black"
                  />
                </div>
                <select
                  value={clienteSelecionadoId}
                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  <option value="">-- Escolha um cliente ({clientesFiltrados.length}) --</option>
                  {clientesFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.telefone ? `(${c.telefone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* FILTROS DO RELATÓRIO GERAL */
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Período</label>
                <select
                  value={tipoPeriodo}
                  onChange={(e) => setTipoPeriodo(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  <option value="anual">Anual Completo</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>

              {tipoPeriodo === 'mensal' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Mês</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                  >
                    {[
                      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ].map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Ano</label>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Forma de Pagamento</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  <option value="todos">Todas (Pix, Cartão, Dinheiro)</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO IMPRESSO E GERADO NO PDF */}
        <div ref={reportRef} className="space-y-10">

          {/* MODO CLIENTE */}
          {modoRelatorio === 'cliente' ? (
            clienteObj ? (
              <>
                {/* CABEÇALHO DO CLIENTE */}
                <div className="border-b-4 border-black pb-6 flex justify-between items-end gap-4">
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">Relatório do Cliente</h1>
                    <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">{clienteObj.nome}</p>
                    {clienteObj.telefone && <p className="text-xs font-bold text-gray-600 mt-1">Telefone: {clienteObj.telefone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest">Heinz Tattoo Studio</p>
                    <p className="text-[10px] font-bold text-gray-700">Emitido: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>

                {/* RESUMO DE VALORES DO CLIENTE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-2 border-black p-4 rounded-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Investido</p>
                    <p className="text-2xl font-black">{totalGastoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="border-2 border-black p-4 rounded-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total de Sinais Pagos</p>
                    <p className="text-2xl font-black">{totalSinaisCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="bg-black p-4 rounded-sm text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Procedimentos / Sessões</p>
                    <p className="text-2xl font-black">{agendamentosDoCliente.length} atendimento(s)</p>
                  </div>
                </div>

                {/* TABELA DE ATENDIMENTOS E SINAIS DO CLIENTE */}
                <div>
                  <h3 className="text-lg font-black uppercase border-b-2 border-black mb-4 pb-1">Histórico Completo de Atendimentos</h3>
                  {agendamentosDoCliente.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black bg-gray-100">
                          <th className="p-3 uppercase font-black border border-black">Data</th>
                          <th className="p-3 uppercase font-black border border-black">Serviço</th>
                          <th className="p-3 uppercase font-black border border-black text-right">Sinal Pago</th>
                          <th className="p-3 uppercase font-black border border-black text-right">Valor Total</th>
                          <th className="p-3 uppercase font-black border border-black text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendamentosDoCliente.map((a) => (
                          <tr key={a.id} className="border-b border-black">
                            <td className="p-3 font-bold border border-black whitespace-nowrap">
                              {format(parseLocalDate(a.dataInicio), "dd/MM/yyyy")}
                            </td>
                            <td className="p-3 font-bold border border-black">{a.servico || 'Sessão de Tatuagem'}</td>
                            <td className="p-3 font-bold border border-black text-right whitespace-nowrap">
                              {a.valorSinal > 0 ? (
                                <span>{a.valorSinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-[9px] uppercase font-black">({a.metodoSinal || 'Pix'})</span></span>
                              ) : (
                                <span className="text-gray-400">R$ 0,00</span>
                              )}
                            </td>
                            <td className="p-3 font-black border border-black text-right whitespace-nowrap">
                              {a.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-3 font-black border border-black text-center text-[10px] uppercase">
                              {a.status === 'concluido' && '✅ Concluído'}
                              {a.status === 'agendado' && '📅 Agendado'}
                              {a.status === 'pendente' && '⏳ Pendente'}
                              {a.status === 'cancelado' && '❌ Cancelado'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-gray-300 text-center font-bold text-gray-500">
                      Nenhum agendamento registrado para este cliente.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 border-2 border-dashed border-black text-center rounded-2xl no-print">
                <User size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-black uppercase">Selecione um cliente acima para gerar o relatório individual</p>
                <p className="text-xs text-gray-500 mt-1">O histórico completo de datas, sinais e valores pagos pelo cliente será exibido aqui.</p>
              </div>
            )
          ) : (
            /* MODO GERAL / ANUAL */
            <>
              {/* CABEÇALHO GERAL */}
              <div className="border-b-4 border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Relatório {conta}</h1>
                  <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    ESTÚDIO / {tipoPeriodo === 'mensal' ? `${format(startDate, 'MMMM yyyy', { locale: ptBR })}` : `ANO ${ano}`}
                    {metodo !== 'todos' && <span className="text-gray-500 ml-2">[{metodo.toUpperCase()}]</span>}
                  </p>
                </div>
                <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-black pl-4 md:pr-4">
                  <p className="text-xs font-black uppercase tracking-widest">Heinz Tattoo Studio</p>
                  <p className="text-[10px] font-bold text-gray-800">Gerado: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>

              {/* RESUMO RÁPIDO GERAL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                  <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total de Entradas</p>
                  <p className="text-2xl font-black truncate">{totalReceitasGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                  <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total via Pix</p>
                  <p className="text-2xl font-black truncate">{porPixGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="bg-black p-5 rounded-sm flex flex-col justify-center min-h-[100px] text-white">
                  <p className="text-[10px] font-black uppercase mb-1 opacity-80 tracking-widest">Cartão / Dinheiro</p>
                  <p className="text-2xl font-black truncate">{(porCartaoGeral + porDinheiroGeral).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              </div>

              {/* DETALHAMENTO POR MEIO DE PAGAMENTO */}
              <div>
                <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
                  <Wallet size={20} /> Detalhamento por Meio de Pagamento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-black py-2">
                      <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><QrCode size={14}/> Pix</span>
                      <span className="font-black text-lg">{porPixGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between border-b border-black py-2">
                      <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><Banknote size={14}/> Dinheiro</span>
                      <span className="font-black text-lg">{porDinheiroGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between border-b border-black py-2">
                      <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><CreditCard size={14}/> Cartão</span>
                      <span className="font-black text-lg">{porCartaoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-5 border-l-4 border-black">
                    <p className="text-[10px] font-black uppercase text-black mb-2 tracking-widest underline">Nota Operacional</p>
                    <p className="text-xs leading-relaxed font-bold">
                      Relatório consolidado {tipoPeriodo === 'anual' ? `do ano de ${ano}` : `do mês de ${format(startDate, 'MMMM yyyy', { locale: ptBR })}`}.
                      Volume total capturado nas entradas: <b>{totalReceitasGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>.
                    </p>
                  </div>
                </div>
              </div>

              {/* MOVIMENTAÇÕES DE ENTRADA */}
              <div className="overflow-x-auto">
                <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-tight">Registro de Entradas</h2>
                <table className="w-full text-left text-xs border-collapse">
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
                        <td className="p-3 font-bold border border-black whitespace-nowrap">{format(new Date(t.data), "dd/MM/yyyy")}</td>
                        <td className="p-3 font-bold border border-black">{t.descricao}</td>
                        <td className="p-3 uppercase text-[10px] font-black border border-black whitespace-nowrap">{t.metodo}</td>
                        <td className="p-3 text-right font-black text-sm border border-black whitespace-nowrap">
                          + {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* RODAPÉ DO DOCUMENTO */}
          <div className="mt-16 pt-8 border-t-2 border-black text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-black">Heinz Tattoo Studio - Documento de Validade Interna</p>
            <p className="text-[9px] text-gray-500 mt-1 italic">Gerado pelo sistema de gestão Heinz Studio.</p>
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
