import { ReactNode } from 'react';
import { FileText, Users, Package, PlusCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'quotes' | 'clients' | 'materials';
  setActiveTab: (tab: 'quotes' | 'clients' | 'materials') => void;
  onNewQuote: () => void;
}

export const Layout = ({ children, activeTab, setActiveTab, onNewQuote }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Serralharia JRV</h1>
          <button
            onClick={onNewQuote}
            className="md:hidden flex items-center justify-center bg-blue-600 text-white rounded-full p-2 shadow-lg"
          >
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Serralharia JRV</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-left ${
              activeTab === 'quotes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="mr-3" size={20} />
            Orçamentos
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-left ${
              activeTab === 'clients' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="mr-3" size={20} />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-left ${
              activeTab === 'materials' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="mr-3" size={20} />
            Materiais
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onNewQuote}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="mr-2" size={20} />
            Novo Orçamento
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around pb-safe z-20">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex flex-col items-center py-3 px-4 ${
            activeTab === 'quotes' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <FileText size={24} />
          <span className="text-[10px] mt-1 font-medium">Orçamentos</span>
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center py-3 px-4 ${
            activeTab === 'clients' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Users size={24} />
          <span className="text-[10px] mt-1 font-medium">Clientes</span>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex flex-col items-center py-3 px-4 ${
            activeTab === 'materials' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Package size={24} />
          <span className="text-[10px] mt-1 font-medium">Materiais</span>
        </button>
      </nav>
    </div>
  );
};
