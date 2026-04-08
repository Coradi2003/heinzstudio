"use client";

import { createClient } from "@/lib/supabase";
import { LogOut, Palette, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useConfigStore } from "@/store/useConfigStore";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const salvarCor = useConfigStore(state => state.salvarCor);
  const salvarBg = useConfigStore(state => state.salvarBg);
  const corSalva = useConfigStore(state => state.corHexa);
  const bgSalvo = useConfigStore(state => state.bgHexa);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const cores = [
    { nome: "Índigo & Roxo", bg: "bg-[#4F46E5]" },
    { nome: "Preto Dark", bg: "bg-gray-900" },
    { nome: "Vermelho Sangue", bg: "bg-red-600" },
    { nome: "Verde Neon", bg: "bg-[#00FF00]" },
  ];
  
  const [corAtiva, setCorAtiva] = useState(cores[0].bg);
  
  const fundos = [
    { nome: "Soft White", bg: "#F9FAFB" },
    { nome: "Cinza Escuro", bg: "#1F2937" },
    { nome: "Preto Dark", bg: "#111827" },
    { nome: "Deep Black", bg: "#000000" },
  ];
  const [fundoAtivo, setFundoAtivo] = useState(fundos[0].bg);

  useEffect(() => {
    if (corSalva) setCorAtiva(corSalva);
    if (bgSalvo) setFundoAtivo(bgSalvo);
  }, [corSalva, bgSalvo]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveColor = async () => {
    setLoadingConfig(true);
    try {
      await salvarCor(corAtiva);
      await salvarBg(fundoAtivo);
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
        <p className="text-gray-500">Ajustes gerais do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Bloco de Cores */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg">
            <Palette size={20} className="text-primary" /> Cor Principal
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {cores.map(c => (
              <div 
                key={c.bg}
                onClick={() => setCorAtiva(c.bg)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${corAtiva === c.bg ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${c.bg}`}></div>
                  <span className="text-sm font-semibold text-gray-700">{c.nome}</span>
                </div>
                {corAtiva === c.bg && <CheckCircle2 size={16} className="text-primary" />}
              </div>
            ))}
          </div>

          <button onClick={handleSaveColor} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl transition hover:opacity-90">
             {loadingConfig ? "Salvando..." : "Salvar Preferências"}
          </button>
        </div>

        {/* Bloco de Fundos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg">
            <Palette size={20} className="text-gray-500" /> Cor do Fundo Mestre
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {fundos.map(f => (
              <div 
                key={f.bg}
                onClick={() => setFundoAtivo(f.bg)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${fundoAtivo === f.bg ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: f.bg }}></div>
                  <span className="text-sm font-semibold text-gray-700">{f.nome}</span>
                </div>
                {fundoAtivo === f.bg && <CheckCircle2 size={16} className="text-primary" />}
              </div>
            ))}
          </div>
        </div>

        {/* Zona de Perigo / Conta */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="mb-4">
               <h3 className="text-lg font-bold text-gray-800">Conta do Estúdio</h3>
               <p className="text-sm text-gray-500">Se precisar fechar o sistema após o expediente.</p>
             </div>
             
             {/* Botão Sair - Less Accessible (menos chamativo e com ícone perigoso) */}
             <div className="pt-4 border-t border-gray-50">
               <button 
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl transition hover:bg-red-100 flex items-center justify-center gap-2"
               >
                 <LogOut size={18} />
                 Encerrar Sessão
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
