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

  const { loading } = useAppContext();

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
