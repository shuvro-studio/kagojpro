export type AppTab = 'voice' | 'receipt' | 'history';

export type UiLang = 'bn' | 'en';

export type SpeechLang = 'bn-BD' | 'en-US';

export type PaymentStatus = 'PAID' | 'DUE';

export type ReceiptTheme = 'thermal' | 'modern-blue' | 'emerald-boutique';

export interface VoiceNote {
  id: string;
  title: string;
  content: string;
  speechLang: SpeechLang;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProfile {
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  stampText: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  discount: number;
  deliveryCharge: number;
  status: PaymentStatus;
  paidAmount: number;
  theme: ReceiptTheme;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  totalInvoices: number;
  totalSales: number;
  totalDue: number;
  paidCount: number;
  dueCount: number;
}
