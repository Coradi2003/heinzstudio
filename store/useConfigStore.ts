import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

interface ConfigStore {
  corHexa: string;
  carregarConfiguracao: () => Promise<void>;
  salvarCor: (cor: string) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>()((set) => ({
  corHexa: 'bg-[#4F46E5]', // Padrão Inicial
  
  carregarConfiguracao: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('configuracoes').select('*').eq('user_id', userData.user.id).single();
    if (data) set({ corHexa: data.cor_hexa });
  },

  salvarCor: async (cor) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Atualiza otimista
    set({ corHexa: cor });

    // Tenta gravar/atualizar no Supabase via upsert
    await supabase.from('configuracoes').upsert({
      user_id: userData.user.id,
      cor_hexa: cor
    });
  }
}));
