import type { Invoice, ShopProfile, UiLang, VoiceNote } from '../types';

const KEYS = {
  NOTES: 'kagojpro_voice_notes_v1',
  INVOICES: 'kagojpro_invoices_v1',
  SHOP: 'kagojpro_shop_profile_v1',
  UI_LANG: 'kagojpro_ui_lang_v1',
  SEEDED: 'kagojpro_seeded_v1',
} as const;

export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  shopName: 'Dhaka Loom & Lifestyle',
  tagline: 'Handcrafted Apparel & Daily Essentials',
  phone: '+880 1711-234567',
  address: 'House 24, Road 7, Dhanmondi, Dhaka-1205',
  stampText: 'VERIFIED · DHAKA',
};

const SEED_NOTES: VoiceNote[] = [
  {
    id: 'seed-note-1',
    title: 'আজকের ডেলিভারি ও স্টক রিমাইন্ডার',
    content:
      'আজকে মিরপুর ১০ ও ধানমন্ডি এলাকায় ৩টি পার্সেল ডেলিভারি দিতে হবে।\nনুসরাত আপুর জামদানি শাড়ি প্যাকিং শেষ হয়েছে, কুরিয়ার রাইডার দুপুর ২টায় আসবে।\nতাঁত কারখানা থেকে নতুন ২০ পিস কটন পাঞ্জাবি কাল সকালে বুঝে নিতে হবে।',
    speechLang: 'bn-BD',
    createdAt: '2026-11-13T09:15:00.000Z',
    updatedAt: '2026-11-13T09:15:00.000Z',
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'seed-inv-1001',
    invoiceNumber: 'INV-1001',
    date: '2026-11-13',
    customerName: 'Nusrat Jahan',
    customerPhone: '01715-842910',
    items: [
      { id: 'item-1', name: 'Half-Silk Jamdani Sharee (Emerald)', quantity: 1, unitPrice: 2800 },
      { id: 'item-2', name: 'Matching Handloom Blouse Piece', quantity: 1, unitPrice: 450 },
    ],
    discount: 150,
    deliveryCharge: 80,
    status: 'PAID',
    paidAmount: 3180,
    theme: 'emerald-boutique',
    createdAt: '2026-11-13T10:10:00.000Z',
    updatedAt: '2026-11-13T10:10:00.000Z',
  },
  {
    id: 'seed-inv-1002',
    invoiceNumber: 'INV-1002',
    date: '2026-11-13',
    customerName: 'তানভীর আহমেদ (Tanvir Traders)',
    customerPhone: '01819-403211',
    items: [
      { id: 'item-3', name: '80mm Thermal POS Printer (USB + BT)', quantity: 1, unitPrice: 4200 },
      { id: 'item-4', name: 'Thermal Paper Roll Pack (10 Rolls)', quantity: 2, unitPrice: 350 },
    ],
    discount: 0,
    deliveryCharge: 120,
    status: 'DUE',
    paidAmount: 2000,
    theme: 'thermal',
    createdAt: '2026-11-13T11:45:00.000Z',
    updatedAt: '2026-11-13T11:45:00.000Z',
  },
];

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function initializeStoreIfNeeded(): void {
  try {
    const seeded = window.localStorage.getItem(KEYS.SEEDED);
    if (!seeded) {
      if (!window.localStorage.getItem(KEYS.NOTES)) {
        safeWrite(KEYS.NOTES, SEED_NOTES);
      }
      if (!window.localStorage.getItem(KEYS.INVOICES)) {
        safeWrite(KEYS.INVOICES, SEED_INVOICES);
      }
      if (!window.localStorage.getItem(KEYS.SHOP)) {
        safeWrite(KEYS.SHOP, DEFAULT_SHOP_PROFILE);
      }
      window.localStorage.setItem(KEYS.SEEDED, '1');
    }
  } catch {
    // Ignore when localStorage is unavailable
  }
}

export function loadVoiceNotes(): VoiceNote[] {
  initializeStoreIfNeeded();
  return safeRead<VoiceNote[]>(KEYS.NOTES, SEED_NOTES);
}

export function saveVoiceNotes(notes: VoiceNote[]): void {
  safeWrite(KEYS.NOTES, notes);
}

export function loadInvoices(): Invoice[] {
  initializeStoreIfNeeded();
  return safeRead<Invoice[]>(KEYS.INVOICES, SEED_INVOICES);
}

export function saveInvoices(invoices: Invoice[]): void {
  safeWrite(KEYS.INVOICES, invoices);
}

export function loadShopProfile(): ShopProfile {
  initializeStoreIfNeeded();
  return safeRead<ShopProfile>(KEYS.SHOP, DEFAULT_SHOP_PROFILE);
}

export function saveShopProfile(profile: ShopProfile): void {
  safeWrite(KEYS.SHOP, profile);
}

export function loadUiLang(): UiLang {
  try {
    const val = window.localStorage.getItem(KEYS.UI_LANG);
    return val === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function saveUiLang(lang: UiLang): void {
  try {
    window.localStorage.setItem(KEYS.UI_LANG, lang);
  } catch {
    // Ignore
  }
}
