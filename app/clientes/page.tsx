"use client";

import { useState } from "react";
import { useClientesStore, Cliente } from "@/store/useClientesStore";
import { MessageCircle, Gift, CalendarClock, User, Plus, Pencil, Trash2, Search } from "lucide-react";
import { ModalCliente } from "@/components/clientes/ModalCliente";

export default function ClientesPage() {
  const { clientes, removeCliente } = useClientesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEdit, setClienteEdit] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState("");

  const clientesFiltrados = clientes.filter(c => 
     c.nome.toLowerCase().includes(busca.toLowerCase()) || 
     c.telefone?.includes(busca)
  );

  const handleWhatsApp = (numero: string | undefined, textoInicial: string) => {
    const msg = encodeURIComponent(textoInicial);
    // Remove tudo que não é número do telefone
    const numLimpo = numero?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${numLimpo}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Base de Clientes</h2>
          <p className="text-gray-500">Seu CRM particular de clientes e anotações.</p>
        </div>
        <button onClick={() => { setClienteEdit(null); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20">
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        
        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Pesquisar por nome ou telefone..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {clientesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientesFiltrados.map(c => (
              <div key={c.id} className="border border-gray-100 rounded-2xl p-5 hover:border-primary/30 transition group flex flex-col justify-between h-full bg-gray-50/50 relative">
                
                {/* Lápis e Lixeira flutuantes (Controle Total) */}
                <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button onClick={() => { setClienteEdit(c); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={18} /></button>
                  <button onClick={() => { if(confirm('Você tem certeza absoluta que deseja excluir este cliente da base?')) removeCliente(c.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg pr-12">{c.nome}</h4>
                    {c.telefone && <p className="text-sm text-primary font-medium">{c.telefone}</p>}
                    {c.notas && <p className="text-sm text-gray-500 mt-1 italic line-clamp-2">"{c.notas}"</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-auto pt-4 border-t border-gray-100">
                  <button onClick={() => handleWhatsApp(c.telefone, 'Oi! Passando só pra confirmar sua sessão amanhã!')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition gap-1 text-xs font-bold text-center">
                    <CalendarClock size={16} /> 1 Dia
                  </button>
                  <button onClick={() => handleWhatsApp(c.telefone, 'E aí, tudo pronto? Sua sessão é daqui a 1 hora!')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition gap-1 text-xs font-bold text-center">
                    <CalendarClock size={16} /> 1 Hora
                  </button>
                  <button onClick={() => handleWhatsApp(c.telefone, 'Parabéns pelo seu aniversário! Que tal fazer uma tattoo nova com desconto especial?')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition gap-1 text-xs font-bold text-center">
                    <Gift size={16} /> B-Day
                  </button>
                  <button onClick={() => handleWhatsApp(c.telefone, 'Olá!')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition gap-1 text-xs font-bold text-center">
                    <MessageCircle size={16} /> Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12">
            <User size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Você ainda não castrou clientes manualmente.</p>
          </div>
        )}
      </div>

      <ModalCliente isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={clienteEdit} />
    </div>
  );
}
