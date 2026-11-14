import type { Invoice, InvoiceItem, PaymentStatus, SalesSummary } from '../types';

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const safePrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
  return Math.round(safeQty * safePrice * 100) / 100;
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  const sum = items.reduce((acc, item) => acc + calculateItemTotal(item.quantity, item.unitPrice), 0);
  return Math.round(sum * 100) / 100;
}

export function calculateGrandTotal(
  items: InvoiceItem[],
  discount: number,
  deliveryCharge: number
): number {
  const subtotal = calculateSubtotal(items);
  const safeDiscount = Number.isFinite(discount) && discount > 0 ? discount : 0;
  const safeDelivery = Number.isFinite(deliveryCharge) && deliveryCharge >= 0 ? deliveryCharge : 0;
  const total = Math.max(0, subtotal - safeDiscount) + safeDelivery;
  return Math.round(total * 100) / 100;
}

export function calculateDueAmount(
  grandTotal: number,
  status: PaymentStatus,
  paidAmount: number
): number {
  if (status === 'PAID') {
    return 0;
  }
  const safePaid = Number.isFinite(paidAmount) && paidAmount > 0 ? paidAmount : 0;
  return Math.max(0, Math.round((grandTotal - safePaid) * 100) / 100);
}

export function computeSalesSummary(invoices: Invoice[]): SalesSummary {
  let totalSales = 0;
  let totalDue = 0;
  let paidCount = 0;
  let dueCount = 0;

  for (const inv of invoices) {
    const grandTotal = calculateGrandTotal(inv.items, inv.discount, inv.deliveryCharge);
    const due = calculateDueAmount(grandTotal, inv.status, inv.paidAmount);
    totalSales += grandTotal;
    totalDue += due;
    if (inv.status === 'PAID' || due === 0) {
      paidCount += 1;
    } else {
      dueCount += 1;
    }
  }

  return {
    totalInvoices: invoices.length,
    totalSales: Math.round(totalSales * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    paidCount,
    dueCount,
  };
}

export function generateNextInvoiceNumber(invoices: Invoice[]): string {
  let maxNum = 1000;
  for (const inv of invoices) {
    const match = inv.invoiceNumber.match(/(\d+)$/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  return `INV-${maxNum + 1}`;
}

export function formatTaka(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasDecimals = Math.abs(safe % 1) > 0.001;
  return `৳${safe.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
