import type { Invoice, ShopProfile } from '../types';
import {
  calculateDueAmount,
  calculateGrandTotal,
  calculateItemTotal,
  calculateSubtotal,
  formatTaka,
} from './calculations';

interface ThemePalette {
  bg: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  border: string;
  fontPrimary: string;
  fontMono: string;
  isThermal: boolean;
}

function getThemePalette(theme: Invoice['theme']): ThemePalette {
  if (theme === 'thermal') {
    return {
      bg: '#FFFFFF',
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      headerSub: '#475569',
      accent: '#0F172A',
      accentSoft: '#F1F5F9',
      text: '#0F172A',
      muted: '#475569',
      border: '#CBD5E1',
      fontPrimary: '"JetBrains Mono", "Hind Siliguri", monospace',
      fontMono: '"JetBrains Mono", monospace',
      isThermal: true,
    };
  }
  if (theme === 'modern-blue') {
    return {
      bg: '#FFFFFF',
      headerBg: '#0F172A',
      headerText: '#FFFFFF',
      headerSub: '#CBD5E1',
      accent: '#1D4ED8',
      accentSoft: '#EFF6FF',
      text: '#0F172A',
      muted: '#64748B',
      border: '#E2E8F0',
      fontPrimary: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
      fontMono: '"JetBrains Mono", monospace',
      isThermal: false,
    };
  }
  return {
    bg: '#FFFFFF',
    headerBg: '#064E3B',
    headerText: '#FFFFFF',
    headerSub: '#A7F3D0',
    accent: '#059669',
    accentSoft: '#ECFDF5',
    text: '#0F172A',
    muted: '#64748B',
    border: '#D1FAE5',
    fontPrimary: '"Plus Jakarta Sans", "Hind Siliguri", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    isThermal: false,
  };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export function renderReceiptToCanvas(
  invoice: Invoice,
  shop: ShopProfile
): HTMLCanvasElement {
  const palette = getThemePalette(invoice.theme);
  const scale = 2;
  const width = palette.isThermal ? 460 : 680;
  const padX = palette.isThermal ? 28 : 44;

  // Measure dynamic height first using a temporary canvas context
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;
  mCtx.font = `500 13px ${palette.fontPrimary}`;
  const itemNameMaxW = palette.isThermal ? 185 : 310;

  let itemsHeight = 0;
  const wrappedItems = invoice.items.map((item) => {
    const lines = wrapText(mCtx, item.name || 'Item', itemNameMaxW);
    const rowH = Math.max(32, lines.length * 18 + 14);
    itemsHeight += rowH;
    return { item, lines, rowH };
  });

  const headerHeight = palette.isThermal ? 148 : 156;
  const metaHeight = 88;
  const tableHeaderHeight = 36;
  const totalsHeight = invoice.status === 'DUE' ? 185 : 155;
  const footerHeight = 76;
  const totalHeight = headerHeight + metaHeight + tableHeaderHeight + itemsHeight + totalsHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Canvas background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, totalHeight);

  // Header
  if (palette.isThermal) {
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.headerText;
    ctx.font = `700 20px ${palette.fontPrimary}`;
    ctx.fillText(shop.shopName || 'Shop Name', width / 2, 42);

    if (shop.tagline) {
      ctx.fillStyle = palette.headerSub;
      ctx.font = `400 12px ${palette.fontPrimary}`;
      ctx.fillText(shop.tagline, width / 2, 64);
    }

    ctx.fillStyle = palette.headerSub;
    ctx.font = `400 11.5px ${palette.fontPrimary}`;
    if (shop.address) {
      ctx.fillText(shop.address, width / 2, 84, width - padX * 2);
    }
    if (shop.phone) {
      ctx.fillText(`Tel: ${shop.phone}`, width / 2, 102);
    }

    // Stamp badge if present
    if (shop.stampText.trim()) {
      ctx.font = `700 10px ${palette.fontMono}`;
      const stampW = ctx.measureText(shop.stampText.trim()).width + 20;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(width / 2 - stampW / 2, 114, stampW, 20);
      ctx.fillStyle = '#0F172A';
      ctx.fillText(shop.stampText.trim(), width / 2, 128);
    }

    // Dashed divider
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, headerHeight);
    ctx.lineTo(width - padX, headerHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = palette.headerBg;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.textAlign = 'left';
    ctx.fillStyle = palette.headerText;
    ctx.font = `700 24px ${palette.fontPrimary}`;
    ctx.fillText(shop.shopName || 'Shop Name', padX, 52, width - padX * 2 - 140);

    if (shop.tagline) {
      ctx.fillStyle = palette.headerSub;
      ctx.font = `500 13px ${palette.fontPrimary}`;
      ctx.fillText(shop.tagline, padX, 76, width - padX * 2 - 140);
    }

    ctx.fillStyle = palette.headerSub;
    ctx.font = `400 12px ${palette.fontPrimary}`;
    if (shop.address) {
      ctx.fillText(shop.address, padX, 106, width - padX * 2 - 140);
    }
    if (shop.phone) {
      ctx.fillText(shop.phone, padX, 126);
    }

    // Right side CASH MEMO + Stamp
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.headerText;
    ctx.font = `700 14px ${palette.fontMono}`;
    ctx.fillText('CASH MEMO', width - padX, 48);

    if (shop.stampText.trim()) {
      ctx.font = `600 10.5px ${palette.fontMono}`;
      const stampText = shop.stampText.trim();
      const boxW = Math.min(170, ctx.measureText(stampText).width + 20);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(width - padX - boxW, 64, boxW, 24);
      ctx.fillStyle = palette.headerText;
      ctx.textAlign = 'center';
      ctx.fillText(stampText, width - padX - boxW / 2, 80, boxW - 10);
    }
  }

  // Customer & Invoice Metadata
  let y = headerHeight + 28;
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.muted;
  ctx.font = `600 11px ${palette.fontPrimary}`;
  ctx.fillText('BILL TO', padX, y);

  ctx.fillStyle = palette.text;
  ctx.font = `700 14px ${palette.fontPrimary}`;
  ctx.fillText(invoice.customerName || 'Walk-in Customer', padX, y + 20, width / 2 - padX);

  if (invoice.customerPhone) {
    ctx.fillStyle = palette.muted;
    ctx.font = `400 12.5px ${palette.fontMono}`;
    ctx.fillText(invoice.customerPhone, padX, y + 39);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = palette.muted;
  ctx.font = `600 11px ${palette.fontPrimary}`;
  ctx.fillText('MEMO NO', width - padX, y);

  ctx.fillStyle = palette.text;
  ctx.font = `700 14px ${palette.fontMono}`;
  ctx.fillText(invoice.invoiceNumber, width - padX, y + 20);

  ctx.fillStyle = palette.muted;
  ctx.font = `400 12px ${palette.fontMono}`;
  ctx.fillText(invoice.date, width - padX, y + 39);

  // Table header
  y = headerHeight + metaHeight;
  ctx.fillStyle = palette.accentSoft;
  ctx.fillRect(padX, y, width - padX * 2, tableHeaderHeight);

  const qtyX = palette.isThermal ? width - padX - 135 : width - padX - 200;
  const priceX = palette.isThermal ? width - padX - 70 : width - padX - 105;
  const totalX = width - padX - 10;

  ctx.fillStyle = palette.text;
  ctx.font = `700 11.5px ${palette.fontPrimary}`;
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', padX + 10, y + 22);
  ctx.textAlign = 'right';
  ctx.fillText('QTY', qtyX, y + 22);
  ctx.fillText('RATE', priceX, y + 22);
  ctx.fillText('TOTAL', totalX, y + 22);

  y += tableHeaderHeight;

  // Item rows
  for (const row of wrappedItems) {
    ctx.textAlign = 'left';
    ctx.fillStyle = palette.text;
    ctx.font = `500 13px ${palette.fontPrimary}`;
    row.lines.forEach((line, idx) => {
      ctx.fillText(line, padX + 10, y + 20 + idx * 18);
    });

    const lineTotal = calculateItemTotal(row.item.quantity, row.item.unitPrice);
    ctx.textAlign = 'right';
    ctx.font = `500 12.5px ${palette.fontMono}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(String(row.item.quantity), qtyX, y + 20);
    ctx.fillText(formatTaka(row.item.unitPrice), priceX, y + 20);
    ctx.fillStyle = palette.text;
    ctx.font = `600 12.5px ${palette.fontMono}`;
    ctx.fillText(formatTaka(lineTotal), totalX, y + 20);

    y += row.rowH;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(width - padX, y);
    ctx.stroke();
  }

  // Totals block
  const subtotal = calculateSubtotal(invoice.items);
  const grandTotal = calculateGrandTotal(
    invoice.items,
    invoice.discount,
    invoice.deliveryCharge
  );
  const dueAmount = calculateDueAmount(grandTotal, invoice.status, invoice.paidAmount);

  const labelX = width - padX - 175;
  y += 26;

  // Status stamp on left of totals
  const isPaid = invoice.status === 'PAID' || dueAmount === 0;
  ctx.save();
  ctx.strokeStyle = isPaid ? '#059669' : '#DC2626';
  ctx.fillStyle = isPaid ? '#ECFDF5' : '#FEF2F2';
  ctx.lineWidth = 2;
  ctx.fillRect(padX, y - 6, 94, 34);
  ctx.strokeRect(padX, y - 6, 94, 34);
  ctx.fillStyle = isPaid ? '#059669' : '#DC2626';
  ctx.font = `700 14px ${palette.fontMono}`;
  ctx.textAlign = 'center';
  ctx.fillText(isPaid ? 'PAID' : 'DUE', padX + 47, y + 16);
  ctx.restore();

  const drawSummaryRow = (label: string, value: string, bold = false, color = palette.text) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = bold ? palette.text : palette.muted;
    ctx.font = `${bold ? 700 : 500} ${bold ? 14 : 12.5}px ${palette.fontPrimary}`;
    ctx.fillText(label, labelX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = `${bold ? 700 : 600} ${bold ? 15 : 13}px ${palette.fontMono}`;
    ctx.fillText(value, totalX, y);
    y += bold ? 26 : 22;
  };

  drawSummaryRow('Subtotal', formatTaka(subtotal));
  drawSummaryRow('Discount', `-${formatTaka(invoice.discount || 0)}`);
  drawSummaryRow('Delivery', formatTaka(invoice.deliveryCharge || 0));

  ctx.strokeStyle = palette.border;
  ctx.beginPath();
  ctx.moveTo(labelX, y - 10);
  ctx.lineTo(totalX, y - 10);
  ctx.stroke();
  y += 8;

  drawSummaryRow('Grand Total', formatTaka(grandTotal), true, palette.accent);

  if (invoice.status === 'DUE' && dueAmount > 0) {
    drawSummaryRow('Paid', formatTaka(invoice.paidAmount || 0));
    drawSummaryRow('Balance Due', formatTaka(dueAmount), true, '#DC2626');
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.muted;
  ctx.font = `500 11.5px ${palette.fontPrimary}`;
  ctx.fillText('Thank you for your business! · Powered by KagojPro', width / 2, totalHeight - 28);

  return canvas;
}

export function downloadReceiptPng(invoice: Invoice, shop: ShopProfile): void {
  const canvas = renderReceiptToCanvas(invoice, shop);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `KagojPro-${invoice.invoiceNumber}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
