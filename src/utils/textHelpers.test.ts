import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  deriveNoteTitle,
  filterInvoices,
  filterNotes,
  insertPunctuationAtCursor,
} from './textHelpers';
import type { Invoice, VoiceNote } from '../types';

test('insertPunctuationAtCursor removes trailing spaces before punctuation and places caret cleanly', () => {
  const res = insertPunctuationAtCursor('আজকে দোকানে নতুন মাল এসেছে   ', '।', 29, 29);
  assert.equal(res.text, 'আজকে দোকানে নতুন মাল এসেছে। ');
  assert.equal(res.caretPosition, res.text.length);
});

test('insertPunctuationAtCursor inserts newline without stripping mid-text spacing unexpectedly', () => {
  const res = insertPunctuationAtCursor('প্রথম লাইনদ্বিতীয় লাইন', '\n', 10, 10);
  assert.equal(res.text, 'প্রথম লাইন\nদ্বিতীয় লাইন');
  assert.equal(res.caretPosition, 11);
});

test('deriveNoteTitle falls back to truncated first line when title is blank', () => {
  assert.equal(deriveNoteTitle('  দৈনিক হিসাব  ', 'কন্টেন্ট'), 'দৈনিক হিসাব');
  assert.equal(deriveNoteTitle('', 'মিরপুর ডেলিভারি\nবাকি হিসাব'), 'মিরপুর ডেলিভারি');
  assert.equal(deriveNoteTitle('', ''), 'Untitled Memo');
});

test('countWords handles empty and multilingual text', () => {
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('আজকে ৫টি পার্সেল পাঠানো হয়েছে'), 5);
});

test('filterNotes and filterInvoices match case-insensitively across fields', () => {
  const notes: VoiceNote[] = [
    {
      id: 'n1',
      title: 'Stock List',
      content: '১০টি পাঞ্জাবি স্টকে আছে',
      speechLang: 'bn-BD',
      createdAt: '',
      updatedAt: '',
    },
  ];
  assert.equal(filterNotes(notes, 'পাঞ্জাবি').length, 1);
  assert.equal(filterNotes(notes, 'missing').length, 0);

  const invoices: Invoice[] = [
    {
      id: 'i1',
      invoiceNumber: 'INV-1001',
      date: '2026-11-13',
      customerName: 'Nusrat Jahan',
      customerPhone: '01715842910',
      items: [{ id: '1', name: 'Jamdani Sharee', quantity: 1, unitPrice: 2800 }],
      discount: 0,
      deliveryCharge: 80,
      status: 'PAID',
      paidAmount: 2880,
      theme: 'emerald-boutique',
      createdAt: '',
      updatedAt: '',
    },
  ];
  assert.equal(filterInvoices(invoices, 'nusrat', 'ALL').length, 1);
  assert.equal(filterInvoices(invoices, 'nusrat', 'DUE').length, 0);
  assert.equal(filterInvoices(invoices, 'jamdani', 'PAID').length, 1);
});
