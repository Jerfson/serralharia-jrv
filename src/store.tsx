import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Material, Quote } from './types';
import { supabase } from './lib/supabase';

// ─── DB row types (snake_case) ───────────────────────────────────────────────

interface ClientRow {
  id: string;
  name: string;
  document?: string;
  phone: string;
  email?: string;
  address?: string;
  observation?: string;
}

interface MaterialRow {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'mt' | 'par' | 'jg';
  cost_price: number;
  supplier: string;
  observation?: string;
}

interface QuoteRow {
  id: string;
  client_id: string;
  items: Quote['items'];
  created_at: string;
  valid_until: string;
  total_value: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  delivery_time?: string;
  down_payment?: number;
  labor_type?: 'percentage' | 'fixed';
  labor_value?: number;
  labor_percentage?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  observations?: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    phone: row.phone,
    email: row.email ?? '',
    address: row.address,
    observation: row.observation,
  };
}

function clientToRow(client: Omit<Client, 'id'>): Omit<ClientRow, 'id'> {
  return {
    name: client.name,
    document: client.document,
    phone: client.phone,
    email: client.email,
    address: client.address,
    observation: client.observation,
  };
}

function rowToMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    costPrice: Number(row.cost_price),
    supplier: row.supplier,
    observation: row.observation,
  };
}

function materialToRow(material: Omit<Material, 'id'>): Omit<MaterialRow, 'id'> {
  return {
    name: material.name,
    unit: material.unit,
    cost_price: material.costPrice,
    supplier: material.supplier,
    observation: material.observation,
  };
}

function rowToQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    clientId: row.client_id,
    items: row.items ?? [],
    createdAt: row.created_at,
    validUntil: row.valid_until,
    totalValue: Number(row.total_value),
    status: row.status,
    deliveryTime: row.delivery_time,
    downPayment: row.down_payment !== undefined ? Number(row.down_payment) : undefined,
    laborType: row.labor_type,
    laborValue: row.labor_value !== undefined ? Number(row.labor_value) : undefined,
    laborPercentage: row.labor_percentage !== undefined ? Number(row.labor_percentage) : undefined,
    discountType: row.discount_type,
    discountValue: row.discount_value !== undefined ? Number(row.discount_value) : undefined,
    discountAmount: row.discount_amount !== undefined ? Number(row.discount_amount) : undefined,
    observations: row.observations,
  };
}

function quoteToRow(quote: Omit<Quote, 'id'>): Omit<QuoteRow, 'id'> {
  return {
    client_id: quote.clientId,
    items: quote.items,
    created_at: quote.createdAt,
    valid_until: quote.validUntil,
    total_value: quote.totalValue,
    status: quote.status,
    delivery_time: quote.deliveryTime,
    down_payment: quote.downPayment,
    labor_type: quote.laborType,
    labor_value: quote.laborValue,
    labor_percentage: quote.laborPercentage,
    discount_type: quote.discountType,
    discount_value: quote.discountValue,
    discount_amount: quote.discountAmount,
    observations: quote.observations,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppState {
  clients: Client[];
  materials: Material[];
  quotes: Quote[];
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, materialsRes, quotesRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('materials').select('*').order('name'),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      ]);

      if (clientsRes.error) throw new Error(`Clientes: ${clientsRes.error.message}`);
      if (materialsRes.error) throw new Error(`Materiais: ${materialsRes.error.message}`);
      if (quotesRes.error) throw new Error(`Orçamentos: ${quotesRes.error.message}`);

      setClients((clientsRes.data as ClientRow[]).map(rowToClient));
      setMaterials((materialsRes.data as MaterialRow[]).map(rowToMaterial));
      setQuotes((quotesRes.data as QuoteRow[]).map(rowToQuote));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('Erro ao buscar dados:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Clients ──────────────────────────────────────────────────────────────
  const addClient = async (client: Omit<Client, 'id'>) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientToRow(client)])
      .select()
      .single();
    if (error) { console.error('Erro ao adicionar cliente:', error); return; }
    setClients((prev) => [rowToClient(data as ClientRow), ...prev]);
  };

  const updateClient = async (id: string, updatedClient: Omit<Client, 'id'>) => {
    const { error } = await supabase
      .from('clients')
      .update(clientToRow(updatedClient))
      .eq('id', id);
    if (error) { console.error('Erro ao atualizar cliente:', error); return; }
    setClients((prev) => prev.map((c) => (c.id === id ? { ...updatedClient, id } : c)));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { console.error('Erro ao deletar cliente:', error); return; }
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Materials ─────────────────────────────────────────────────────────────
  const addMaterial = async (material: Omit<Material, 'id'>) => {
    const { data, error } = await supabase
      .from('materials')
      .insert([materialToRow(material)])
      .select()
      .single();
    if (error) { console.error('Erro ao adicionar material:', error); return; }
    setMaterials((prev) => [...prev, rowToMaterial(data as MaterialRow)]);
  };

  const updateMaterial = async (id: string, updatedMaterial: Omit<Material, 'id'>) => {
    const { error } = await supabase
      .from('materials')
      .update(materialToRow(updatedMaterial))
      .eq('id', id);
    if (error) { console.error('Erro ao atualizar material:', error); return; }
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...updatedMaterial, id } : m)));
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) { console.error('Erro ao deletar material:', error); return; }
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Quotes ────────────────────────────────────────────────────────────────
  const addQuote = async (quote: Omit<Quote, 'id'>) => {
    const { data, error } = await supabase
      .from('quotes')
      .insert([quoteToRow(quote)])
      .select()
      .single();
    if (error) { console.error('Erro ao adicionar orçamento:', error); return; }
    setQuotes((prev) => [rowToQuote(data as QuoteRow), ...prev]);
  };

  const updateQuote = async (id: string, updatedQuote: Partial<Quote>) => {
    // Converte apenas os campos que existem no updatedQuote
    const partial: Partial<QuoteRow> = {};
    if (updatedQuote.clientId !== undefined) partial.client_id = updatedQuote.clientId;
    if (updatedQuote.items !== undefined) partial.items = updatedQuote.items;
    if (updatedQuote.createdAt !== undefined) partial.created_at = updatedQuote.createdAt;
    if (updatedQuote.validUntil !== undefined) partial.valid_until = updatedQuote.validUntil;
    if (updatedQuote.totalValue !== undefined) partial.total_value = updatedQuote.totalValue;
    if (updatedQuote.status !== undefined) partial.status = updatedQuote.status;
    if (updatedQuote.deliveryTime !== undefined) partial.delivery_time = updatedQuote.deliveryTime;
    if (updatedQuote.downPayment !== undefined) partial.down_payment = updatedQuote.downPayment;
    if (updatedQuote.laborType !== undefined) partial.labor_type = updatedQuote.laborType;
    if (updatedQuote.laborValue !== undefined) partial.labor_value = updatedQuote.laborValue;
    if (updatedQuote.laborPercentage !== undefined) partial.labor_percentage = updatedQuote.laborPercentage;
    if (updatedQuote.discountType !== undefined) partial.discount_type = updatedQuote.discountType;
    if (updatedQuote.discountValue !== undefined) partial.discount_value = updatedQuote.discountValue;
    if (updatedQuote.discountAmount !== undefined) partial.discount_amount = updatedQuote.discountAmount;
    if (updatedQuote.observations !== undefined) partial.observations = updatedQuote.observations;

    const { error } = await supabase.from('quotes').update(partial).eq('id', id);
    if (error) { console.error('Erro ao atualizar orçamento:', error); return; }
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...updatedQuote } : q)));
  };

  const deleteQuote = async (id: string) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) { console.error('Erro ao deletar orçamento:', error); return; }
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        materials,
        quotes,
        loading,
        error,
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
