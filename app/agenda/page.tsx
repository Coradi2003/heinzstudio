"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, User, CheckCircle2, MessageCircle, Trash2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendaStore } from "@/store/useAgendaStore";
import { ModalAgendamento } from "@/components/agenda/ModalAgendamento";
import { ModalDiaSelecionado } from "@/components/agenda/ModalDiaSelecionado";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalDiaOpen, setIsModalDiaOpen] = useState(false);

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

      <div className="max-w-4xl mx-auto">
        {/* Calendário Mensal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
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
                  onClick={() => { setSelectedDate(day); setIsModalDiaOpen(true); }}
                  className={`h-20 md:h-24 rounded-xl border p-1 md:p-2 flex flex-col justify-between cursor-pointer transition relative group
                    ${isSameDay(selectedDate, day) ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'border-gray-100 hover:border-primary/50 hover:shadow-md bg-white'}
                  `}
                >
                  <span className={`text-xs md:text-sm font-bold ${isToday(day) ? 'text-white bg-primary w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : isSameMonth(day, currentDate) ? 'text-gray-700' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicadores de cor dos agendamentos */}
                  {qty > 0 && (
                    <div className="mt-auto w-full flex flex-wrap gap-1 items-center">
                      <div className="flex -space-x-1 overflow-hidden">
                        {dayAgendamentos.slice(0, 3).map(a => (
                          <div key={a.id} className={`h-1.5 w-3 rounded-full border border-white ${a.cor || 'bg-primary'}`} title={a.clienteNome}></div>
                        ))}
                      </div>
                      {qty > 3 && <span className="text-[9px] font-bold text-gray-400">+{qty - 3}</span>}
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

      </div>

      <ModalAgendamento isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ModalDiaSelecionado 
        isOpen={isModalDiaOpen} 
        onClose={() => setIsModalDiaOpen(false)} 
        selectedDate={selectedDate}
        agendamentos={agendamentos}
        concluirAtendimento={concluirAtendimento}
        removeAgendamento={removeAgendamento}
      />
    </div>
  );
}
