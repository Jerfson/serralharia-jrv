import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Material, Quote } from './types';
import { supabase } from './lib/supabase';

interface AppState {
  clients: Client[];
  materials: Material[];
  quotes: Quote[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Omit<Client, 'id'>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (id: string, material: Omit<Material, 'id'>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, materialsRes, quotesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('quotes').select('*'),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
      if (quotesRes.data) setQuotes(quotesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addClient = async (client: Omit<Client, 'id'>) => {
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) console.error('Error adding client:', error);
    else if (data) setClients([...clients, data[0]]);
  };

  const updateClient = async (id: string, updatedClient: Omit<Client, 'id'>) => {
    const { error } = await supabase.from('clients').update(updatedClient).eq('id', id);
    if (error) console.error('Error updating client:', error);
    else setClients(clients.map((c) => (c.id === id ? { ...updatedClient, id } : c)));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error('Error deleting client:', error);
    else setClients(clients.filter((c) => c.id !== id));
  };

  const addMaterial = async (material: Omit<Material, 'id'>) => {
    const { data, error } = await supabase.from('materials').insert([material]).select();
    if (error) console.error('Error adding material:', error);
    else if (data) setMaterials([...materials, data[0]]);
  };

  const updateMaterial = async (id: string, updatedMaterial: Omit<Material, 'id'>) => {
    const { error } = await supabase.from('materials').update(updatedMaterial).eq('id', id);
    if (error) console.error('Error updating material:', error);
    else setMaterials(materials.map((m) => (m.id === id ? { ...updatedMaterial, id } : m)));
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) console.error('Error deleting material:', error);
    else setMaterials(materials.filter((m) => m.id !== id));
  };

  const addQuote = async (quote: Omit<Quote, 'id'>) => {
    const { data, error } = await supabase.from('quotes').insert([quote]).select();
    if (error) console.error('Error adding quote:', error);
    else if (data) setQuotes([...quotes, data[0]]);
  };

  const updateQuote = async (id: string, updatedQuote: Partial<Quote>) => {
    const { error } = await supabase.from('quotes').update(updatedQuote).eq('id', id);
    if (error) console.error('Error updating quote:', error);
    else setQuotes(quotes.map((q) => (q.id === id ? { ...q, ...updatedQuote } : q)));
  };

  const deleteQuote = async (id: string) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) console.error('Error deleting quote:', error);
    else setQuotes(quotes.filter((q) => q.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        materials,
        quotes,
        loading,
        addClient,
        updateClient,
        deleteClient,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addQuote,
        updateQuote,
        deleteQuote,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
