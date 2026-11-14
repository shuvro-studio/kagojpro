import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  ImageDown,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import type { Invoice, ShopProfile, VoiceNote } from '../types';
import {
  calculateDueAmount,
  calculateGrandTotal,
  computeSalesSummary,
  formatTaka,
} from '../utils/calculations';
import { downloadReceiptPng } from '../utils/receiptCanvas';
import { filterInvoices, filterNotes } from '../utils/textHelpers';

interface HistoryViewProps {
  invoices: Invoice[];
  notes: VoiceNote[];
  shop: ShopProfile;
  t: TranslationDict;
  onOpenInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateNewInvoice: () => void;
  onOpenNote: (note: VoiceNote) => void;
  onDeleteNote: (id: string) => void;
}

export function HistoryView({
  invoices,
  notes,
  shop,
  t,
  onOpenInvoice,
  onDeleteInvoice,
  onCreateNewInvoice,
  onOpenNote,
  onDeleteNote,
}: HistoryViewProps) {
  const [subTab, setSubTab] = useState<'invoices' | 'notes'>('invoices');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const summary = useMemo(() => computeSalesSummary(invoices), [invoices]);

  const filteredInvoices = useMemo(
    () => filterInvoices(invoices, searchQuery, statusFilter),
    [invoices, searchQuery, statusFilter]
  );

  const filteredNotes = useMemo(
    () => filterNotes(notes, searchQuery),
    [notes, searchQuery]
  );

  const handleCopyNote = async (note: VoiceNote) => {
    const text = `${note.title}\n\n${note.content}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {t.historyTitle}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t.historySubtitle}
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            {t.summaryTotalInvoices}
          </div>
          <div
            data-testid="summary-total-invoices"
            className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-2"
          >
            {summary.totalInvoices}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 tabular-nums">
            <span>
              {summary.paidCount} {t.statusPaid}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {summary.dueCount} {t.statusDue}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            {t.summaryTotalSales}
          </div>
          <div
            data-testid="summary-total-sales"
            className="text-3xl font-bold text-emerald-700 font-mono tabular-nums mt-2"
          >
            {formatTaka(summary.totalSales)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {t.tabAllInvoices}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            {t.summaryTotalDue}
          </div>
          <div
            data-testid="summary-total-due"
            className={`text-3xl font-bold font-mono tabular-nums mt-2 ${
              summary.totalDue > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {formatTaka(summary.totalDue)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {summary.dueCount} {t.filterDue}
          </div>
        </div>
      </div>

      {/* Filter & View Switch Bar */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setSubTab('invoices')}
              className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'invoices'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabAllInvoices} ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('notes')}
              className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'notes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabVoiceNotes} ({notes.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
            <div className="relative flex-1 md:max-w-xs min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchHistoryPlaceholder}
                aria-label={t.searchHistoryPlaceholder}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            {subTab === 'invoices' && (
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['ALL', 'PAID', 'DUE'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === status
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'ALL'
                      ? t.filterAll
                      : status === 'PAID'
                        ? t.filterPaid
                        : t.filterDue}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invoices List */}
        {subTab === 'invoices' ? (
          filteredInvoices.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm text-slate-500">{t.noInvoicesEmpty}</p>
              <button
                type="button"
                onClick={onCreateNewInvoice}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createFirstInvoiceBtn}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const grandTotal = calculateGrandTotal(
                  inv.items,
                  inv.discount,
                  inv.deliveryCharge
                );
                const dueAmount = calculateDueAmount(
                  grandTotal,
                  inv.status,
                  inv.paidAmount
                );
                const isPaid = inv.status === 'PAID' || dueAmount === 0;

                return (
                  <div
                    key={inv.id}
                    className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {inv.invoiceNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {inv.customerName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            isPaid ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{isPaid ? 'PAID' : 'DUE'}</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                        <span>{inv.date}</span>
                        {inv.customerPhone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{inv.customerPhone}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>
                          {inv.items.length} item{inv.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right mr-2">
                        <div className="text-base font-mono font-bold text-slate-900 tabular-nums">
                          {formatTaka(grandTotal)}
                        </div>
                        {!isPaid && (
                          <div className="text-xs font-mono font-semibold text-red-600 tabular-nums">
                            {t.dueAmountLabel}: {formatTaka(dueAmount)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenInvoice(inv)}
                          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{t.openInEditorBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadReceiptPng(inv, shop)}
                          aria-label={`${t.exportPngBtn} ${inv.invoiceNumber}`}
                          className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <ImageDown className="w-3.5 h-3.5" />
                          <span>{t.downloadPngShort}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          aria-label={`${t.deleteConfirm} ${inv.invoiceNumber}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredNotes.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {t.noNotesEmpty}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {note.title}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 tabular-nums">
                    <span>{note.speechLang === 'bn-BD' ? 'বাংলা' : 'English'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.updatedAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenNote(note)}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{t.loadNote}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyNote(note)}
                    aria-label={`${t.actionCopy} '${note.title}'`}
                    className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNoteId === note.id ? t.actionCopied : t.actionCopy}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label={`${t.deleteLabel} '${note.title}'`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
