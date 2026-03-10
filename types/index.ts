export interface Client {
  id: string;
  name: string;
  type: 'individual' | 'company';
  taxNumber?: string;
  address: string;
  city: string;
  postalCode: string;
  email?: string;
  phone?: string;
  createdAt: number;
}

export interface Service {
  id: string;
  name: string;
  category: 'service' | 'product';
  description?: string;
  price: number;
  unit: string;
  ddvRate: number;
  usageCount: number;
  createdAt: number;
}

export interface InvoiceItem {
  serviceId: string;
  serviceName: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  ddvRate: number;
  totalWithoutDDV: number;
  ddvAmount: number;
  totalWithDDV: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'invoice' | 'proforma' | 'delivery_note' | 'quote';
  clientId: string;
  clientData: Client;
  items: InvoiceItem[];
  issueDate: number;
  dueDate: number;
  paymentMethod: string;
  notes?: string;
  
  subtotal: number;
  totalDDV: number;
  total: number;
  
  isPaid: boolean;
  paidAt?: number;
  
  // FURS fiskalizacija
  fursData?: {
    zoi: string;
    eor: string;
    qrCode: string;
    timestamp: number;
  };
  
  // SumUp plačilo
  sumUpPayment?: {
    id: string;
    transactionCode: string;
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
    timestamp: number;
  };
  
  createdAt: number;
}

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  monthlyRevenue: number;
  totalDDV: number;
}

export type TaxSystem = 'ddv' | 'normiranci' | 'pavsal' | 'oproščen';

export interface CompanySettings {
  name: string;
  owner: string;
  address: string;
  city: string;
  postalCode: string;
  taxNumber: string;
  registrationNumber?: string;
  taxSystem: TaxSystem;
  iban?: string;
  bic?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  company: CompanySettings;
}
