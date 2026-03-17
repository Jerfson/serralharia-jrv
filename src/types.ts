export interface Client {
  id: string;
  name: string;
  document?: string;
  phone: string;
  email: string;
  address?: string;
  observation?: string;
}

export interface Material {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'mt' | 'par' | 'jg';
  costPrice: number;
  supplier: string;
  observation?: string;
}

export interface QuoteItem {
  id: string;
  materialId: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  technicalLossPercentage?: number;
  laborCost?: number;
  profitMarginPercentage?: number;
  observation?: string;
}

export interface Quote {
  id: string;
  clientId: string;
  items: QuoteItem[];
  createdAt: string;
  validUntil: string;
  totalValue: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  deliveryTime?: string;
  downPayment?: number;
  laborType?: 'percentage' | 'fixed';
  laborValue?: number;
  laborPercentage?: number; // Keep for backward compatibility if needed
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  observations?: string;
}
