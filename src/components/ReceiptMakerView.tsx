import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FilePlus2,
  ImageDown,
  Plus,
  Printer,
  Save,
  Share2,
  Store,
  Trash2,
} from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import type { Invoice, InvoiceItem, ReceiptTheme, ShopProfile } from '../types';
import {
  calculateDueAmount,
  calculateGrandTotal,
  calculateItemTotal,
  calculateSubtotal,
  formatTaka,
} from '../utils/calculations';
import { downloadReceiptPng } from '../utils/receiptCanvas';
import { ReceiptPreview } from './ReceiptPreview';

interface ReceiptMakerViewProps {
  draftInvoice: Invoice;
  isEditingExisting: boolean;
  shop: ShopProfile;
  t: TranslationDict;
  onUpdateDraft: (next: Invoice) => void;
  onUpdateShop: (next: ShopProfile) => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onResetNewInvoice: () => void;
  onPrintReceipt: () => void;
}

const THEMES: ReceiptTheme[] = ['thermal', 'modern-blue', 'emerald-boutique'];

export function ReceiptMakerView({
  draftInvoice,
  isEditingExisting,
  shop,
  t,
  onUpdateDraft,
  onUpdateShop,
  onSaveInvoice,
  onResetNewInvoice,
  onPrintReceipt,
}: ReceiptMakerViewProps) {
  const [shopExpanded, setShopExpanded] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const subtotal = calculateSubtotal(draftInvoice.items);
  const grandTotal = calculateGrandTotal(
    draftInvoice.items,
    draftInvoice.discount,
    draftInvoice.deliveryCharge
  );
  const dueAmount = calculateDueAmount(
    grandTotal,
    draftInvoice.status,
    draftInvoice.paidAmount
  );

  const updateItem = (
    itemId: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setValidationError(null);
    const nextItems = draftInvoice.items.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    onUpdateDraft({ ...draftInvoice, items: nextItems });
  };

  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      quantity: 1,
      unitPrice: 0,
    };
    onUpdateDraft({
      ...draftInvoice,
      items: [...draftInvoice.items, newItem],
    });
  };

  const removeItemRow = (itemId: string) => {
    if (draftInvoice.items.length <= 1) return;
    onUpdateDraft({
      ...draftInvoice,
      items: draftInvoice.items.filter((i) => i.id !== itemId),
    });
  };

  const handleSave = () => {
    if (!draftInvoice.customerName.trim()) {
      setValidationError(t.validationMissingCustomer);
      return;
    }
    const validItems = draftInvoice.items.filter((i) => i.name.trim().length > 0);
    if (validItems.length === 0) {
      setValidationError(t.validationMissingItems);
      return;
    }

    setValidationError(null);
    const now = new Date().toISOString();
    const cleanedInvoice: Invoice = {
      ...draftInvoice,
      customerName: draftInvoice.customerName.trim(),
      customerPhone: draftInvoice.customerPhone.trim(),
      items: validItems,
      paidAmount:
        draftInvoice.status === 'PAID'
          ? grandTotal
          : Math.max(0, Math.min(grandTotal, draftInvoice.paidAmount || 0)),
      updatedAt: now,
    };
    onSaveInvoice(cleanedInvoice);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  const whatsappText = [
    `*${shop.shopName || 'KagojPro'}*`,
    `${t.receiptNo}: ${draftInvoice.invoiceNumber} · ${draftInvoice.date}`,
    `${t.receiptBillTo}: ${draftInvoice.customerName || 'Customer'}${
      draftInvoice.customerPhone ? ` (${draftInvoice.customerPhone})` : ''
    }`,
    '---',
    ...draftInvoice.items
      .filter((i) => i.name.trim())
      .map(
        (i) =>
          `• ${i.name} (${i.quantity} × ${formatTaka(i.unitPrice)}) = ${formatTaka(
            calculateItemTotal(i.quantity, i.unitPrice)
          )}`
      ),
    '---',
    `${t.grandTotalLabel}: *${formatTaka(grandTotal)}*`,
    `Status: *${draftInvoice.status}*${
      draftInvoice.status === 'DUE' ? ` (${t.dueAmountLabel}: ${formatTaka(dueAmount)})` : ''
    }`,
  ].join('\n');

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.receiptTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t.receiptSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setValidationError(null);
            onResetNewInvoice();
          }}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>{t.newInvoiceBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="xl:col-span-7 space-y-5">
          {/* Collapsible Shop Header Settings */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShopExpanded((prev) => !prev)}
              aria-expanded={shopExpanded}
              className="w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Store className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {shop.shopName || t.shopSettingsToggle}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {t.shopSettingsToggle} · {t.shopSavedIndicator}
                  </div>
                </div>
              </div>
              {shopExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {shopExpanded && (
              <div className="px-5 pb-5 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-name"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.shopNameLabel}
                  </label>
                  <input
                    id="shop-name"
                    type="text"
                    value={shop.shopName}
                    onChange={(e) =>
                      onUpdateShop({ ...shop, shopName: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-tagline"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.shopTaglineLabel}
                  </label>
                  <input
                    id="shop-tagline"
                    type="text"
                    value={shop.tagline}
                    onChange={(e) =>
                      onUpdateShop({ ...shop, tagline: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-phone"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.shopPhoneLabel}
                  </label>
                  <input
                    id="shop-phone"
                    type="text"
                    value={shop.phone}
                    onChange={(e) =>
                      onUpdateShop({ ...shop, phone: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-stamp"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.shopStampLabel}
                  </label>
                  <input
                    id="shop-stamp"
                    type="text"
                    value={shop.stampText}
                    onChange={(e) =>
                      onUpdateShop({ ...shop, stampText: e.target.value })
                    }
                    placeholder={t.shopStampPlaceholder}
                    className="w-full min-h-[44px] px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="shop-address"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.shopAddressLabel}
                  </label>
                  <input
                    id="shop-address"
                    type="text"
                    value={shop.address}
                    onChange={(e) =>
                      onUpdateShop({ ...shop, address: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Customer & Invoice Metadata */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              {t.customerSectionTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.customerNameLabel}
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={draftInvoice.customerName}
                  onChange={(e) => {
                    setValidationError(null);
                    onUpdateDraft({ ...draftInvoice, customerName: e.target.value });
                  }}
                  placeholder={t.customerNamePlaceholder}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label
                  htmlFor="customer-phone"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.customerPhoneLabel}
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={draftInvoice.customerPhone}
                  onChange={(e) =>
                    onUpdateDraft({ ...draftInvoice, customerPhone: e.target.value })
                  }
                  placeholder={t.customerPhonePlaceholder}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label
                  htmlFor="invoice-number"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.invoiceNumberLabel}
                </label>
                <input
                  id="invoice-number"
                  type="text"
                  value={draftInvoice.invoiceNumber}
                  onChange={(e) =>
                    onUpdateDraft({ ...draftInvoice, invoiceNumber: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
              <div>
                <label
                  htmlFor="invoice-date"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.invoiceDateLabel}
                </label>
                <input
                  id="invoice-date"
                  type="date"
                  value={draftInvoice.date}
                  onChange={(e) =>
                    onUpdateDraft({ ...draftInvoice, date: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </section>

          {/* Dynamic Item Rows */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                {t.itemsSectionTitle}
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addItemBtn}</span>
              </button>
            </div>

            <div className="space-y-3">
              {draftInvoice.items.map((item, idx) => {
                const rowTotal = calculateItemTotal(item.quantity, item.unitPrice);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2.5 items-end pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label
                        htmlFor={`item-name-${item.id}`}
                        className="block text-[11px] font-medium text-slate-500 mb-1"
                      >
                        {t.itemNameCol}
                      </label>
                      <input
                        id={`item-name-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, 'name', e.target.value)
                        }
                        placeholder={t.itemNamePlaceholder}
                        className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label
                        htmlFor={`item-qty-${item.id}`}
                        className="block text-[11px] font-medium text-slate-500 mb-1"
                      >
                        {t.itemQtyCol}
                      </label>
                      <input
                        id={`item-qty-${item.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            'quantity',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full min-h-[44px] px-2.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label
                        htmlFor={`item-price-${item.id}`}
                        className="block text-[11px] font-medium text-slate-500 mb-1"
                      >
                        {t.itemPriceCol}
                      </label>
                      <input
                        id={`item-price-${item.id}`}
                        type="number"
                        min={0}
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            'unitPrice',
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full min-h-[44px] px-2.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5 min-h-[44px]">
                      <span className="text-xs sm:text-sm font-mono font-semibold text-slate-900 tabular-nums truncate">
                        {formatTaka(rowTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        disabled={draftInvoice.items.length <= 1}
                        aria-label={`${t.removeItemLabel} ${idx + 1}`}
                        className="min-h-[40px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Payment & Totals */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              {t.totalsSectionTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="invoice-discount"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.discountLabel}
                </label>
                <input
                  id="invoice-discount"
                  type="number"
                  min={0}
                  value={draftInvoice.discount}
                  onChange={(e) =>
                    onUpdateDraft({
                      ...draftInvoice,
                      discount: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label
                  htmlFor="invoice-delivery"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.deliveryChargeLabel}
                </label>
                <input
                  id="invoice-delivery"
                  type="number"
                  min={0}
                  value={draftInvoice.deliveryCharge}
                  onChange={(e) =>
                    onUpdateDraft({
                      ...draftInvoice,
                      deliveryCharge: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1.5">
                  {t.paymentStatusLabel}
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateDraft({
                        ...draftInvoice,
                        status: 'PAID',
                        paidAmount: grandTotal,
                      })
                    }
                    className={`min-h-[40px] px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      draftInvoice.status === 'PAID'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.statusPaid}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateDraft({
                        ...draftInvoice,
                        status: 'DUE',
                        paidAmount:
                          draftInvoice.status === 'PAID'
                            ? 0
                            : draftInvoice.paidAmount,
                      })
                    }
                    className={`min-h-[40px] px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      draftInvoice.status === 'DUE'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.statusDue}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">
                  {t.subtotalLabel}:{' '}
                  <span className="font-mono tabular-nums">
                    {formatTaka(subtotal)}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                  {t.grandTotalLabel}: {formatTaka(grandTotal)}
                </div>
              </div>
            </div>

            {draftInvoice.status === 'DUE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 items-end">
                <div>
                  <label
                    htmlFor="invoice-paid-amount"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.paidAmountLabel}
                  </label>
                  <input
                    id="invoice-paid-amount"
                    type="number"
                    min={0}
                    max={grandTotal}
                    value={draftInvoice.paidAmount}
                    onChange={(e) =>
                      onUpdateDraft({
                        ...draftInvoice,
                        paidAmount: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 min-h-[44px] px-3.5 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-xs font-semibold text-red-800">
                    {t.dueAmountLabel}:
                  </span>
                  <span className="text-base font-mono font-bold text-red-700 tabular-nums">
                    {formatTaka(dueAmount)}
                  </span>
                </div>
              </div>
            )}

            {validationError && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-800"
              >
                {validationError}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isEditingExisting ? t.updateInvoiceBtn : t.saveInvoiceBtn}
                </span>
              </button>

              {savedToast && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Check className="w-4 h-4" />
                  {t.invoiceSavedToast}
                </span>
              )}
            </div>
          </section>
        </div>

        {/* Right Live Preview & Export Column */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {t.themeSectionTitle}
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
                {THEMES.map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() =>
                      onUpdateDraft({ ...draftInvoice, theme: themeKey })
                    }
                    className={`flex-1 min-w-fit min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-center whitespace-nowrap cursor-pointer ${
                      draftInvoice.theme === themeKey
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.themeNames[themeKey]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadReceiptPng(draftInvoice, shop)}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <ImageDown className="w-4 h-4 shrink-0" />
                <span>{t.exportPngBtn}</span>
              </button>

              <button
                type="button"
                onClick={onPrintReceipt}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>{t.printPdfBtn}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{t.shareWhatsAppBtn}</span>
              </a>
            </div>
          </section>

          <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.previewHeading}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500">
                <Download className="w-3.5 h-3.5" />
                <span>{draftInvoice.invoiceNumber}</span>
              </span>
            </div>
            <ReceiptPreview invoice={draftInvoice} shop={shop} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
