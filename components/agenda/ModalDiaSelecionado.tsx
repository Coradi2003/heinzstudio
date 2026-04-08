"use client";

import { Modal } from "@/components/ui/Modal";
import { format, isToday, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, CheckCircle2, MessageCircle, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { Agendamento } from "@/store/useAgendaStore";
import { useState } from "react";
import { ModalAgendamento } from "./ModalAgendamento";

interface ModalDiaSelecionadoProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  agendamentos: Agendamento[];
  concluirAtendimento: (id: string, metodo: 'Pix' | 'Dinheiro' | 'Cartão') => void;
  removeAgendamento: (id: string) => void;
}

export function ModalDiaSelecionado({ isOpen, onClose, selectedDate, agendamentos, concluirAtendimento, removeAgendamento }: ModalDiaSelecionadoProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);
  const [concluindoId, setConcluindoId] = useState<string | null>(null);

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
                {agendamento.imagem && (
                  <div className="mt-4 w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden shadow-md border border-gray-100 cursor-pointer hover:opacity-90 transition group relative" onClick={() => window.open(agendamento.imagem!, '_blank')}>
                    <img src={agendamento.imagem} alt="Referência" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ImageIcon className="text-white" size={24} />
                    </div>
                  </div>
                )}
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
                  <div className="w-full flex flex-col gap-2 mt-2">
                    {concluindoId === agendamento.id ? (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qual a forma de pagamento do restante?</p>
                        <div className="flex gap-2">
                          {(['Pix', 'Dinheiro', 'Cartão'] as const).map(metodo => (
                            <button
                              key={metodo}
                              onClick={() => {
                                concluirAtendimento(agendamento.id, metodo);
                                setConcluindoId(null);
                              }}
                              className="flex-1 py-2 px-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-700 hover:border-primary hover:text-primary transition"
                            >
                              {metodo}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setConcluindoId(null)}
                          className="text-[9px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConcluindoId(agendamento.id)}
                        className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 p-2.5 rounded-lg transition"
                      >
                        <CheckCircle2 size={14} /> Concluir Sessão
                      </button>
                    )}
                  </div>
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
