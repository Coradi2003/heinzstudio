import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  notas: string;
  ultimaVisita: string;
}

interface ClientesStore {
  clientes: Cliente[];
  carregarClientes: () => Promise<void>;
  addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<void>;
  updateCliente: (id: string, data: Partial<Cliente>) => Promise<void>;
  removeCliente: (id: string) => Promise<void>;
}

export const useClientesStore = create<ClientesStore>()((set) => ({
  clientes: [],
  
  carregarClientes: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('clientes').select('*').eq('user_id', userData.user.id);
    if (data) set({ clientes: data as Cliente[] });
  },

  addCliente: async (data) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData } = await supabase
      .from('clientes')
      .insert([{ ...data, user_id: userData.user.id }])
      .select()
      .single();

    if (insertedData) {
      set((state) => ({ clientes: [...state.clientes, insertedData as Cliente] }));
    }
  },

  updateCliente: async (id, dataToUpdate) => {
    const supabase = createClient();
    await supabase.from('clientes').update(dataToUpdate).eq('id', id);
    set((state) => ({
      clientes: state.clientes.map(c => c.id === id ? { ...c, ...dataToUpdate } : c)
    }));
  },

  removeCliente: async (id) => {
    const supabase = createClient();
    await supabase.from('clientes').delete().eq('id', id);
    set((state) => ({ clientes: state.clientes.filter(c => c.id !== id) }));
  }
}));
