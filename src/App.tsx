/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider, useAppContext } from './store';
import { Layout } from './components/Layout';
import { Clients } from './pages/Clients';
import { Materials } from './pages/Materials';
import { Quotes } from './pages/Quotes';
import { QuoteWizard } from './pages/QuoteWizard';
import { Quote } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'clients' | 'materials'>('quotes');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const handleOpenWizard = (quote?: Quote) => {
    setEditingQuote(quote || null);
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setEditingQuote(null);
  };

  const { loading, error } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewQuote={() => handleOpenWizard()}
      >
        {activeTab === 'quotes' && <Quotes onNewQuote={() => handleOpenWizard()} onEditQuote={handleOpenWizard} />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'materials' && <Materials />}
      </Layout>
      
      {isWizardOpen && (
        <QuoteWizard onClose={handleCloseWizard} quoteToEdit={editingQuote || undefined} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
