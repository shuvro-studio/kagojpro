import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { History, LogOut, Mic, ReceiptText } from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { HistoryView } from './components/HistoryView';
import { ReceiptMakerView } from './components/ReceiptMakerView';
import { ReceiptPreview } from './components/ReceiptPreview';
import { VoiceMemoView } from './components/VoiceMemoView';
import { auth } from './firebase';
import { TRANSLATIONS } from './i18n/translations';
import {
  deleteUserInvoice,
  deleteUserNote,
  ensureUserAccountDoc,
  saveUserShopProfile,
  subscribeUserInvoices,
  subscribeUserNotes,
  subscribeUserShopProfile,
  upsertUserInvoice,
  upsertUserNote,
} from './services/accountData';
import type { AppTab, Invoice, ShopProfile, UiLang, VoiceNote } from './types';
import { generateNextInvoiceNumber } from './utils/calculations';
import { DEFAULT_SHOP_PROFILE, loadUiLang, saveUiLang } from './utils/storage';

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
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('voice');
  const [uiLang, setUiLang] = useState<UiLang>(() => loadUiLang());
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shop, setShop] = useState<ShopProfile>(DEFAULT_SHOP_PROFILE);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftInvoice, setDraftInvoice] = useState<Invoice>(() =>
    createBlankDraftInvoice([])
  );
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [printMode, setPrintMode] = useState<
    { type: 'receipt' } | { type: 'note'; title: string; content: string } | null
  >(null);

  const shopSaveTimerRef = useRef<number | null>(null);
  const t = TRANSLATIONS[uiLang];

  useEffect(() => {
    saveUiLang(uiLang);
  }, [uiLang]);

  // Listen to Firebase Auth state changes and reset per-user state cleanly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (!user) {
        setNotes([]);
        setInvoices([]);
        setShop(DEFAULT_SHOP_PROFILE);
        setActiveNoteId(null);
        setEditingInvoiceId(null);
        setDraftInvoice(createBlankDraftInvoice([]));
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe strictly to the authenticated user's Firestore data
  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    const uid = currentUser.uid;
    let unsubNotes: (() => void) | undefined;
    let unsubInvoices: (() => void) | undefined;
    let unsubShop: (() => void) | undefined;
    let cancelled = false;

    void ensureUserAccountDoc(currentUser).then(() => {
      if (cancelled) return;
      unsubNotes = subscribeUserNotes(uid, (loadedNotes) => {
        setNotes(loadedNotes);
      });
      unsubInvoices = subscribeUserInvoices(uid, (loadedInvoices) => {
        setInvoices(loadedInvoices);
        setDraftInvoice((prev) => {
          // Keep draft invoice number in sync when creating a fresh blank invoice
          if (!prev.customerName && prev.items.length === 1 && !prev.items[0].name) {
            return {
              ...prev,
              invoiceNumber: generateNextInvoiceNumber(loadedInvoices),
            };
          }
          return prev;
        });
      });
      unsubShop = subscribeUserShopProfile(uid, (loadedProfile) => {
        setShop(loadedProfile);
      });
    });

    return () => {
      cancelled = true;
      unsubNotes?.();
      unsubInvoices?.();
      unsubShop?.();
      if (shopSaveTimerRef.current) {
        window.clearTimeout(shopSaveTimerRef.current);
      }
    };
  }, [authReady, currentUser]);

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

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-sm font-medium text-slate-600">{t.authLoading}</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGate
        t={t}
        uiLang={uiLang}
        onChangeUiLang={setUiLang}
      />
    );
  }

  const uid = currentUser.uid;
  const userLabel =
    currentUser.displayName || currentUser.email || 'KagojPro User';

  const handleSaveNote = (saved: VoiceNote) => {
    const isExisting = notes.some((n) => n.id === saved.id);
    setNotes((prev) =>
      isExisting
        ? prev.map((n) => (n.id === saved.id ? saved : n))
        : [saved, ...prev]
    );
    void upsertUserNote(uid, saved, isExisting);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    void deleteUserNote(uid, id);
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    const isExisting = invoices.some((inv) => inv.id === invoice.id);
    setInvoices((prev) =>
      isExisting
        ? prev.map((inv) => (inv.id === invoice.id ? invoice : inv))
        : [invoice, ...prev]
    );
    setEditingInvoiceId(invoice.id);
    setDraftInvoice(invoice);
    void upsertUserInvoice(uid, invoice, isExisting);
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
    void deleteUserInvoice(uid, id);
  };

  const handleUpdateShop = (nextShop: ShopProfile) => {
    setShop(nextShop);
    if (shopSaveTimerRef.current) {
      window.clearTimeout(shopSaveTimerRef.current);
    }
    shopSaveTimerRef.current = window.setTimeout(() => {
      void saveUserShopProfile(uid, nextShop);
    }, 500);
  };

  const handleOpenNoteFromHistory = (note: VoiceNote) => {
    setActiveNoteId(note.id);
    setActiveTab('voice');
  };

  const handleSignOut = async () => {
    await signOut(auth);
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

          {/* Language Toggle + Account Card in Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 space-y-4">
            <div className="space-y-1.5">
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

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="px-1">
                <div className="text-[11px] text-slate-500">{t.authSignedInAs}</div>
                <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                  {userLabel}
                </div>
                {currentUser.email && currentUser.displayName && (
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {currentUser.email}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.authSignOutBtn}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Compact Top Bar (52px) */}
          <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ক
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
                {t.appName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUiLang('bn')}
                  className={`min-h-[34px] px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
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
                  className={`min-h-[34px] px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    uiLang === 'en'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label={t.authSignOutBtn}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
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
                onUpdateShop={handleUpdateShop}
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
