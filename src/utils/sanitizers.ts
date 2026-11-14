import type { InvoiceItem, ShopProfile } from '../types';

export const BLUEPRINT_LIMITS = {
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 200,
  SHOP_NAME_MAX: 120,
  TAGLINE_MAX: 160,
  PHONE_MAX: 40,
  ADDRESS_MAX: 240,
  STAMP_MAX: 60,
  NOTE_TITLE_MAX: 120,
  NOTE_CONTENT_MAX: 20000,
  INVOICE_NUMBER_MAX: 40,
  DATE_MAX: 20,
  CUSTOMER_NAME_MAX: 120,
  ITEMS_MAX: 50,
  ITEM_ID_MAX: 64,
  ITEM_NAME_MAX: 160,
} as const;

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function sanitizeShopProfile(profile: ShopProfile): ShopProfile {
  return {
    shopName: profile.shopName.slice(0, BLUEPRINT_LIMITS.SHOP_NAME_MAX),
    tagline: profile.tagline.slice(0, BLUEPRINT_LIMITS.TAGLINE_MAX),
    phone: profile.phone.slice(0, BLUEPRINT_LIMITS.PHONE_MAX),
    address: profile.address.slice(0, BLUEPRINT_LIMITS.ADDRESS_MAX),
    stampText: profile.stampText.slice(0, BLUEPRINT_LIMITS.STAMP_MAX),
  };
}

export function sanitizeInvoiceItems(items: InvoiceItem[]): InvoiceItem[] {
  return items
    .filter((item) => item.name.trim().length > 0)
    .slice(0, BLUEPRINT_LIMITS.ITEMS_MAX)
    .map((item, idx) => ({
      id:
        clampString(item.id || `item-${idx + 1}`, BLUEPRINT_LIMITS.ITEM_ID_MAX) ||
        `item-${idx + 1}`,
      name: clampString(item.name, BLUEPRINT_LIMITS.ITEM_NAME_MAX),
      quantity: Math.max(0.01, Math.min(1000000, Number(item.quantity) || 1)),
      unitPrice: Math.max(0, Math.min(100000000, Number(item.unitPrice) || 0)),
    }));
}
