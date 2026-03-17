import { useState } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, FileText, Trash2, Send, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quote } from '../types';
import { QuoteDetailsModal } from '../components/QuoteDetailsModal';

interface QuotesProps {
  onNewQuote: () => void;
  onEditQuote: (quote: Quote) => void;
}

export const Quotes = ({ onNewQuote, onEditQuote }: QuotesProps) => {
  const { quotes, clients, deleteQuote, updateQuote } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Cliente não encontrado';
  };

  const filteredQuotes = quotes.filter((q) => {
    const clientName = getClientName(q.clientId).toLowerCase();
    return clientName.includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Orçamentos</h2>
        <button
          onClick={onNewQuote}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Novo Orçamento
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredQuotes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum orçamento encontrado.
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div 
              key={quote.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
              onClick={() => setViewingQuote(quote)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{getClientName(quote.clientId)}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                  {getStatusText(quote.status)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 flex-1 mb-4">
                <p className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(quote.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Validade:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(quote.validUntil), "dd/MM/yyyy")}
                  </span>
                </p>
                {quote.deliveryTime && (
                  <p className="flex justify-between">
                    <span>Prazo:</span>
                    <span className="font-medium text-gray-900">
                      {quote.deliveryTime}
                    </span>
                  </p>
                )}
                {quote.downPayment !== undefined && quote.downPayment > 0 && (
                  <p className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.downPayment)}
                    </span>
                  </p>
                )}
                <p className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                  </span>
                </p>
              </div>

              <div 
                className="flex gap-2 pt-4 border-t border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  value={quote.status}
                  onChange={async (e) => await updateQuote(quote.id, { status: e.target.value as Quote['status'] })}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
                <button
                  onClick={() => onEditQuote(quote)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={async () => {
                    // Removed window.confirm due to iframe restrictions
                    await deleteQuote(quote.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingQuote && (
        <QuoteDetailsModal 
          quote={viewingQuote} 
          onClose={() => setViewingQuote(null)} 
          onEdit={() => {
            setViewingQuote(null);
            onEditQuote(viewingQuote);
          }}
        />
      )}
    </div>
  );
};
