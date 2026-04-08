import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

interface ConfigStore {
  corHexa: string;
  bgHexa: string;
  carregarConfiguracao: () => Promise<void>;
  salvarCor: (cor: string) => Promise<void>;
  salvarBg: (bg: string) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>()((set) => ({
  corHexa: 'bg-[#4F46E5]', // Padrão Inicial
  bgHexa: '#F9FAFB', // Background Padrão
  
  carregarConfiguracao: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('configuracoes').select('*').eq('user_id', userData.user.id).single();
    if (data) {
      if (data.cor_hexa) set({ corHexa: data.cor_hexa });
      if (data.fundo_hexa) set({ bgHexa: data.fundo_hexa });
    }
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
      cor_hexa: cor,
      fundo_hexa: useConfigStore.getState().bgHexa
    });
  },

  salvarBg: async (bg) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    set({ bgHexa: bg });

    await supabase.from('configuracoes').upsert({
      user_id: userData.user.id,
      cor_hexa: useConfigStore.getState().corHexa,
      fundo_hexa: bg
    });
  }
}));
