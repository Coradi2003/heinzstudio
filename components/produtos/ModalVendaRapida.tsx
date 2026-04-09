"use client";

import { useState } from "react";
import { Zap, ShoppingCart, QrCode, CreditCard, Banknote } from "lucide-react";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { Modal } from "@/components/ui/Modal";
import { Search, PackagePlus, Check } from "lucide-react";

interface ModalVendaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalVendaRapida({ isOpen, onClose }: ModalVendaRapidaProps) {
  const { produtos, addProduto } = useProdutosStore();
  const addTransacao = useFinanceiroStore(state => state.addTransacao);
  
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorVenda, setValorVenda] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [salvarNoCatalogo, setSalvarNoCatalogo] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const sugestoes = produtos.filter(p => 
    p.nome.toLowerCase().includes(nomeProduto.toLowerCase()) && nomeProduto !== ""
  );

  const isProdutoNovo = !produtos.some(p => p.nome.toLowerCase() === nomeProduto.toLowerCase());

  const handleVendaRapida = async () => {
    if (!nomeProduto || !valorVenda) return;
    
    // 1. Se for novo e pediu para salvar, adiciona ao catálogo
    if (isProdutoNovo && salvarNoCatalogo) {
      await addProduto({
        nome: nomeProduto,
        valor: Number(valorVenda)
      });
    }

    // 2. Lança no financeiro
    await addTransacao({
      tipo: 'receita',
      categoria: 'Venda Rápida',
      descricao: `Venda Rápida - ${nomeProduto}`,
      metodo: metodoPagamento,
      valor: Number(valorVenda),
      data: new Date().toISOString(),
      conta: 'Empresa',
    });

    onClose();
    setNomeProduto("");
    setValorVenda("");
    setMetodoPagamento("Pix");
    setSalvarNoCatalogo(false);
    alert("Venda registrada com sucesso! ⚡");
  };

  const handleSelecionarSugestao = (p: { nome: string, valor: number }) => {
    setNomeProduto(p.nome);
    setValorVenda(p.valor.toString());
    setShowSuggestions(false);
    setSalvarNoCatalogo(false);
  };

  const metodos = [
    { id: 'Pix', icon: QrCode, label: 'Pix' },
    { id: 'Cartão', icon: CreditCard, label: 'Cartão' },
    { id: 'Dinheiro', icon: Banknote, label: 'Dinheiro' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Venda Rápida">
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Registre uma venda de balcão instantaneamente sem sair da página atual.</p>
        
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">O que você está vendendo?</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Digite o nome do produto ou serviço..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-700"
              value={nomeProduto}
              onChange={(e) => {
                setNomeProduto(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>

          {/* Sugestões Dropdown */}
          {showSuggestions && sugestoes.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Produtos no seu catálogo</span>
              </div>
              {sugestoes.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelecionarSugestao(p)}
                  className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition text-left group"
                >
                  <span className="font-bold text-gray-800 group-hover:text-primary transition-colors">{p.nome}</span>
                  <span className="text-sm font-black text-gray-400">R$ {p.valor}</span>
                </button>
              ))}
            </div>
          )}

          {/* Opção de Salvar no Catálogo se for Novo */}
          {isProdutoNovo && nomeProduto.length > 2 && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl animate-in zoom-in-95">
              <button 
                onClick={() => setSalvarNoCatalogo(!salvarNoCatalogo)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${salvarNoCatalogo ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white'}`}
              >
                {salvarNoCatalogo && <Check size={14} strokeWidth={4} />}
              </button>
              <div onClick={() => setSalvarNoCatalogo(!salvarNoCatalogo)} className="cursor-pointer">
                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 leading-none">
                  <PackagePlus size={14} className="text-primary" />
                  Deseja salvar este novo produto no catálogo?
                </p>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter mt-0.5">Assim ele aparecerá nas próximas vendas automaticamente</p>
              </div>
            </div>
          )}
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pagamento</label>
           <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full mb-4">
              {metodos.map((m) => (
                 <button
                    key={m.id}
                    onClick={() => setMetodoPagamento(m.id as any)}
                    className={`flex-1 py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${metodoPagamento === m.id ? 'bg-white shadow-md text-primary ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                 >
                    <m.icon size={16} /> 
                    <span className="hidden sm:inline">{m.label}</span>
                 </button>
              ))}
           </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Recebimento (R$)</label>
          <input 
            type="number" 
            value={valorVenda} 
            onChange={e => setValorVenda(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-black text-green-600 bg-green-50 text-2xl shadow-inner" 
            placeholder="0,00" 
          />
        </div>

        <button 
          onClick={handleVendaRapida}
          disabled={!nomeProduto || !valorVenda}
          className="w-full bg-primary text-white font-black py-5 rounded-[22px] shadow-xl shadow-primary/20 disabled:bg-gray-200 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
        >
          <ShoppingCart size={20} />
          Concluir Venda ⚡
        </button>
      </div>
    </Modal>
  );
}
