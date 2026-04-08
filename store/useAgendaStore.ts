import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import { useFinanceiroStore } from './useFinanceiroStore';

export interface Agendamento {
  id: string;
  clienteNome: string;
  servico: string;
  dataInicio: string; // ISO String
  dataFim: string; // ISO String
  imagem: string | null;
  valorTotal: number;
  valorSinal: number;
  status: 'agendado' | 'pendente' | 'concluido' | 'cancelado';
  cor?: string;
  telefone?: string;
}

interface AgendaStore {
  agendamentos: Agendamento[];
  carregarAgendamentos: () => Promise<void>;
  addAgendamento: (agendamento: Omit<Agendamento, 'id'>) => Promise<void>;
  updateAgendamento: (id: string, data: Partial<Agendamento>) => Promise<void>;
  removeAgendamento: (id: string) => Promise<void>;
  concluirAtendimento: (id: string) => Promise<void>;
}

export const useAgendaStore = create<AgendaStore>()((set) => ({
  agendamentos: [],
  
  carregarAgendamentos: async () => {
     const supabase = createClient();
     const { data: userData } = await supabase.auth.getUser();
     if (!userData.user) return;

     const { data } = await supabase.from('agendamentos').select('*').eq('user_id', userData.user.id);
     if (data) set({ agendamentos: data as Agendamento[] });
  },

  addAgendamento: async (dataToInsert) => {
     const supabase = createClient();
     const { data: userData } = await supabase.auth.getUser();
     if (!userData.user) return;

     // Se tiver sinal, lança de imediato lá no Financeiro
     if (dataToInsert.valorSinal > 0) {
        await useFinanceiroStore.getState().addTransacao({
          tipo: 'receita',
          categoria: 'Sinal de Tatuagem',
          descricao: `Sinal - ${dataToInsert.clienteNome} (${dataToInsert.servico})`,
          valor: dataToInsert.valorSinal,
          metodo: 'Pix',
          data: new Date().toISOString(),
          conta: 'Empresa'
        });
     }

     const { data: inserted, error } = await supabase.from('agendamentos').insert([{
        ...dataToInsert,
        user_id: userData.user.id
     }]).select().single();

     if (inserted) {
        set((state) => ({ agendamentos: [...state.agendamentos, inserted as Agendamento] }));
     } else if (error) {
        console.error(error);
     }
  },

  updateAgendamento: async (id, dataToUpdate) => {
     const supabase = createClient();
     await supabase.from('agendamentos').update(dataToUpdate).eq('id', id);
     
     set((state) => ({
       agendamentos: state.agendamentos.map(a => a.id === id ? { ...a, ...dataToUpdate } : a)
     }));
  },

  removeAgendamento: async (id) => {
     const supabase = createClient();
     await supabase.from('agendamentos').delete().eq('id', id);
     set((state) => ({ agendamentos: state.agendamentos.filter(a => a.id !== id) }));
  },

  concluirAtendimento: async (id) => {
     const state = useAgendaStore.getState();
     const agendamento = state.agendamentos.find(a => a.id === id);
     if (!agendamento || agendamento.status === 'concluido') return;

     // Lança a receita restante
     const valorRestante = agendamento.valorTotal - agendamento.valorSinal;
     if (valorRestante > 0) {
        await useFinanceiroStore.getState().addTransacao({
          tipo: 'receita',
          categoria: 'Sessão Concluída',
          descricao: `Restante - ${agendamento.clienteNome} (${agendamento.servico})`,
          valor: valorRestante,
          metodo: 'Pix',
          data: new Date().toISOString(),
          conta: 'Empresa'
        });
     }

     // Atualiza no banco
     const supabase = createClient();
     await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
     
     // Atualiza estado local
     set((s) => ({
       agendamentos: s.agendamentos.map(a => a.id === id ? { ...a, status: 'concluido' as const } : a)
     }));
  }
}));
