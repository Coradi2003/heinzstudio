"use client";

import { Modal } from "@/components/ui/Modal";
import { format, isToday, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, CheckCircle2, MessageCircle, Trash2, Pencil } from "lucide-react";
import { Agendamento } from "@/store/useAgendaStore";
import { useState } from "react";
import { ModalAgendamento } from "./ModalAgendamento";

interface ModalDiaSelecionadoProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  agendamentos: Agendamento[];
  concluirAtendimento: (id: string) => void;
  removeAgendamento: (id: string) => void;
}

export function ModalDiaSelecionado({ isOpen, onClose, selectedDate, agendamentos, concluirAtendimento, removeAgendamento }: ModalDiaSelecionadoProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);

  const agendamentosDia = agendamentos
    .filter(a => isSameDay(parseISO(a.dataInicio), selectedDate))
    .sort((a,b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isToday(selectedDate) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}>
      <div className="flex-1 space-y-4 max-h-[65vh] overflow-y-auto pr-2 pb-4">
        {agendamentosDia.length > 0 ? (
          agendamentosDia.map(agendamento => (
            <div key={agendamento.id} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition group relative overflow-hidden">
              {/* Status accent border with Custom Color logic */}
              <div className={`absolute top-0 left-0 w-2 h-full ${agendamento.status === 'concluido' ? 'bg-gray-300' : agendamento.cor || 'bg-primary'}`}></div>
              
              <div className="flex justify-between items-start mb-2 pl-3">
                <h4 className="font-bold text-gray-800">{agendamento.clienteNome}</h4>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  {format(parseISO(agendamento.dataInicio), "HH:mm")} - {format(parseISO(agendamento.dataFim), "HH:mm")}
                </span>
              </div>
              <div className="pl-3 mb-3">
                <p className="text-sm font-medium text-gray-600">{agendamento.servico}</p>
                <p className="text-xs text-gray-400 mt-0.5">R$ {agendamento.valorTotal}</p>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap gap-2 pl-3 border-t border-gray-50 pt-3 mt-3">
                <button 
                  onClick={() => {
                    const numberOnly = (agendamento.telefone || '').replace(/\D/g, '');
                    if (numberOnly) {
                      window.open(`https://wa.me/55${numberOnly}`, '_blank');
                    } else {
                      alert('Este cliente não possui telefone cadastrado.');
                    }
                  }}
                  className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 p-2.5 rounded-lg transition"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                
                {agendamento.status !== 'concluido' && (
                  <button 
                    onClick={() => concluirAtendimento(agendamento.id)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 p-2.5 rounded-lg transition"
                  >
                    <CheckCircle2 size={14} /> Concluir Sessão
                  </button>
                )}
                <button 
                  onClick={() => {
                    setAgendamentoParaEditar(agendamento);
                    setIsEditModalOpen(true);
                  }}
                  className="flex justify-center items-center p-2.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition"
                  title="Editar Agendamento"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => { if(confirm('Cancelar e Excluir Agendamento?')) removeAgendamento(agendamento.id) }}
                  className="flex justify-center items-center p-2.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                  title="Deletar Agendamento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
            <div className="text-center text-gray-400">
              <User size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm px-4">Nenhum agendamento para este dia.</p>
            </div>
          </div>
        )}
      </div>

      <ModalAgendamento 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialData={agendamentoParaEditar}
      />
    </Modal>
  );
}
