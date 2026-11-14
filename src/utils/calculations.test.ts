import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDueAmount,
  calculateGrandTotal,
  calculateItemTotal,
  calculateSubtotal,
  computeSalesSummary,
  formatTaka,
  generateNextInvoiceNumber,
} from './calculations';
import type { Invoice, InvoiceItem } from '../types';

test('calculateItemTotal and calculateSubtotal handle standard and edge quantities', () => {
  const items: InvoiceItem[] = [
    { id: '1', name: 'Jamdani Sharee', quantity: 2, unitPrice: 1450 },
    { id: '2', name: 'Packaging Box', quantity: 3, unitPrice: 50 },
    { id: '3', name: 'Invalid Negative', quantity: -2, unitPrice: 100 },
  ];
  assert.equal(calculateItemTotal(2, 1450), 2900);
  assert.equal(calculateItemTotal(-1, 500), 0);
  assert.equal(calculateSubtotal(items), 3050);
});

test('calculateGrandTotal applies discount before adding delivery charge and clamps at zero', () => {
  const items: InvoiceItem[] = [{ id: '1', name: 'Item A', quantity: 1, unitPrice: 500 }];
  assert.equal(calculateGrandTotal(items, 100, 80), 480);
  assert.equal(calculateGrandTotal(items, 900, 80), 80);
});

test('calculateDueAmount returns 0 when PAID and remaining balance when DUE', () => {
  assert.equal(calculateDueAmount(1500, 'PAID', 0), 0);
  assert.equal(calculateDueAmount(1500, 'DUE', 0), 1500);
  assert.equal(calculateDueAmount(1500, 'DUE', 500), 1000);
  assert.equal(calculateDueAmount(1500, 'DUE', 2000), 0);
});

test('computeSalesSummary aggregates total invoices, sales, and due accurately', () => {
  const invoices: Invoice[] = [
    {
      id: 'a',
      invoiceNumber: 'INV-1001',
      date: '2026-11-13',
      customerName: 'Nusrat',
      customerPhone: '01700000001',
      items: [{ id: 'i1', name: 'Sharee', quantity: 1, unitPrice: 2000 }],
      discount: 200,
      deliveryCharge: 100,
      status: 'PAID',
      paidAmount: 1900,
      theme: 'emerald-boutique',
      createdAt: '2026-11-13T10:00:00Z',
      updatedAt: '2026-11-13T10:00:00Z',
    },
    {
      id: 'b',
      invoiceNumber: 'INV-1002',
      date: '2026-11-13',
      customerName: 'Tanvir',
      customerPhone: '01800000002',
      items: [{ id: 'i2', name: 'Printer', quantity: 1, unitPrice: 3000 }],
      discount: 0,
      deliveryCharge: 150,
      status: 'DUE',
      paidAmount: 1000,
      theme: 'thermal',
      createdAt: '2026-11-13T11:00:00Z',
      updatedAt: '2026-11-13T11:00:00Z',
    },
  ];
  const summary = computeSalesSummary(invoices);
  assert.equal(summary.totalInvoices, 2);
  assert.equal(summary.totalSales, 5050);
  assert.equal(summary.totalDue, 2150);
  assert.equal(summary.paidCount, 1);
  assert.equal(summary.dueCount, 1);
});

test('generateNextInvoiceNumber increments highest numeric suffix', () => {
  const emptyNext = generateNextInvoiceNumber([]);
  assert.equal(emptyNext, 'INV-1001');

  const withInvoices = [
    { invoiceNumber: 'INV-1001' } as Invoice,
    { invoiceNumber: 'INV-1007' } as Invoice,
    { invoiceNumber: 'INV-1003' } as Invoice,
  ];
  assert.equal(generateNextInvoiceNumber(withInvoices), 'INV-1008');
});

test('formatTaka formats currency cleanly with Taka symbol', () => {
  assert.equal(formatTaka(1450), '৳1,450');
  assert.equal(formatTaka(0), '৳0');
});
