"use client";

import { useState } from "react";
import { Package, Plus, Zap, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { useProdutosStore, Produto } from "@/store/useProdutosStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { Modal } from "@/components/ui/Modal";
import { ModalProduto } from "@/components/produtos/ModalProduto";

export default function ProdutosPage() {
  const { produtos, addProduto, removeProduto } = useProdutosStore();
  const addTransacao = useFinanceiroStore(state => state.addTransacao);
  
  const [isVendaRapidaOpen, setIsVendaRapidaOpen] = useState(false);
  const [isModalProdutoOpen, setIsModalProdutoOpen] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("");
  const [valorVenda, setValorVenda] = useState("");

  const handleVendaRapida = () => {
    if (!produtoSelecionado || !valorVenda) return;
    
    const prodNome = produtos.find(p => p.id === produtoSelecionado)?.nome || "Produto";

    addTransacao({
      tipo: 'receita',
      categoria: 'Venda Rápida',
      descricao: `Venda Rápida - ${prodNome}`,
      metodo: 'Pix',
      valor: Number(valorVenda),
      data: new Date().toISOString(),
      conta: 'Empresa',
    });

    setIsVendaRapidaOpen(false);
    setProdutoSelecionado("");
    setValorVenda("");
    alert("Venda registrada e adicionada ao Financeiro com sucesso!");
  };

  const handleSelecionarProduto = (id: string, valor: number) => {
    setProdutoSelecionado(id);
    setValorVenda(valor.toString());
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Produtos</h2>
          <p className="text-gray-500">Gestão de catálogo e venda rápida</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setProdutoEdit(null); setIsModalProdutoOpen(true); }} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
            <Plus size={20} />
            <span>Adicionar</span>
          </button>
          <button 
            onClick={() => setIsVendaRapidaOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20"
          >
            <Zap size={20} className="text-yellow-400" fill="currentColor" />
            <span>Venda Rápida</span>
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
           <Package size={20} className="text-primary" />
           <h3 className="text-lg font-bold text-gray-800">Seu Catálogo</h3>
        </div>
        
        <div className="grid grid-cols-1 mb-0">
          <div className="divide-y divide-gray-50">
            {produtos.map(p => (
              <div key={p.id} className="flex justify-between items-center p-6 hover:bg-gray-50 transition group">
                <div>
                  <h4 className="font-bold text-gray-800">{p.nome}</h4>
                  <p className="text-sm text-gray-400">Estoque ilimitado</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-4 md:mt-0">
                  <div className="font-bold text-primary text-xl">
                    R$ {p.valor}
                  </div>
                  <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition">
                    <button onClick={() => { setProdutoEdit(p); setIsModalProdutoOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={18} /></button>
                    <button onClick={() => { if(confirm('Excluir produto?')) removeProduto(p.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Venda Rápida */}
      <Modal isOpen={isVendaRapidaOpen} onClose={() => setIsVendaRapidaOpen(false)} title="⚡ Venda Rápida">
        <div className="space-y-6">
          <p className="text-sm text-gray-500">Sem necessidade de vincular cliente. O valor entra automaticamente no financeiro.</p>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Qual produto está vendendo?</label>
            <div className="grid grid-cols-1 gap-2">
              {produtos.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelecionarProduto(p.id, p.valor)}
                  className={`p-4 rounded-xl border-2 flex justify-between cursor-pointer transition ${produtoSelecionado === p.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <h5 className="font-bold text-gray-800">{p.nome}</h5>
                  <span className="text-gray-500 font-medium">R$ {p.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Final da Venda (R$)</label>
            <input 
              type="number" 
              value={valorVenda} 
              onChange={e => setValorVenda(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-medium text-green-600 bg-green-50" 
              placeholder="0,00" 
            />
            <p className="text-xs text-gray-400 mt-1">Você pode alterar se deu algum desconto no balcão.</p>
          </div>

          <button 
            onClick={handleVendaRapida}
            disabled={!produtoSelecionado || !valorVenda}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md disabled:bg-gray-300 disabled:shadow-none hover:opacity-90 flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            Confirmar e Lançar no Financeiro
          </button>
        </div>
      </Modal>

      <ModalProduto isOpen={isModalProdutoOpen} onClose={() => setIsModalProdutoOpen(false)} initialData={produtoEdit} />

    </div>
  );
}
