"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, User, CheckCircle2, MessageCircle, Trash2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendaStore } from "@/store/useAgendaStore";
import { ModalAgendamento } from "@/components/agenda/ModalAgendamento";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Store
  const { agendamentos, concluirAtendimento, removeAgendamento } = useAgendaStore();

  // Lógica do Calendário Mensal
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Exemplos visuais parciais
  const statusColors = {
    cheio: "bg-red-500",
    livre: "bg-green-500",
    parcial: "bg-yellow-500",
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Agenda</h2>
          <p className="text-gray-500">Seus horários e visões do mês</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20"
        >
          <Plus size={20} />
          <span>Novo Agendamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendário Mensal */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Espaços vazios no início do mês para alinhar dias da semana */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-xl border border-dashed border-gray-100 bg-gray-50/50"></div>
            ))}

            {monthDays.map((day) => {
              const dayAgendamentos = agendamentos.filter(a => isSameDay(parseISO(a.dataInicio), day));
              const qty = dayAgendamentos.length;
              
              let randomStatus: 'cheio' | 'livre' | 'parcial' = 'livre';
              if (qty > 3) randomStatus = 'cheio';
              else if (qty > 0) randomStatus = 'parcial';
              
              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDate(day)}
                  className={`h-20 md:h-24 rounded-xl border p-1 md:p-2 flex flex-col justify-between cursor-pointer transition relative group
                    ${isSameDay(selectedDate, day) ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'border-gray-100 hover:border-primary/50 hover:shadow-md bg-white'}
                  `}
                >
                  <span className={`text-xs md:text-sm font-bold ${isToday(day) ? 'text-white bg-primary w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : isSameMonth(day, currentDate) ? 'text-gray-700' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Tarja colorida e contador */}
                  {qty > 0 && (
                    <div className={`mt-auto w-full flex items-center gap-1`}>
                      <div className={`h-1.5 w-full rounded-full ${statusColors[randomStatus]}`}></div>
                      <span className="text-[10px] font-bold text-gray-400">{qty}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 mt-6 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Dia Livre</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Poucos Horários</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dia Cheio</div>
          </div>
        </div>

        {/* Lista do Dia Selecionado */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-140px)] sticky top-8">
          <h3 className="text-xl font-bold mb-1">
            {isToday(selectedDate) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Acompanhe os horários marcados
          </p>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {agendamentos.filter(a => isSameDay(parseISO(a.dataInicio), selectedDate)).length > 0 ? (
              agendamentos
                .filter(a => isSameDay(parseISO(a.dataInicio), selectedDate))
                .sort((a,b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime())
                .map(agendamento => (
                  <div key={agendamento.id} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition group relative overflow-hidden">
                    {/* Status accent border */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${agendamento.status === 'concluido' ? 'bg-green-500' : 'bg-primary'}`}></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <h4 className="font-bold text-gray-800">{agendamento.clienteNome}</h4>
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {format(parseISO(agendamento.dataInicio), "HH:mm")} - {format(parseISO(agendamento.dataFim), "HH:mm")}
                      </span>
                    </div>
                    <div className="pl-2 mb-3">
                      <p className="text-sm font-medium text-gray-600">{agendamento.servico}</p>
                      <p className="text-xs text-gray-400 mt-0.5">R$ {agendamento.valorTotal}</p>
                    </div>
                    
                    <div className="flex gap-2 pl-2 border-t border-gray-50 pt-3">
                      <button className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition">
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      
                      {agendamento.status !== 'concluido' && (
                        <button 
                          onClick={() => concluirAtendimento(agendamento.id)}
                          className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 p-2 rounded-lg transition"
                        >
                          <CheckCircle2 size={14} /> Concluir Sessão
                        </button>
                      )}
                      <button 
                        onClick={() => { if(confirm('Cancelar e Excluir Agendamento?')) removeAgendamento(agendamento.id) }}
                        className="flex justify-center items-center p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                        title="Deletar Agendamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                <div className="text-center text-gray-400">
                  <User size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm px-4">Nenhum agendamento para este dia.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <ModalAgendamento isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
