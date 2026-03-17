import { X, FileDown, Send, Edit2 } from 'lucide-react';
import { Quote } from '../types';
import { useAppContext } from '../store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuoteDetailsModalProps {
  quote: Quote;
  onClose: () => void;
  onEdit?: () => void;
}

export const QuoteDetailsModal = ({ quote, onClose, onEdit }: QuoteDetailsModalProps) => {
  const { clients, materials } = useAppContext();
  const client = clients.find((c) => c.id === quote.clientId);

  if (!client) return null;

  const calculateItemTotal = (item: any) => {
    if (item.unitPrice !== undefined) {
      return item.unitPrice * item.quantity;
    }
    const material = materials.find((m) => m.id === item.materialId);
    if (!material) return 0;

    const materialCost = material.costPrice * item.quantity;
    const lossCost = materialCost * ((item.technicalLossPercentage || 0) / 100);
    const totalCost = materialCost + lossCost + (item.laborCost || 0);
    return totalCost * (1 + (item.profitMarginPercentage || 0) / 100);
  };

  const handleDownloadPDF = () => {
    const companyData = {
      name: 'Serralharia JRV',
      phone: '98 991557039',
      email: 'Serralhariajrv@gmail.com',
      address: 'Avenida Brasil S/N, Barrio: Santa Quitéria - Bacabeira - MA',
    };

    const doc = generateQuotePDF(quote, client, materials, companyData);
    doc.save(`Orcamento_${client.name.replace(/\s+/g, '_')}_${quote.id.substring(0, 8)}.pdf`);
  };

  const handleSendWhatsApp = () => {
    const phone = client.phone.replace(/\D/g, '');
    const validityDays = Math.round((new Date(quote.validUntil).getTime() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const message = `Olá ${client.name}, segue o orçamento solicitado. Valor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}. Validade: ${validityDays} dias.`;
    const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    if (!client.email) {
      alert('Cliente não possui e-mail cadastrado.');
      return;
    }

    const validityDays = Math.round((new Date(quote.validUntil).getTime() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const subject = `Orçamento - Serralharia JRV`;
    const body = `Olá ${client.name},\n\nSegue o orçamento solicitado.\nValor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}.\nValidade: ${validityDays} dias.\n\nAtenciosamente,\nSerralharia JRV`;
    const url = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviado';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detalhes do Orçamento</h2>
            <p className="text-sm text-gray-500">#{quote.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button 
                onClick={onEdit} 
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          {/* Top Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Dados do Cliente</h3>
              <p className="font-bold text-gray-900 text-lg">{client.name}</p>
              {client.document && <p className="text-gray-600 text-sm mt-1">{client.document}</p>}
              <p className="text-gray-600 text-sm">{client.phone}</p>
              {client.email && <p className="text-gray-600 text-sm">{client.email}</p>}
              {client.address && <p className="text-gray-600 text-sm mt-1 italic">{client.address}</p>}
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Informações do Orçamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusText(quote.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="font-medium text-gray-900">{format(new Date(quote.createdAt), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Válido até:</span>
                  <span className="font-medium text-gray-900">{format(new Date(quote.validUntil), "dd/MM/yyyy")}</span>
                </div>
                {quote.deliveryTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prazo de Entrega:</span>
                    <span className="font-medium text-gray-900">{quote.deliveryTime}</span>
                  </div>
                )}
                {quote.downPayment !== undefined && quote.downPayment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor da Entrada:</span>
                    <span className="font-medium text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.downPayment)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="font-bold text-gray-900">Itens do Orçamento ({quote.items.length})</h4>
            </div>
            <ul className="divide-y divide-gray-200">
              {quote.items.map((item) => {
                const material = materials.find((m) => m.id === item.materialId);
                return (
                  <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {item.name || material?.name || 'Item Personalizado'}
                        {item.observation && <span className="text-sm font-normal text-gray-500 ml-2">- {item.observation}</span>}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.quantity} {material?.unit || 'un'} • V. Unit: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice !== undefined ? item.unitPrice : calculateItemTotal(item) / item.quantity)}
                      </p>
                    </div>
                    <div className="font-bold text-blue-600 text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateItemTotal(item))}
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
                    quote.items.reduce((acc, item) => acc + calculateItemTotal(item), 0)
                  )}
                </span>
              </div>
              {quote.laborValue !== undefined && quote.laborValue > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Mão de Obra ({quote.laborType === 'percentage' ? `${quote.laborValue}% sobre o custo` : 'Valor Fixo'}):</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      quote.laborType === 'percentage' 
                        ? quote.items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (quote.laborValue / 100)
                        : quote.laborValue
                    )}
                  </span>
                </div>
              )}
              {(!quote.laborValue || quote.laborValue === 0) && quote.laborPercentage !== undefined && quote.laborPercentage > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Mão de Obra ({quote.laborPercentage}% sobre o custo):</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      quote.items.reduce((acc, item) => acc + calculateItemTotal(item), 0) * (quote.laborPercentage / 100)
                    )}
                  </span>
                </div>
              )}
              {quote.discountValue !== undefined && quote.discountValue > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>Desconto ({quote.discountType === 'percentage' ? `${quote.discountValue}%` : 'Valor Fixo'}):</span>
                  <span className="font-medium">
                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-700 text-lg">Valor Total:</span>
                <span className="font-black text-2xl text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Observations */}
          {quote.observations && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Observações</h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.observations}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <FileDown className="mr-2" size={18} />
            Baixar PDF
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex items-center justify-center px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors"
          >
            <Send className="mr-2" size={18} />
            WhatsApp
          </button>
          <button
            onClick={handleSendEmail}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors"
          >
            <Send className="mr-2" size={18} />
            E-mail
          </button>
        </div>
      </div>
    </div>
  );
};
