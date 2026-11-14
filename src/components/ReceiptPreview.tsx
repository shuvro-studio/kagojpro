import type { TranslationDict } from '../i18n/translations';
import type { Invoice, ShopProfile } from '../types';
import {
  calculateDueAmount,
  calculateGrandTotal,
  calculateItemTotal,
  calculateSubtotal,
  formatTaka,
} from '../utils/calculations';

interface ReceiptPreviewProps {
  invoice: Invoice;
  shop: ShopProfile;
  t: TranslationDict;
  isPrintTarget?: boolean;
}

export function ReceiptPreview({
  invoice,
  shop,
  t,
  isPrintTarget = false,
}: ReceiptPreviewProps) {
  const subtotal = calculateSubtotal(invoice.items);
  const grandTotal = calculateGrandTotal(
    invoice.items,
    invoice.discount,
    invoice.deliveryCharge
  );
  const dueAmount = calculateDueAmount(grandTotal, invoice.status, invoice.paidAmount);
  const isPaid = invoice.status === 'PAID' || dueAmount === 0;
  const theme = invoice.theme;

  if (theme === 'thermal') {
    return (
      <div
        data-testid="receipt-preview"
        data-theme={theme}
        className={`mx-auto w-full max-w-[360px] bg-white text-slate-900 border border-slate-200 shadow-sm rounded-lg overflow-hidden font-mono ${
          isPrintTarget ? 'print-only-container' : ''
        }`}
      >
        <div className="px-6 py-6 text-center border-b border-dashed border-slate-300">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 break-words">
            {shop.shopName || 'Shop Name'}
          </h3>
          {shop.tagline && (
            <p className="text-[11px] text-slate-600 mt-1">{shop.tagline}</p>
          )}
          {shop.address && (
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              {shop.address}
            </p>
          )}
          {shop.phone && (
            <p className="text-[11px] text-slate-700 mt-1 tabular-nums">
              Tel: {shop.phone}
            </p>
          )}
          {shop.stampText.trim() && (
            <div className="mt-3 inline-block border border-slate-900 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-900">
              {shop.stampText.trim()}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-dashed border-slate-300 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">{t.receiptNo}:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">{t.receiptDate}:</span>
            <span className="text-slate-800 tabular-nums">{invoice.date}</span>
          </div>
          <div className="flex items-start justify-between gap-2 pt-1">
            <span className="text-slate-500 shrink-0">{t.receiptBillTo}:</span>
            <div className="text-right">
              <div className="font-semibold text-slate-900">
                {invoice.customerName || 'Walk-in Customer'}
              </div>
              {invoice.customerPhone && (
                <div className="text-slate-600 tabular-nums">
                  {invoice.customerPhone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-dashed border-slate-300">
          <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-4 text-right">Amount</span>
          </div>
          <div className="divide-y divide-slate-100">
            {invoice.items.map((item) => {
              const rowTotal = calculateItemTotal(item.quantity, item.unitPrice);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 py-2 text-xs items-start gap-1"
                >
                  <div className="col-span-6 text-slate-900 break-words leading-snug">
                    <div>{item.name || 'Item'}</div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      @ {formatTaka(item.unitPrice)}
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-slate-700 tabular-nums">
                    {item.quantity}
                  </div>
                  <div className="col-span-4 text-right font-semibold text-slate-900 tabular-nums">
                    {formatTaka(rowTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t.subtotalLabel}</span>
            <span className="tabular-nums">{formatTaka(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t.discountLabel}</span>
            <span className="tabular-nums">-{formatTaka(invoice.discount || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t.deliveryChargeLabel}</span>
            <span className="tabular-nums">{formatTaka(invoice.deliveryCharge || 0)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-dashed border-slate-300 flex justify-between items-baseline text-sm font-bold text-slate-900">
            <span>{t.grandTotalLabel}</span>
            <span className="text-base tabular-nums">{formatTaka(grandTotal)}</span>
          </div>
          {!isPaid && (
            <>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>{t.paidAmountLabel}</span>
                <span className="tabular-nums">{formatTaka(invoice.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-red-700 font-bold">
                <span>{t.dueAmountLabel}</span>
                <span className="tabular-nums">{formatTaka(dueAmount)}</span>
              </div>
            </>
          )}
          <div className="pt-3 flex items-center justify-between">
            <span
              className={`inline-block border-2 px-2.5 py-0.5 text-[11px] font-bold tracking-widest ${
                isPaid
                  ? 'border-emerald-700 text-emerald-700 bg-emerald-50'
                  : 'border-red-700 text-red-700 bg-red-50'
              }`}
            >
              {isPaid ? 'PAID' : 'DUE'}
            </span>
            <span className="text-[10px] text-slate-500">KagojPro POS</span>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-500">
          {t.receiptFooterNote}
        </div>
      </div>
    );
  }

  const isBlue = theme === 'modern-blue';
  const headerBgClass = isBlue ? 'bg-slate-900' : 'bg-emerald-900';
  const subTextClass = isBlue ? 'text-slate-300' : 'text-emerald-200';
  const tableHeadBgClass = isBlue ? 'bg-blue-50/80 text-slate-900' : 'bg-emerald-50/80 text-emerald-950';
  const accentTextClass = isBlue ? 'text-blue-700' : 'text-emerald-700';
  const borderClass = isBlue ? 'border-slate-200' : 'border-emerald-100';

  return (
    <div
      data-testid="receipt-preview"
      data-theme={theme}
      className={`w-full bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl overflow-hidden ${
        isPrintTarget ? 'print-only-container' : ''
      }`}
    >
      <div className={`${headerBgClass} text-white px-6 py-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold tracking-tight break-words">
              {shop.shopName || 'Shop Name'}
            </h3>
            {shop.tagline && (
              <p className={`text-xs mt-1 ${subTextClass}`}>{shop.tagline}</p>
            )}
            <div className={`text-xs mt-3 space-y-0.5 ${subTextClass}`}>
              {shop.address && <p>{shop.address}</p>}
              {shop.phone && <p className="font-mono tabular-nums">{shop.phone}</p>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-white/90">
              {t.receiptMemoTitle}
            </div>
            {shop.stampText.trim() && (
              <div className="mt-2 inline-block border border-white/40 px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider uppercase text-white/95">
                {shop.stampText.trim()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`px-6 py-4 border-b ${borderClass} grid grid-cols-2 gap-4 text-xs`}>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t.receiptBillTo}
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 break-words">
            {invoice.customerName || 'Walk-in Customer'}
          </div>
          {invoice.customerPhone && (
            <div className="font-mono text-slate-600 mt-0.5 tabular-nums">
              {invoice.customerPhone}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t.receiptNo}
          </div>
          <div className="text-sm font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {invoice.invoiceNumber}
          </div>
          <div className="font-mono text-slate-600 mt-0.5 tabular-nums">
            {invoice.date}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className={`grid grid-cols-12 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider ${tableHeadBgClass}`}>
          <span className="col-span-5">{t.itemNameCol}</span>
          <span className="col-span-2 text-right">{t.itemQtyCol}</span>
          <span className="col-span-2 text-right">Rate</span>
          <span className="col-span-3 text-right">{t.itemTotalCol}</span>
        </div>

        <div className={`divide-y ${borderClass}`}>
          {invoice.items.map((item) => {
            const rowTotal = calculateItemTotal(item.quantity, item.unitPrice);
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 px-3 py-2.5 text-xs items-center gap-1"
              >
                <div className="col-span-5 font-medium text-slate-900 break-words">
                  {item.name || 'Item'}
                </div>
                <div className="col-span-2 text-right font-mono text-slate-600 tabular-nums">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right font-mono text-slate-600 tabular-nums">
                  {formatTaka(item.unitPrice)}
                </div>
                <div className="col-span-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  {formatTaka(rowTotal)}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-4 pt-4 border-t ${borderClass} flex flex-wrap items-start justify-between gap-4`}>
          <div className="pt-1">
            <span
              className={`inline-block border-2 px-3 py-1 text-xs font-mono font-bold tracking-widest ${
                isPaid
                  ? 'border-emerald-700 text-emerald-700 bg-emerald-50'
                  : 'border-red-700 text-red-700 bg-red-50'
              }`}
            >
              {isPaid ? 'PAID' : 'DUE'}
            </span>
          </div>

          <div className="w-full max-w-[230px] ml-auto space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t.subtotalLabel}</span>
              <span className="font-mono tabular-nums">{formatTaka(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t.discountLabel}</span>
              <span className="font-mono tabular-nums">-{formatTaka(invoice.discount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t.deliveryChargeLabel}</span>
              <span className="font-mono tabular-nums">{formatTaka(invoice.deliveryCharge || 0)}</span>
            </div>
            <div className={`pt-2 border-t ${borderClass} flex justify-between items-baseline text-sm font-bold`}>
              <span className="text-slate-900">{t.grandTotalLabel}</span>
              <span className={`font-mono text-base tabular-nums ${accentTextClass}`}>
                {formatTaka(grandTotal)}
              </span>
            </div>
            {!isPaid && (
              <>
                <div className="flex justify-between text-slate-600 pt-0.5">
                  <span>{t.paidAmountLabel}</span>
                  <span className="font-mono tabular-nums">{formatTaka(invoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-red-700 font-bold">
                  <span>{t.dueAmountLabel}</span>
                  <span className="font-mono tabular-nums">{formatTaka(dueAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <span>{t.receiptFooterNote}</span>
        <span className="font-mono">KagojPro</span>
      </div>
    </div>
  );
}
