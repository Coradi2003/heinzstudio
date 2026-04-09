"use client";

import { useState } from "react";
import { Zap, ShoppingCart, QrCode, CreditCard, Banknote } from "lucide-react";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { Modal } from "@/components/ui/Modal";

interface ModalVendaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalVendaRapida({ isOpen, onClose }: ModalVendaRapidaProps) {
  const { produtos } = useProdutosStore();
  const addTransacao = useFinanceiroStore(state => state.addTransacao);
  
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [valorVenda, setValorVenda] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');

  const handleVendaRapida = async () => {
    if (!produtoSelecionado || !valorVenda) return;
    
    const prodNome = produtos.find(p => p.id === produtoSelecionado)?.nome || "Produto";

    await addTransacao({
      tipo: 'receita',
      categoria: 'Venda Rápida',
      descricao: `Venda Rápida - ${prodNome}`,
      metodo: metodoPagamento,
      valor: Number(valorVenda),
      data: new Date().toISOString(),
      conta: 'Empresa',
    });

    onClose();
    setProdutoSelecionado("");
    setValorVenda("");
    setMetodoPagamento("Pix");
    alert("Venda rápida registrada com sucesso no Financeiro! ⚡");
  };

  const handleSelecionarProduto = (id: string, valor: number) => {
    setProdutoSelecionado(id);
    setValorVenda(valor.toString());
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
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Selecione o Produto</label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 text-gray-800">
            {produtos.length === 0 ? (
              <p className="text-center py-4 text-gray-400 italic text-sm">Nenhum produto cadastrado no catálogo.</p>
            ) : (
              produtos.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelecionarProduto(p.id, p.valor)}
                  className={`p-4 rounded-xl border-2 flex justify-between cursor-pointer transition ${produtoSelecionado === p.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <h5 className="font-bold text-gray-800 text-sm">{p.nome}</h5>
                  <span className="text-gray-500 font-medium text-sm">R$ {p.valor}</span>
                </div>
              ))
            )}
          </div>
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-black text-green-600 bg-green-50 text-xl" 
            placeholder="0,00" 
          />
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Você pode editar se deu algum desconto no ato.</p>
        </div>

        <button 
          onClick={handleVendaRapida}
          disabled={!produtoSelecionado || !valorVenda}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg disabled:bg-gray-200 disabled:shadow-none hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Concluir Venda ⚡
        </button>
      </div>
    </Modal>
  );
}
