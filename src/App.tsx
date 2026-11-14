import { useEffect, useState } from 'react';
import { History, Mic, ReceiptText } from 'lucide-react';
import { HistoryView } from './components/HistoryView';
import { ReceiptMakerView } from './components/ReceiptMakerView';
import { ReceiptPreview } from './components/ReceiptPreview';
import { VoiceMemoView } from './components/VoiceMemoView';
import { TRANSLATIONS } from './i18n/translations';
import type { AppTab, Invoice, ShopProfile, UiLang, VoiceNote } from './types';
import { generateNextInvoiceNumber } from './utils/calculations';
import {
  loadInvoices,
  loadShopProfile,
  loadUiLang,
  loadVoiceNotes,
  saveInvoices,
  saveShopProfile,
  saveUiLang,
  saveVoiceNotes,
} from './utils/storage';

function createBlankDraftInvoice(existingInvoices: Invoice[]): Invoice {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  return {
    id: `inv-${Date.now()}`,
    invoiceNumber: generateNextInvoiceNumber(existingInvoices),
    date: today,
    customerName: '',
    customerPhone: '',
    items: [
      {
        id: `item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 0,
      },
    ],
    discount: 0,
    deliveryCharge: 0,
    status: 'PAID',
    paidAmount: 0,
    theme: 'emerald-boutique',
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('voice');
  const [uiLang, setUiLang] = useState<UiLang>(() => loadUiLang());
  const [notes, setNotes] = useState<VoiceNote[]>(() => loadVoiceNotes());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [shop, setShop] = useState<ShopProfile>(() => loadShopProfile());

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const initial = loadVoiceNotes();
    return initial[0]?.id ?? null;
  });

  const [draftInvoice, setDraftInvoice] = useState<Invoice>(() =>
    createBlankDraftInvoice(loadInvoices())
  );
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [printMode, setPrintMode] = useState<
    { type: 'receipt' } | { type: 'note'; title: string; content: string } | null
  >(null);

  const t = TRANSLATIONS[uiLang];

  useEffect(() => {
    saveUiLang(uiLang);
  }, [uiLang]);

  useEffect(() => {
    saveVoiceNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveShopProfile(shop);
  }, [shop]);

  useEffect(() => {
    if (!printMode) return;
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    const frameId = requestAnimationFrame(() => {
      window.print();
    });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMode]);

  const handleSaveNote = (saved: VoiceNote) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === saved.id);
      if (exists) {
        return prev.map((n) => (n.id === saved.id ? saved : n));
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === invoice.id);
      if (exists) {
        return prev.map((inv) => (inv.id === invoice.id ? invoice : inv));
      }
      return [invoice, ...prev];
    });
    setEditingInvoiceId(invoice.id);
    setDraftInvoice(invoice);
  };

  const handleResetNewInvoice = () => {
    setEditingInvoiceId(null);
    setDraftInvoice(createBlankDraftInvoice(invoices));
  };

  const handleOpenInvoiceFromHistory = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setDraftInvoice({
      ...invoice,
      items: invoice.items.map((item) => ({ ...item })),
    });
    setActiveTab('receipt');
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (editingInvoiceId === id) {
      setEditingInvoiceId(null);
    }
  };

  const handleOpenNoteFromHistory = (note: VoiceNote) => {
    setActiveNoteId(note.id);
    setActiveTab('voice');
  };

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: typeof Mic;
  }> = [
    { id: 'voice', label: t.navVoice, icon: Mic },
    { id: 'receipt', label: t.navReceipt, icon: ReceiptText },
    { id: 'history', label: t.navHistory, icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Dedicated Print-Only Area */}
      {printMode && (
        <div className="hidden print:block p-2">
          {printMode.type === 'receipt' ? (
            <ReceiptPreview
              invoice={draftInvoice}
              shop={shop}
              t={t}
              isPrintTarget
            />
          ) : (
            <article className="print-only-container max-w-2xl mx-auto p-6 bg-white text-slate-900">
              <h1 className="text-xl font-bold pb-3 border-b border-slate-200">
                {printMode.title}
              </h1>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed">
                {printMode.content}
              </p>
            </article>
          )}
        </div>
      )}

      <div className="no-print flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[268px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white border-r border-slate-200">
          <div className="px-6 py-6 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                ক
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-tight text-slate-900 truncate">
                  {t.appName}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {t.appSubtitle}
                </div>
              </div>
            </div>
          </div>

          <nav aria-label="Main navigation" className="flex-1 p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Language Toggle in Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <div className="text-xs font-medium text-slate-500 px-1">
              {t.uiLanguageLabel}
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setUiLang('bn')}
                className={`min-h-[38px] px-2 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  uiLang === 'bn'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setUiLang('en')}
                className={`min-h-[38px] px-2 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  uiLang === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Compact Top Bar (52px) */}
          <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ক
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
                {t.appName}
              </span>
            </div>

            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setUiLang('bn')}
                className={`min-h-[34px] px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  uiLang === 'bn'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setUiLang('en')}
                className={`min-h-[34px] px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  uiLang === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                EN
              </button>
            </div>
          </header>

          {/* Main Workspace */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
            {activeTab === 'voice' && (
              <VoiceMemoView
                notes={notes}
                t={t}
                activeNoteId={activeNoteId}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                onSelectNote={(note) => setActiveNoteId(note?.id ?? null)}
                onPrintNote={(title, content) =>
                  setPrintMode({ type: 'note', title, content })
                }
              />
            )}

            {activeTab === 'receipt' && (
              <ReceiptMakerView
                draftInvoice={draftInvoice}
                isEditingExisting={editingInvoiceId !== null}
                shop={shop}
                t={t}
                onUpdateDraft={setDraftInvoice}
                onUpdateShop={setShop}
                onSaveInvoice={handleSaveInvoice}
                onResetNewInvoice={handleResetNewInvoice}
                onPrintReceipt={() => setPrintMode({ type: 'receipt' })}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                invoices={invoices}
                notes={notes}
                shop={shop}
                t={t}
                onOpenInvoice={handleOpenInvoiceFromHistory}
                onDeleteInvoice={handleDeleteInvoice}
                onCreateNewInvoice={() => {
                  handleResetNewInvoice();
                  setActiveTab('receipt');
                }}
                onOpenNote={handleOpenNoteFromHistory}
                onDeleteNote={handleDeleteNote}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar (60px -> total sticky height 112px <= 15% of 844px) */}
          <nav
            aria-label="Mobile navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center px-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold leading-tight truncate max-w-full px-1">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
