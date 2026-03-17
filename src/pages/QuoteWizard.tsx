import { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Send, FileDown, AlertCircle, Edit2, Save } from 'lucide-react';
import { Client, Material, QuoteItem, Quote } from '../types';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { v4 as uuidv4 } from 'uuid';

interface QuoteWizardProps {
  onClose: () => void;
  quoteToEdit?: Quote;
}

export const QuoteWizard = ({ onClose, quoteToEdit }: QuoteWizardProps) => {
  const { clients, materials, addQuote, updateQuote } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<string>(quoteToEdit?.clientId || '');
  const [items, setItems] = useState<QuoteItem[]>(quoteToEdit?.items || []);
  
  // Calculate validity days from dates if editing
  const initialValidityDays = quoteToEdit 
    ? Math.round((new Date(quoteToEdit.validUntil).getTime() - new Date(quoteToEdit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 7;
    
  const [validityDays, setValidityDays] = useState(initialValidityDays);
  const [deliveryTime, setDeliveryTime] = useState(quoteToEdit?.deliveryTime || '15 dias úteis');
  const [downPayment, setDownPayment] = useState(quoteToEdit?.downPayment || 0);
  const [laborType, setLaborType] = useState<'percentage' | 'fixed'>(quoteToEdit?.laborType || 'percentage');
  const [laborValue, setLaborValue] = useState(quoteToEdit?.laborValue || quoteToEdit?.laborPercentage || 0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(quoteToEdit?.discountType || 'percentage');
  const [discountValue, setDiscountValue] = useState(quoteToEdit?.discountValue || 0);
  const [observations, setObservations] = useState(quoteToEdit?.observations || '');
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form state for adding an item
  const [currentItem, setCurrentItem] = useState({
    materialId: '',
    name: '',
    quantity: 1,
    unitPrice: 0,
    observation: '',
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNextStep = async () => {
    if (step === 1 && !selectedClient) {
      setError('Selecione um cliente para continuar.');
      return;
    }
    if (step === 2 && items.length === 0) {
      setError('Adicione pelo menos um item ao orçamento.');
      return;
    }
    if (step === 2) {
      await generateQuote();
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleAddItem = () => {
    if (!currentItem.materialId && !currentItem.name) {
      setError('Selecione um material ou digite um nome para o item.');
      return;
    }
    
    if (editingItemId) {
      setItems(items.map(item => item.id === editingItemId ? { ...currentItem, id: editingItemId } : item));
      setEditingItemId(null);
    } else {
      setItems([...items, { ...currentItem, id: uuidv4() }]);
    }
    
    setCurrentItem({
      materialId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      observation: '',
    });
    setError(null);
  };

  const handleEditItem = (item: QuoteItem) => {
    setCurrentItem({
      materialId: item.materialId,
      name: item.name || materials.find(m => m.id === item.materialId)?.name || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice !== undefined ? item.unitPrice : calculateItemTotal(item) / item.quantity,
      observation: item.observation || '',
    });
    setEditingItemId(item.id);
    setError(null);
    document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setCurrentItem({
      materialId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      observation: '',
    });
    setEditingItemId(null);
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateItemTotal = (item: QuoteItem) => {
    if (item.unitPrice !== undefined) {
      return item.unitPrice * item.quantity;
    }
    // Fallback for old data
    const material = materials.find((m) => m.id === item.materialId);
    if (!material) return 0;

    const materialCost = material.costPrice * item.quantity;
    const lossCost = materialCost * ((item.technicalLossPercentage || 0) / 100);
    const totalCost = materialCost + lossCost + (item.laborCost || 0);
    return totalCost * (1 + (item.profitMarginPercentage || 0) / 100);
  };

  const generateQuote = async () => {
    const itemsTotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const laborAmount = laborType === 'percentage' ? itemsTotal * (laborValue / 100) : laborValue;
    const subtotal = itemsTotal + laborAmount;
    
    const discountAmount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue;
    const totalValue = Math.max(0, subtotal - discountAmount);

    const createdAt = quoteToEdit ? quoteToEdit.createdAt : new Date().toISOString();
    const validUntil = new Date(new Date(createdAt).getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    const newQuote: Quote = {
      id: quoteToEdit ? quoteToEdit.id : uuidv4(),
      clientId: selectedClient,
      items,
      createdAt,
      validUntil,
      totalValue,
      status: quoteToEdit ? quoteToEdit.status : 'draft',
      deliveryTime,
      downPayment,
      laborType,
      laborValue,
      laborPercentage: laborType === 'percentage' ? laborValue : 0,
      discountType,
      discountValue,
      discountAmount,
      observations,
    };

    setGeneratedQuote(newQuote);
    if (quoteToEdit) {
      await updateQuote(quoteToEdit.id, newQuote);
    } else {
      await addQuote(newQuote);
    }
    return newQuote;
  };

  const handleSaveAndExit = async () => {
    if (items.length === 0) {
      setError('Adicione pelo menos um item ao orçamento.');
      return;
    }
    await generateQuote();
    onClose();
  };

  const handleDownloadPDF = () => {
    if (!generatedQuote) return;
    const client = clients.find((c) => c.id === generatedQuote.clientId);
    if (!client) return;

    const companyData = {
      name: 'Serralharia JRV',
      phone: '98 991557039',
      email: 'Serralhariajrv@gmail.com',
      address: 'Avenida Brasil S/N, Barrio: Santa Quitéria - Bacabeira - MA',
    };

    const doc = generateQuotePDF(generatedQuote, client, materials, companyData);
    doc.save(`Orcamento_${client.name.replace(/\s+/g, '_')}_${generatedQuote.id.substring(0, 8)}.pdf`);
  };

  const handleSendWhatsApp = () => {
    if (!generatedQuote) return;
    const client = clients.find((c) => c.id === generatedQuote.clientId);
    if (!client) return;

    const phone = client.phone.replace(/\D/g, '');
    const message = `Olá ${client.name}, segue o orçamento solicitado. Valor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(generatedQuote.totalValue)}. Validade: ${validityDays} dias.`;
    const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    if (!generatedQuote) return;
    const client = clients.find((c) => c.id === generatedQuote.clientId);
    if (!client || !client.email) {
      setError('Cliente não possui e-mail cadastrado.');
      return;
    }

    const subject = `Orçamento - Serralharia JRV`;
    const body = `Olá ${client.name},\n\nSegue o orçamento solicitado.\nValor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(generatedQuote.totalValue)}.\nValidade: ${validityDays} dias.\n\nAtenciosamente,\nSerralharia JRV`;
    const url = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-gray-100 flex flex-col md:p-6">
      <div className="flex-1 w-full max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-xl flex flex-col overflow-hidden relative">
        {/* Error Toast */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center shadow-lg">
            <AlertCircle className="mr-2" size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={onClose} className="mr-4 p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {quoteToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
            <span className={step >= 1 ? 'text-blue-600' : ''}>1. Cliente</span>
            <span>&gt;</span>
            <span className={step >= 2 ? 'text-blue-600' : ''}>2. Itens</span>
            <span>&gt;</span>
            <span className={step >= 3 ? 'text-blue-600' : ''}>3. Resumo</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900">Selecione o Cliente</h3>
              {clients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500 mb-4">Nenhum cliente cadastrado.</p>
                  <button onClick={onClose} className="text-blue-600 font-medium hover:underline">
                    Vá para a aba Clientes para cadastrar
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {clients.map((client) => (
                    <label
                      key={client.id}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedClient === client.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="client"
                        value={client.id}
                        checked={selectedClient === client.id}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-4 flex-1">
                        <p className="font-bold text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.document} • {client.phone}</p>
                      </div>
                      {selectedClient === client.id && <Check className="text-blue-600" size={20} />}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900">Adicionar Itens e Custos</h3>
              
              {/* Add Item Form */}
              <div id="item-form" className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material do Catálogo</label>
                    <select
                      value={currentItem.materialId}
                      onChange={(e) => {
                        const materialId = e.target.value;
                        const material = materials.find(m => m.id === materialId);
                        setCurrentItem({ 
                          ...currentItem, 
                          materialId,
                          name: material ? material.name : currentItem.name,
                          unitPrice: material ? material.costPrice : currentItem.unitPrice
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Item personalizado (digite o nome ao lado)...</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.costPrice)}/{m.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                    <input
                      type="text"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                      placeholder="Nome do item"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <input
                      type="text"
                      value={materials.find(m => m.id === currentItem.materialId)?.unit || '-'}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitPrice}
                      onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo Total (R$)</label>
                    <input
                      type="text"
                      value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentItem.quantity * currentItem.unitPrice)}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 font-bold rounded-xl cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observação do Item (Opcional)</label>
                  <input
                    type="text"
                    value={currentItem.observation}
                    onChange={(e) => setCurrentItem({ ...currentItem, observation: e.target.value })}
                    placeholder="Ex: Medida 2x2m, Cor Branca..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  {editingItemId && (
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleAddItem}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-blue-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    {editingItemId ? <Check className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                    {editingItemId ? 'Salvar Alterações' : 'Adicionar Item'}
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                    <h4 className="font-bold text-gray-900">Itens Adicionados ({items.length})</h4>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {items.map((item) => {
                      const material = materials.find((m) => m.id === item.materialId);
                      return (
                        <li key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">
                              {item.name || material?.name || 'Item Personalizado'}
                              {item.observation && <span className="text-sm font-normal text-gray-500 ml-2">- {item.observation}</span>}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.quantity} {material?.unit || 'un'} • V. Unit: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice !== undefined ? item.unitPrice : calculateItemTotal(item) / item.quantity)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                            <span className="font-bold text-blue-600 text-lg mr-2">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateItemTotal(item))}
                            </span>
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar item"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover item"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Custo Total dos Materiais:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          items.reduce((acc, item) => acc + calculateItemTotal(item), 0)
                        )}
                      </span>
                    </div>
                    {laborValue > 0 && (
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Mão de Obra ({laborType === 'percentage' ? `${laborValue}% sobre o custo` : 'Valor Fixo'}):</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            laborType === 'percentage' 
                              ? items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (laborValue / 100)
                              : laborValue
                          )}
                        </span>
                      </div>
                    )}
                    {discountValue > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto ({discountType === 'percentage' ? `${discountValue}%` : 'Valor Fixo'}):</span>
                        <span className="font-medium">
                          - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            discountType === 'percentage'
                              ? (items.reduce((acc, item) => acc + calculateItemTotal(item), 0) + (laborType === 'percentage' ? items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (laborValue / 100) : laborValue)) * (discountValue / 100)
                              : discountValue
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total Geral:</span>
                      <span className="font-bold text-2xl text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          Math.max(0, (items.reduce((acc, item) => acc + calculateItemTotal(item), 0) + 
                          (laborType === 'percentage' 
                            ? items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (laborValue / 100)
                            : laborValue)) - (discountType === 'percentage' ? (items.reduce((acc, item) => acc + calculateItemTotal(item), 0) + (laborType === 'percentage' ? items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (laborValue / 100) : laborValue)) * (discountValue / 100) : discountValue))
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">Condições e Observações</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mão de Obra</label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                          onClick={() => setLaborType('percentage')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${laborType === 'percentage' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                          Porcentagem
                        </button>
                        <button
                          onClick={() => setLaborType('fixed')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${laborType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                          Valor Fixo
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step={laborType === 'fixed' ? '0.01' : '1'}
                          value={laborValue}
                          onChange={(e) => setLaborValue(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          {laborType === 'percentage' ? '%' : 'R$'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                          onClick={() => setDiscountType('percentage')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${discountType === 'percentage' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => setDiscountType('fixed')}
                          className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${discountType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                          R$
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step={discountType === 'fixed' ? '0.01' : '1'}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          {discountType === 'percentage' ? '%' : 'R$'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validade (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                    <input
                      type="text"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      placeholder="Ex: 15 dias úteis"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Entrada (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={downPayment}
                      onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Instalação inclusa, garantia de 1 ano..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && generatedQuote && (
            <div className="space-y-6 max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {quoteToEdit ? 'Orçamento Atualizado!' : 'Orçamento Gerado!'}
              </h3>
              <p className="text-gray-500">
                O orçamento para <span className="font-bold text-gray-900">{clients.find(c => c.id === generatedQuote.clientId)?.name}</span> foi {quoteToEdit ? 'atualizado' : 'criado'} com sucesso.
              </p>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm my-8">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-2">Valor Total</p>
                <p className="text-4xl font-black text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(generatedQuote.totalValue)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all group"
                >
                  <FileDown className="text-gray-400 group-hover:text-blue-600 mb-2" size={32} />
                  <span className="font-medium text-gray-900">Baixar PDF</span>
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-green-500 transition-all group"
                >
                  <Send className="text-gray-400 group-hover:text-green-500 mb-2" size={32} />
                  <span className="font-medium text-gray-900">WhatsApp</span>
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-500 transition-all group"
                >
                  <Send className="text-gray-400 group-hover:text-blue-500 mb-2" size={32} />
                  <span className="font-medium text-gray-900">E-mail</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center sticky bottom-0 z-10">
          {step > 1 && step < 3 ? (
            <button
              onClick={handlePrevStep}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          ) : (
            <div></div> // Spacer
          )}
          
          {step < 3 ? (
            <div className="flex gap-3">
              {step === 2 && (
                <button
                  onClick={handleSaveAndExit}
                  className="flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                >
                  <Save className="mr-2" size={20} />
                  Salvar
                </button>
              )}
              <button
                onClick={handleNextStep}
                className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                {step === 2 ? 'Gerar Orçamento' : 'Próximo'}
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Concluir e Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
