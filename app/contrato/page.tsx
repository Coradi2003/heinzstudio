"use client";

import { useState } from "react";
import { FileText, Send } from "lucide-react";

export default function ContratoPage() {
  const [nome, setNome] = useState("Nome do Cliente");
  const [servico, setServico] = useState("Fechamento de Braço");
  const [valor, setValor] = useState("R$ 2.500,00");
  const [texto, setTexto] = useState(`Olá NOME_CLIENTE, este é o compromisso do nosso estúdio referente à realização do procedimento: SERVICO_TATTOO no valor de VALOR_SERVICO.

Regras do Estúdio:
1. O cliente tem 60 dias para agendar o retoque gratuito. Após esse prazo, será cobrado.
2. Em caso de falta sem aviso prévio de 24h, o valor do SINAL será perdido para cobrir a agenda travada.
3. Se o estúdio necessitar cancelar ou reagendar pela nossa parte, seu sinal poderá ser devolvido integralmente se não quiser um novo horário.

Aguardamos ansiosamente pela sua sessão!
Assinado: Heinz Tattoo Studio`);

  const previewTexto = texto
    .replace("NOME_CLIENTE", nome || "____")
    .replace("SERVICO_TATTOO", servico || "____")
    .replace("VALOR_SERVICO", valor || "____");

  const sendWhatsapp = () => {
    const formatted = encodeURIComponent(previewTexto);
    window.open(`https://wa.me/?text=${formatted}`, '_blank');
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Contrato Simplificado</h2>
        <p className="text-gray-500">Gere um termo com regras claras pra mandar pelo WhatsApp antes ou depois agendar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Editor */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 text-primary font-bold mb-6">
            <FileText size={20} /> Preencher Variáveis
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nome do Cliente</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Qual é o serviço?</label>
              <input type="text" value={servico} onChange={e => setServico(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Valor negociado</label>
              <input type="text" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
            </div>
          </div>

          <label className="text-sm font-semibold text-gray-700 block mb-1">Texto Base (pode editar)</label>
          <textarea 
            value={texto} 
            onChange={e => setTexto(e.target.value)} 
            className="w-full h-40 p-4 rounded-xl border border-gray-200 resize-none font-medium text-sm text-gray-600"
          ></textarea>
        </div>

        {/* Visualização e Ação */}
        <div className="flex flex-col">
          <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200 flex-1 relative flex flex-col">
            <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-4">Preview da Mensagem</h4>
            <div className="bg-white rounded-br-2xl rounded-tr-2xl rounded-bl-2xl p-4 shadow-sm text-gray-700 whitespace-pre-wrap flex-1 overflow-y-auto mb-4 relative">
              {previewTexto}
            </div>
            
            <button 
              onClick={sendWhatsapp}
              className="mt-auto w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-md shadow-green-500/30 hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Enviar pelo WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
