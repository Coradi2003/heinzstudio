import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  metodo: 'Dinheiro' | 'Cartão' | 'Pix';
  data: string; // ISO String
  conta: 'Particular' | 'Empresa';
}

interface FinanceiroStore {
  transacoes: Transacao[];
  carregarTransacoes: () => Promise<void>;
  addTransacao: (transacao: Omit<Transacao, 'id'>) => Promise<void>;
  updateTransacao: (id: string, data: Partial<Transacao>) => Promise<void>;
  removeTransacao: (id: string) => Promise<void>;
}

export const useFinanceiroStore = create<FinanceiroStore>()((set) => ({
  transacoes: [],
  
  carregarTransacoes: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase.from('transacoes').select('*').eq('user_id', userData.user.id).order('data', { ascending: false });
    if (data) set({ transacoes: data as Transacao[] });
  },

  addTransacao: async (transacaoData) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData, error } = await supabase
      .from('transacoes')
      .insert([{ ...transacaoData, user_id: userData.user.id }])
      .select()
      .single();
    
    if (insertedData) {
      set((state) => ({ transacoes: [insertedData as Transacao, ...state.transacoes] }));
    } else if (error) {
       console.error(error);
    }
  },

  updateTransacao: async (id, dataToUpdate) => {
    const supabase = createClient();
    await supabase.from('transacoes').update(dataToUpdate).eq('id', id);
    set((state) => ({
      transacoes: state.transacoes.map(t => t.id === id ? { ...t, ...dataToUpdate } : t)
    }));
  },

  removeTransacao: async (id) => {
    const supabase = createClient();
    await supabase.from('transacoes').delete().eq('id', id);
    set((state) => ({ transacoes: state.transacoes.filter(t => t.id !== id) }));
  }
}));
