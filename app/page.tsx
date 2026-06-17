"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { Users, FileText, Wrench, Box, TrendingUp, TrendingDown, BarChart2, CheckCircle2, Clock, XCircle, QrCode, Banknote, CreditCard, Calendar, Gift, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export default function DashboardPage() {
  const { agendamentos } = useAgendaStore();
  const { transacoes, despesasFixas } = useFinanceiroStore();
  const { produtos } = useProdutosStore();
  const { servicos } = useServicosStore();
  const { clientes } = useClientesStore();

  const [periodo, setPeriodo] = useState<7 | 14 | 30 | 'custom'>(7);
  const [dataInicioManual, setDataInicioManual] = useState<string>("");
  const [dataFimManual, setDataFimManual] = useState<string>("");
  const [contaVisao, setContaVisao] = useState<'Empresa' | 'Particular'>('Empresa');

  // -- LOGICA DE FILTRO DE DATA --
  const getPeriodoDatas = () => {
    if (periodo === 'custom' && dataInicioManual && dataFimManual) {
      return {
        start: new Date(dataInicioManual + 'T00:00:00'),
        end: new Date(dataFimManual + 'T23:59:59')
      };
    }
    const start = new Date();
    start.setDate(start.getDate() - (periodo as number));
    start.setHours(0,0,0,0);

    // Para gráficos e financeiro, o fim é agora. 
    // Para agendamentos futuros (pendentes), o filtro de cards usará apenas o start.
    return { start, end: new Date() };
  };

  const { start, end } = getPeriodoDatas();

  const hoje = new Date();
  const inicioMesDB = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0);
  const fimMesDB = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  // -- FINANCEIRO DO MÊS (Card de Saldo - sempre o mês inteiro, por conta) --
  const baseTransMes = transacoes.filter(t => {
    const d = new Date(t.data);
    return d >= inicioMesDB && d <= fimMesDB && t.conta === contaVisao;
  });

  const receitasMes = baseTransMes.filter(t => t.tipo === 'receita');
  const faturamento = receitasMes.reduce((a,b) => a + b.valor, 0);
  const despesas = baseTransMes.filter(t => t.tipo === 'despesa').reduce((a,b) => a + b.valor, 0);
  const saldo = faturamento - despesas;

  // -- FINANCEIRO DO PERÍODO (Gráficos / Breakdown por Método - usa filtro de período) --
  const baseTrans = transacoes.filter(t => {
    const d = new Date(t.data);
    const matchData = d >= start && d <= end;
    const matchConta = t.conta === contaVisao;
    return matchData && matchConta;
  });
  
  const receitas = baseTrans.filter(t => t.tipo === 'receita');

  // -- DÉBITOS GERAIS (Sempre pelo mês atual inteiro, visíveis independente do filtro de período) --

  const debitoParticular = transacoes
    .filter(t => t.tipo === 'despesa' && t.conta === 'Particular' && new Date(t.data) >= inicioMesDB && new Date(t.data) <= fimMesDB)
    .reduce((a,b) => a + b.valor, 0);
  
  const debitoEmpresarial = transacoes
    .filter(t => t.tipo === 'despesa' && t.conta === 'Empresa' && new Date(t.data) >= inicioMesDB && new Date(t.data) <= fimMesDB)
    .reduce((a,b) => a + b.valor, 0);

  // -- BREAKDOWN POR MÉTODO DE PAGAMENTO --
  const porPix = receitas.filter(t => t.metodo === 'Pix').reduce((a,b) => a + b.valor, 0);
  const porDinheiro = receitas.filter(t => t.metodo === 'Dinheiro').reduce((a,b) => a + b.valor, 0);
  const porCartao = receitas.filter(t => t.metodo === 'Cartão').reduce((a,b) => a + b.valor, 0);
  const totalMetodos = Math.max(porPix + porDinheiro + porCartao, 1);

  // -- EVOLUÇÃO (Agendamentos - Gráfico usa o período fechado) --
  const agndsPeriodo = agendamentos.filter(a => {
    const d = new Date(a.dataInicio);
    return d >= start && d <= end;
  });

  // -- CARDS DE STATUS --
  // Aprovados: O que foi concluído no período selecionado
  const aprovadosTot = agndsPeriodo.filter(a => a.status === 'concluido').reduce((acc, curr) => acc + curr.valorTotal, 0);
  
  // Pendentes: O que está agendado/pendente a partir do início do período (inclui futuro)
  const agndsFuturos = agendamentos.filter(a => {
    const d = new Date(a.dataInicio);
    return d >= start && (a.status === 'agendado' || a.status === 'pendente');
  });
  const pendentesTot = agndsFuturos.reduce((acc, curr) => acc + (curr.valorTotal - (curr.valorSinal || 0)), 0);
  
  // Rejeitados: Cancelados a partir do início do período (inclui futuro)
  const agndsRejeitados = agendamentos.filter(a => {
    const d = new Date(a.dataInicio);
    return d >= start && a.status === 'cancelado';
  });
  const rejeitadosTot = agndsRejeitados.reduce((acc, curr) => acc + curr.valorTotal, 0);

  const maxVal = Math.max(aprovadosTot, pendentesTot, rejeitadosTot, 1);

  const pendentesCount = agendamentos.filter(a => a.status === 'pendente' || a.status === 'agendado').length;
  const concluidosCount = agendamentos.filter(a => a.status === 'concluido').length;

  // -- ANIVERSARIANTES DO DIA --
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;

  const aniversariantes = clientes.filter(c => {
    if (!c.dataNascimento) return false;
    let dia: number, mes: number;

    if (c.dataNascimento.includes('/')) {
      // Formato DD/MM/AAAA (salvo pelo ModalCliente com máscara)
      const parts = c.dataNascimento.split('/');
      if (parts.length !== 3) return false;
      dia = parseInt(parts[0]);
      mes = parseInt(parts[1]);
    } else if (c.dataNascimento.includes('-')) {
      // Formato YYYY-MM-DD (ISO)
      const parts = c.dataNascimento.split('-');
      if (parts.length !== 3) return false;
      mes = parseInt(parts[1]);
      dia = parseInt(parts[2]);
    } else {
      return false;
    }

    return dia === diaHoje && mes === mesHoje;
  });

  // -- LEMBRETE DE DESPESAS FIXAS PENDENTES --
  const inicioMesAtual = startOfMonth(hoje);
  const fimMesAtual = endOfMonth(hoje);

  const despesasFixasJaLancadas = transacoes
    .filter(t => isWithinInterval(parseISO(t.data), { start: inicioMesAtual, end: fimMesAtual }))
    .map(t => t.descricao.toLowerCase());

  const despesasFixasPendentes = despesasFixas.filter(df => !despesasFixasJaLancadas.includes(df.descricao.toLowerCase()));

  const [metodoRelatorio, setMetodoRelatorio] = useState<'todos' | 'Pix' | 'Dinheiro' | 'Cartão'>('todos');

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-lg mx-auto md:max-w-4xl space-y-4 mb-20 md:mb-0">
      
      {/* 0. Relatórios Quick Actions */}
      <div className="bg-white border border-gray-100 p-4 rounded-[28px] shadow-sm space-y-4 no-print">
         <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filtro do Relatório</span>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
               {[
                 { id: 'todos', label: 'Todos' },
                 { id: 'Pix', icon: QrCode },
                 { id: 'Dinheiro', icon: Banknote },
                 { id: 'Cartão', icon: CreditCard }
               ].map((m) => (
                 <button
                   key={m.id}
                   onClick={() => setMetodoRelatorio(m.id as any)}
                   className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${metodoRelatorio === m.id ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   {m.icon ? <m.icon size={14} /> : <span className="text-[10px] font-bold uppercase px-1">Geral</span>}
                   {m.id !== 'todos' && <span className="text-[10px] font-bold uppercase hidden md:inline">{m.id}</span>}
                 </button>
               ))}
            </div>
         </div>
         
         <div className="flex gap-2">
            <Link 
              href={`/relatorio?tipo=mensal&mes=${new Date().getMonth() + 1}&ano=${new Date().getFullYear()}&metodo=${metodoRelatorio}&conta=${contaVisao}`}
              className="flex-1 bg-gray-900 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg active:scale-95"
            >
              <FileText size={14} /> Relatório Mensal
            </Link>
            <Link 
              href={`/relatorio?tipo=anual&ano=${new Date().getFullYear()}&metodo=${metodoRelatorio}&conta=${contaVisao}`}
              className="flex-1 bg-white border-2 border-gray-900 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition active:scale-95"
            >
              <FileText size={14} /> Relatório Anual
            </Link>
          </div>
        </div>

        {/* 0.5 Seletor de Conta */}
        <div className="flex bg-gray-100 p-1 rounded-2xl w-full no-print">
          <button 
            onClick={() => setContaVisao('Empresa')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition ${contaVisao === 'Empresa' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Empresa
          </button>
          <button 
            onClick={() => setContaVisao('Particular')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition ${contaVisao === 'Particular' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Particular
          </button>
        </div>
      
      {/* 1. Header Card (Saldo) */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-[28px] shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <p className="text-sm font-medium opacity-80 mb-1 z-10 relative">Saldo do Mês ({contaVisao})</p>
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

      {/* 1.1 Resumo de Débitos e Pendentes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendentes</p>
          <p className="text-[10px] md:text-sm font-black text-yellow-600 truncate w-full">{pendentesTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Déb. Part.</p>
          <p className="text-[10px] md:text-sm font-black text-red-500 truncate w-full">{debitoParticular.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Déb. Empr.</p>
          <p className="text-[10px] md:text-sm font-black text-red-500 truncate w-full">{debitoEmpresarial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
        </div>
      </div>

      {/* 1.2 Alerta de Aniversário */}
      {aniversariantes.length > 0 && (
        <Link href="/clientes" className="block">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-[24px] shadow-md text-white flex items-center gap-4 animate-pulse-subtle hover:scale-[1.02] transition pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Gift size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Aniversariante(s) do Dia!</p>
              <h3 className="font-bold truncate">
                {aniversariantes.map(c => c.nome).join(", ")}
              </h3>
              <p className="text-[10px] opacity-80 mt-0.5 whitespace-nowrap">Clique para ver no cadastro!</p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              Ver lista
            </div>
          </div>
        </Link>
      )}

      {/* 1.3 Alerta de Despesas Fixas Pendentes */}
      {despesasFixasPendentes.length > 0 && (
        <Link href="/financeiro" className="block">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-[24px] shadow-md text-white flex items-center gap-4 hover:scale-[1.02] transition pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">{despesasFixasPendentes.length} conta(s) pendente(s)!</p>
              <h3 className="font-bold truncate">
                Contas do Mês
              </h3>
              <p className="text-[10px] opacity-80 mt-0.5 whitespace-nowrap uppercase font-black">O mês virou! Clique aqui para lançar as despesas.</p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              Lançar Agora
            </div>
          </div>
        </Link>
      )}

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
                <span className="text-xs font-bold text-gray-700">Pix</span>
                <span className="text-xs font-extrabold text-gray-900">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                <span className="text-xs font-bold text-gray-700">Dinheiro</span>
                <span className="text-xs font-extrabold text-gray-900">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                <span className="text-xs font-bold text-gray-700">Cartão</span>
                <span className="text-xs font-extrabold text-gray-900">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
        <div className="flex flex-wrap gap-2 mb-6">
          {[7, 14, 30].map(dia => (
            <button 
              key={dia}
              onClick={() => {
                setPeriodo(dia as any);
                setDataInicioManual("");
                setDataFimManual("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex-shrink-0 ${periodo === dia ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {dia} dias
            </button>
          ))}
          <button 
            onClick={() => setPeriodo('custom')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex-shrink-0 flex items-center gap-2 ${periodo === 'custom' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <Calendar size={14} />
            Personalizado
          </button>
        </div>

        {periodo === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 ml-1">Início</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={dataInicioManual} 
                  onChange={e => setDataInicioManual(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border border-gray-700/50 bg-gray-800/40 text-sm font-bold text-gray-200 outline-none focus:border-primary transition-all shadow-inner appearance-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 ml-1">Fim</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={dataFimManual} 
                  onChange={e => setDataFimManual(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border border-gray-700/50 bg-gray-800/40 text-sm font-bold text-gray-200 outline-none focus:border-primary transition-all shadow-inner appearance-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3 Status Cards (Estilo Dark Colors na imagem mas usamos tailwind padrao q fica dark automatico no darkmode) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-2">
               <CheckCircle2 size={12} className="text-green-600" />
            </div>
            <p className="text-[9px] font-bold text-green-700 uppercase mb-1 whitespace-nowrap">Aprovados</p>
            <p className="text-sm font-black text-green-900">{aprovadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fefce8] border border-[#fef08a] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-2">
               <Clock size={12} className="text-yellow-600" />
            </div>
            <p className="text-[9px] font-bold text-yellow-700 uppercase mb-1 whitespace-nowrap">Pendentes</p>
            <p className="text-sm font-black text-yellow-900">{pendentesTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-2">
               <XCircle size={12} className="text-red-500" />
            </div>
            <p className="text-[9px] font-bold text-red-700 uppercase mb-1 whitespace-nowrap">Rejeitados</p>
            <p className="text-sm font-black text-red-900">{rejeitadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-2">
        
        <Link href="/clientes" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
            <Users size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{clientes.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Clientes</p>
        </Link>

        <Link href="/agenda" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Clock size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{pendentesCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Pendentes</p>
        </Link>

        <Link href="/agenda" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <CheckCircle2 size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{concluidosCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Concluídos</p>
        </Link>

        <Link href="/servicos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
            <Wrench size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{servicos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Serviços</p>
        </Link>

        <Link href="/produtos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
            <Box size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{produtos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Produtos</p>
        </Link>

      </div>
    </div>
  );
}
