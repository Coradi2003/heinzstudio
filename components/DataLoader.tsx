"use client";

import { useEffect } from "react";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useClientesStore } from "@/store/useClientesStore";
import { createClient } from "@/lib/supabase";

export function DataLoader() {
  const carregarAgendamentos = useAgendaStore(state => state.carregarAgendamentos);
  const carregarTransacoes = useFinanceiroStore(state => state.carregarTransacoes);
  const carregarProdutos = useProdutosStore(state => state.carregarProdutos);
  const carregarServicos = useServicosStore(state => state.carregarServicos);
  const carregarConfiguracao = useConfigStore(state => state.carregarConfiguracao);
  const carregarClientes = useClientesStore(state => state.carregarClientes);

  const corHexa = useConfigStore(state => state.corHexa);
  const bgHexa = useConfigStore(state => state.bgHexa);

  // Injetar Variaveis de Cor no DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
       // Extrai o codigo hex do bg-[hex] pra não quebrar muito as regras do tw
       let theColor = '#4F46E5'; 
       if(corHexa.includes('#')) {
          theColor = corHexa.split('#')[1].replace(']', '');
          document.documentElement.style.setProperty('--color-primary', `#${theColor}`);
       } else if (corHexa === 'bg-gray-900') {
          document.documentElement.style.setProperty('--color-primary', '#111827');
       } else if (corHexa === 'bg-red-600') {
          document.documentElement.style.setProperty('--color-primary', '#DC2626');
       }
       
       // Seta Cor de Fundo e Ativa Sub-Temas
       const targetBg = bgHexa || '#F9FAFB';
       document.documentElement.style.setProperty('--color-background', targetBg);
       
       if (targetBg === '#000000' || targetBg === '#111827' || targetBg === '#1F2937') {
           document.documentElement.classList.add('dark-theme');
       } else {
           document.documentElement.classList.remove('dark-theme');
       }
    }
  }, [corHexa, bgHexa]);

  useEffect(() => {
    carregarAgendamentos();
    carregarTransacoes();
    carregarProdutos();
    carregarServicos();
    carregarConfiguracao();
    carregarClientes();

    // Registro do Service Worker (PWA) - Robusto
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('PWA: Service Worker registrado!', reg.scope))
          .catch(err => console.warn('PWA: Erro ao registrar SW:', err));
      };

      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register);
    }

    // Verificação de Sessão Ativa
    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user && !window.location.pathname.startsWith('/login')) {
         window.location.href = '/login';
      }
    };
    checkSession();
  }, []);

  return null;
}
