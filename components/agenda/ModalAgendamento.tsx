"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useServicosStore } from "@/store/useServicosStore";

interface ModalAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalAgendamento({ isOpen, onClose }: ModalAgendamentoProps) {
  const addAgendamento = useAgendaStore((state) => state.addAgendamento);
  const { servicos } = useServicosStore();
  
  // States - Tudo opcional
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [valorSinal, setValorSinal] = useState("");
  const [cor, setCor] = useState("bg-primary");

  const handleSave = () => {
    // Monta dados (conversões básicas)
    const dateTimeInicio = dataInicio && horaInicio ? `${dataInicio}T${horaInicio}:00` : new Date().toISOString();
    const dateTimeFim = dataInicio && horaFim ? `${dataInicio}T${horaFim}:00` : dateTimeInicio;

    addAgendamento({
      clienteNome: clienteNome || "Cliente Avulso",
      servico: servico || "Sessão de Tatuagem",
      dataInicio: dateTimeInicio,
      dataFim: dateTimeFim,
      imagem: null,
      valorTotal: Number(valorTotal) || 0,
      valorSinal: Number(valorSinal) || 0,
      status: "agendado",
      cor
    });

    onClose();
    // Limpar o form
    setClienteNome(""); setTelefone(""); setServico("");
    setDataInicio(""); setHoraInicio(""); setHoraFim("");
    setValorTotal(""); setValorSinal("");
    setCor("bg-primary");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Agendamento">
      <div className="space-y-6">
        
        {/* Cliente & Serviço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Cliente</label>
            <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="Buscar ou novo" />
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
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Início</label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Término</label>
            <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Valores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Total (R$)</label>
            <input type="number" value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-medium text-primary" placeholder="0,00" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Sinal (R$)</label>
            <input type="number" value={valorSinal} onChange={e => setValorSinal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 font-medium text-green-600" placeholder="0,00" />
            <p className="text-xs text-gray-400 mt-1">O sinal entra logo como receita.</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Cores */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Classificação de Cor</label>
          <div className="flex gap-4">
            {['bg-primary', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500'].map(c => (
              <button 
                key={c} 
                onClick={() => setCor(c)} 
                className={`w-10 h-10 rounded-full ${c} ${cor === c ? 'ring-4 ring-offset-2 ring-primary/30' : 'opacity-80 hover:opacity-100 hover:scale-110'} transition`} 
                type="button"
                title={c}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Personalize a etiqueta desse serviço pra bater o olho fácil no calendário.</p>
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-primary/20 hover:opacity-90 transition">Agendar</button>
      </div>
    </Modal>
  );
}
