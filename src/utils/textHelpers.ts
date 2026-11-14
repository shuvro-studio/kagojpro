import type { Invoice, VoiceNote } from '../types';

export interface PunctuationResult {
  text: string;
  caretPosition: number;
}

/**
 * Inserts punctuation or newline cleanly at the current selection range,
 * collapsing trailing spaces immediately before punctuation marks (`।`, `,`, `?`).
 */
export function insertPunctuationAtCursor(
  currentText: string,
  token: string,
  selectionStart: number,
  selectionEnd: number
): PunctuationResult {
  const clampedStart = Math.max(0, Math.min(selectionStart, currentText.length));
  const clampedEnd = Math.max(clampedStart, Math.min(selectionEnd, currentText.length));

  let before = currentText.slice(0, clampedStart);
  const after = currentText.slice(clampedEnd);

  if (token === '\n') {
    const inserted = '\n';
    const nextText = before + inserted + after;
    return {
      text: nextText,
      caretPosition: before.length + inserted.length,
    };
  }

  // Trim trailing horizontal spaces before punctuation mark
  before = before.replace(/[ \t]+$/, '');
  const needsTrailingSpace = after.length === 0 || !/^\s/.test(after);
  const inserted = needsTrailingSpace ? `${token} ` : token;
  const nextText = before + inserted + after;

  return {
    text: nextText,
    caretPosition: before.length + inserted.length,
  };
}

export function deriveNoteTitle(explicitTitle: string, content: string): string {
  const trimmedTitle = explicitTitle.trim();
  if (trimmedTitle.length > 0) {
    return trimmedTitle;
  }
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) {
    return 'Untitled Memo';
  }
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function filterNotes(notes: VoiceNote[], query: string): VoiceNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
  );
}

export function filterInvoices(
  invoices: Invoice[],
  query: string,
  statusFilter: 'ALL' | 'PAID' | 'DUE'
): Invoice[] {
  const q = query.trim().toLowerCase();
  return invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    const itemMatch = inv.items.some((item) => item.name.toLowerCase().includes(q));
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.toLowerCase().includes(q) ||
      itemMatch
    );
  });
}
