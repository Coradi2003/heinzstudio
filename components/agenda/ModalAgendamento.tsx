"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAgendaStore, Agendamento } from "@/store/useAgendaStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { UserPlus, Check } from "lucide-react";
import { ModalCliente } from "@/components/clientes/ModalCliente";

interface ModalAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Agendamento | null;
}

export function ModalAgendamento({ isOpen, onClose, initialData }: ModalAgendamentoProps) {
  const { addAgendamento, updateAgendamento } = useAgendaStore();
  const { servicos } = useServicosStore();
  const { clientes, addCliente } = useClientesStore();
  
  // States - Tudo opcional
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [duracao, setDuracao] = useState("01:00");
  const [valorTotal, setValorTotal] = useState("");
  const [valorSinal, setValorSinal] = useState("");
  const [metodoSinal, setMetodoSinal] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [cor, setCor] = useState("bg-primary");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showClientes, setShowClientes] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      setClienteNome(initialData.clienteNome);
      setTelefone(initialData.telefone || "");
      setServico(initialData.servico);
      setValorTotal(initialData.valorTotal.toString());
      setValorSinal(initialData.valorSinal.toString());
      setCor(initialData.cor || "bg-primary");
      
      const [data, hora] = initialData.dataInicio.split('T');
      setDataInicio(data);
      if (hora) setHoraInicio(hora.substring(0, 5));

      // Calcula duração do initialData
      const start = new Date(initialData.dataInicio);
      const end = new Date(initialData.dataFim);
      const diffMs = end.getTime() - start.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setDuracao(`${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`);
      
    } else if (isOpen) {
      setClienteNome(""); setTelefone(""); setServico("");
      setDataInicio(""); setHoraInicio(""); setDuracao("01:00");
      setValorTotal(""); setValorSinal("");
      setCor("bg-primary");
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    // Monta dados (conversões básicas)
    const dateTimeInicio = dataInicio && horaInicio ? `${dataInicio}T${horaInicio}:00` : new Date().toISOString();
    
    // Calcula fim baseado na duração
    let dateTimeFim = dateTimeInicio;
    if (dataInicio && horaInicio && duracao) {
       const [dHours, dMins] = duracao.split(':').map(Number);
       const dateF = new Date(dateTimeInicio);
       dateF.setHours(dateF.getHours() + dHours);
       dateF.setMinutes(dateF.getMinutes() + dMins);
       dateTimeFim = dateF.toISOString();
    }
    
    const nomeFinal = clienteNome || "Cliente Avulso";
    const telefoneFinal = telefone || "";

    // Cadastro Inteligente de Clientes
    if (clienteNome && clienteNome.trim() !== "") {
       const clientExists = clientes.find(c => c.nome.toLowerCase() === clienteNome.trim().toLowerCase());
       if (!clientExists) {
          addCliente({
            nome: clienteNome.trim(),
            telefone: telefoneFinal,
            notas: "Cadastrado automaticamente via agendamento.",
            ultimaVisita: new Date().toISOString()
          });
       }
    }

    if (initialData) {
      await updateAgendamento(initialData.id, {
        clienteNome: nomeFinal,
        telefone: telefoneFinal,
        servico: servico || "Sessão de Tatuagem",
        dataInicio: dateTimeInicio,
        dataFim: dateTimeFim,
        valorTotal: Number(valorTotal) || 0,
        valorSinal: Number(valorSinal) || 0,
        cor
      });
    } else {
      await addAgendamento({
        clienteNome: nomeFinal,
        telefone: telefoneFinal,
        servico: servico || "Sessão de Tatuagem",
        dataInicio: dateTimeInicio,
        dataFim: dateTimeFim,
        imagem: null,
        valorTotal: Number(valorTotal) || 0,
        valorSinal: Number(valorSinal) || 0,
        status: "agendado",
        metodoSinal,
        cor
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Agendamento" : "Novo Agendamento"}>
      <div className="space-y-6">
        
        {/* Cliente & Serviço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Cliente</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={clienteNome} 
                onChange={e => {
                   setClienteNome(e.target.value);
                   setShowClientes(e.target.value.length > 0);
                }} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" 
                placeholder="Buscar ou novo" 
              />
              <button 
                type="button" 
                onClick={() => setIsClientModalOpen(true)}
                className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition shrink-0"
                title="Novo Cliente"
              >
                <UserPlus size={20} />
              </button>
            </div>

            {/* Sugestões de Clientes */}
            {showClientes && (
               <div className="absolute z-[60] left-0 right-14 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {clientes
                    .filter(c => c.nome.toLowerCase().includes(clienteNome.toLowerCase()))
                    .map(c => (
                       <button
                         key={c.id}
                         onClick={() => {
                            setClienteNome(c.nome);
                            setTelefone(c.telefone);
                            setShowClientes(false);
                         }}
                         className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                       >
                          <span className="font-bold text-gray-800">{c.nome}</span>
                          <span className="text-xs text-gray-400">{c.telefone}</span>
                       </button>
                    ))
                  }
                  {clientes.filter(c => c.nome.toLowerCase().includes(clienteNome.toLowerCase())).length === 0 && (
                     <div className="px-4 py-3 text-xs text-gray-400 italic">Nenhum cliente encontrado.</div>
                  )}
               </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Whatsapp</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="(00) 00000-0000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Serviço</label>
            <select 
              value={servico} 
              onChange={e => {
                setServico(e.target.value);
                // Auto-preencher valor se for um serviço oficial
                const offSrv = servicos.find(s => s.nome === e.target.value);
                if (offSrv) setValorTotal(offSrv.valorBase.toString());
              }} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none"
            >
              <option value="" disabled>Selecione um serviço da sua base...</option>
              {servicos.map(s => (
                <option key={s.id} value={s.nome}>{s.nome} (R$ {s.valorBase})</option>
              ))}
              <option value="Outro (Avulso)">Outro serviço não listado...</option>
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Data e Hora */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Início</label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Duração</label>
            <select 
              value={duracao} 
              onChange={e => setDuracao(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0"
            >
              <option value="00:30">30 min</option>
              <option value="01:00">1 hora</option>
              <option value="01:30">1h 30min</option>
              <option value="02:00">2 horas</option>
              <option value="02:30">2h 30min</option>
              <option value="03:00">3 horas</option>
              <option value="04:00">4 horas</option>
              <option value="05:00">5 horas</option>
              <option value="06:00">6 horas</option>
              <option value="07:00">7 horas</option>
              <option value="08:00">8 horas</option>
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Valores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Total (R$)</label>
            <input type="number" value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-medium text-primary" placeholder="0,00" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Sinal (R$)</label>
              <input type="number" value={valorSinal} onChange={e => setValorSinal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 font-medium text-green-600" placeholder="0,00" />
            </div>
            
            {Number(valorSinal) > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento do Sinal</label>
                <div className="flex gap-2">
                  {['Pix', 'Dinheiro', 'Cartão'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoSinal(m as any)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition ${metodoSinal === m ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">O sinal entra logo como receita.</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Cores */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Classificação de Cor</label>
          <div className="flex flex-wrap gap-3">
            {['bg-primary', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500'].map(c => (
              <button 
                key={c} 
                onClick={() => setCor(c)} 
                className={`w-10 h-10 rounded-full ${c} ${cor === c ? 'ring-4 ring-offset-2 ring-primary/30 border-2 border-white' : 'opacity-80 hover:opacity-100 hover:scale-110'} transition flex items-center justify-center text-white`} 
                type="button"
                title={c}
              >
                {cor === c && <Check size={20} strokeWidth={3} />}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Personalize a etiqueta desse serviço pra bater o olho fácil no calendário.</p>
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-primary/20 hover:opacity-90 transition">Agendar</button>
      </div>
      <ModalCliente isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
    </Modal>
  );
}
