import type { ReceiptTheme, UiLang } from '../types';

export interface TranslationDict {
  appName: string;
  appSubtitle: string;
  navVoice: string;
  navReceipt: string;
  navHistory: string;
  uiLanguageLabel: string;

  // Voice Memo
  voiceTitle: string;
  voiceSubtitle: string;
  speechLangBangla: string;
  speechLangEnglish: string;
  tapToSpeak: string;
  listeningNow: string;
  tapToStop: string;
  speechUnsupportedTitle: string;
  speechUnsupportedBody: string;
  micPermissionError: string;
  noteTitlePlaceholder: string;
  noteContentPlaceholder: string;
  punctuationLabel: string;
  punctDari: string;
  punctComma: string;
  punctQuestion: string;
  punctNewline: string;
  actionCopy: string;
  actionCopied: string;
  actionWhatsApp: string;
  actionSaveNote: string;
  actionUpdateNote: string;
  actionNewNote: string;
  actionDownloadTxt: string;
  actionPrintPdf: string;
  noteSavedToast: string;
  recentNotesTitle: string;
  searchNotesPlaceholder: string;
  noNotesEmpty: string;
  noNotesAction: string;
  deleteConfirm: string;
  loadNote: string;
  deleteLabel: string;
  charactersCount: string;
  wordsCount: string;

  // Receipt Maker
  receiptTitle: string;
  receiptSubtitle: string;
  shopSettingsToggle: string;
  shopSettingsTitle: string;
  shopSavedIndicator: string;
  shopNameLabel: string;
  shopTaglineLabel: string;
  shopPhoneLabel: string;
  shopAddressLabel: string;
  shopStampLabel: string;
  shopStampPlaceholder: string;

  customerSectionTitle: string;
  customerNameLabel: string;
  customerNamePlaceholder: string;
  customerPhoneLabel: string;
  customerPhonePlaceholder: string;
  invoiceNumberLabel: string;
  invoiceDateLabel: string;

  itemsSectionTitle: string;
  itemNameCol: string;
  itemQtyCol: string;
  itemPriceCol: string;
  itemTotalCol: string;
  itemNamePlaceholder: string;
  addItemBtn: string;
  removeItemLabel: string;

  totalsSectionTitle: string;
  subtotalLabel: string;
  discountLabel: string;
  deliveryChargeLabel: string;
  grandTotalLabel: string;
  paymentStatusLabel: string;
  statusPaid: string;
  statusDue: string;
  paidAmountLabel: string;
  dueAmountLabel: string;

  themeSectionTitle: string;
  themeNames: Record<ReceiptTheme, string>;
  previewHeading: string;
  saveInvoiceBtn: string;
  updateInvoiceBtn: string;
  newInvoiceBtn: string;
  exportPngBtn: string;
  printPdfBtn: string;
  shareWhatsAppBtn: string;
  invoiceSavedToast: string;
  validationMissingCustomer: string;
  validationMissingItems: string;

  // Receipt inner labels
  receiptMemoTitle: string;
  receiptBillTo: string;
  receiptDate: string;
  receiptNo: string;
  receiptFooterNote: string;

  // History & Summary
  historyTitle: string;
  historySubtitle: string;
  summaryTotalInvoices: string;
  summaryTotalSales: string;
  summaryTotalDue: string;
  tabAllInvoices: string;
  tabVoiceNotes: string;
  searchHistoryPlaceholder: string;
  filterAll: string;
  filterPaid: string;
  filterDue: string;
  openInEditorBtn: string;
  downloadPngShort: string;
  noInvoicesEmpty: string;
  createFirstInvoiceBtn: string;
}

export const TRANSLATIONS: Record<UiLang, TranslationDict> = {
  en: {
    appName: 'KagojPro',
    appSubtitle: 'Voice & Receipt Studio',
    navVoice: 'Voice Memo',
    navReceipt: 'Receipt Maker',
    navHistory: 'Saved History',
    uiLanguageLabel: 'Language',

    voiceTitle: 'Smart Voice Notepad',
    voiceSubtitle: 'Speak naturally in Bangla or English, punctuate with one tap, and share anywhere.',
    speechLangBangla: 'বাংলা (bn-BD)',
    speechLangEnglish: 'English (en-US)',
    tapToSpeak: 'Tap to Speak',
    listeningNow: 'Listening… Speak clearly',
    tapToStop: 'Tap to Stop',
    speechUnsupportedTitle: 'Voice dictation unavailable in this browser',
    speechUnsupportedBody:
      'Your browser does not support Web Speech API. You can still type, use quick Bangla punctuation, save, copy, and export notes below.',
    micPermissionError: 'Microphone access was blocked or unavailable. Please check browser permissions.',
    noteTitlePlaceholder: 'Note title (optional — auto-named if blank)',
    noteContentPlaceholder: 'Start speaking or type your Bangla / English memo here...',
    punctuationLabel: 'Quick Punctuation',
    punctDari: '। দাঁড়ি',
    punctComma: ', কমা',
    punctQuestion: '? প্রশ্ন',
    punctNewline: '↵ নতুন লাইন',
    actionCopy: 'Copy Text',
    actionCopied: 'Copied',
    actionWhatsApp: 'Share to WhatsApp',
    actionSaveNote: 'Save Note',
    actionUpdateNote: 'Update Note',
    actionNewNote: 'New Note',
    actionDownloadTxt: 'Download TXT',
    actionPrintPdf: 'Print / PDF',
    noteSavedToast: 'Note saved to device',
    recentNotesTitle: 'Saved Voice Notes',
    searchNotesPlaceholder: 'Search saved notes...',
    noNotesEmpty: 'No voice notes match your search yet.',
    noNotesAction: 'Create a note',
    deleteConfirm: 'Delete',
    loadNote: 'Open',
    deleteLabel: 'Delete note',
    charactersCount: 'chars',
    wordsCount: 'words',

    receiptTitle: 'Instant Cash Memo & Invoice',
    receiptSubtitle: 'Create print-ready receipts and share crisp PNG memos on WhatsApp or Messenger.',
    shopSettingsToggle: 'Shop Header & Stamp',
    shopSettingsTitle: 'Shop Identity (Auto-saved)',
    shopSavedIndicator: 'Saved automatically',
    shopNameLabel: 'Shop / Business Name',
    shopTaglineLabel: 'Tagline',
    shopPhoneLabel: 'Shop Phone',
    shopAddressLabel: 'Address',
    shopStampLabel: 'Logo / Stamp Seal Text',
    shopStampPlaceholder: 'e.g. VERIFIED · DHAKA',

    customerSectionTitle: 'Customer & Invoice Details',
    customerNameLabel: 'Customer Name',
    customerNamePlaceholder: 'e.g. Rafiqul Islam',
    customerPhoneLabel: 'Phone Number',
    customerPhonePlaceholder: '017XXXXXXXX',
    invoiceNumberLabel: 'Invoice No.',
    invoiceDateLabel: 'Date',

    itemsSectionTitle: 'Order Items',
    itemNameCol: 'Item Description',
    itemQtyCol: 'Qty',
    itemPriceCol: 'Unit Price (৳)',
    itemTotalCol: 'Total',
    itemNamePlaceholder: 'Product or service name',
    addItemBtn: 'Add Item Row',
    removeItemLabel: 'Remove item',

    totalsSectionTitle: 'Payment & Adjustments',
    subtotalLabel: 'Subtotal',
    discountLabel: 'Discount (৳)',
    deliveryChargeLabel: 'Delivery Charge (৳)',
    grandTotalLabel: 'Grand Total',
    paymentStatusLabel: 'Payment Status',
    statusPaid: 'PAID',
    statusDue: 'DUE',
    paidAmountLabel: 'Advance / Paid (৳)',
    dueAmountLabel: 'Balance Due',

    themeSectionTitle: 'Receipt Theme',
    themeNames: {
      thermal: 'Classic Thermal POS',
      'modern-blue': 'Modern Blue Business',
      'emerald-boutique': 'Emerald Boutique',
    },
    previewHeading: 'Live Print Preview',
    saveInvoiceBtn: 'Save Cash Memo',
    updateInvoiceBtn: 'Update Cash Memo',
    newInvoiceBtn: 'New Invoice',
    exportPngBtn: 'Export PNG',
    printPdfBtn: 'Print / PDF',
    shareWhatsAppBtn: 'WhatsApp',
    invoiceSavedToast: 'Cash memo saved to history',
    validationMissingCustomer: 'Please enter a customer name before saving.',
    validationMissingItems: 'Add at least one item with a name and price.',

    receiptMemoTitle: 'CASH MEMO',
    receiptBillTo: 'Bill To',
    receiptDate: 'Date',
    receiptNo: 'Memo No',
    receiptFooterNote: 'Thank you for your business!',

    historyTitle: 'Saved History & Daily Summary',
    historySubtitle: 'Track daily sales, collect dues, and re-open or export past cash memos.',
    summaryTotalInvoices: 'Total Invoices',
    summaryTotalSales: 'Total Sales (৳)',
    summaryTotalDue: 'Total Due (৳)',
    tabAllInvoices: 'Cash Memos',
    tabVoiceNotes: 'Voice Notes',
    searchHistoryPlaceholder: 'Search by customer, phone, or invoice #...',
    filterAll: 'All',
    filterPaid: 'Paid',
    filterDue: 'Due',
    openInEditorBtn: 'Open & Edit',
    downloadPngShort: 'PNG',
    noInvoicesEmpty: 'No cash memos found for this filter.',
    createFirstInvoiceBtn: 'Create Cash Memo',
  },
  bn: {
    appName: 'KagojPro',
    appSubtitle: 'ভয়েস ও মেমো স্টুডিও',
    navVoice: 'ভয়েস মেমো',
    navReceipt: 'ক্যাশ মেমো',
    navHistory: 'সংরক্ষিত হিসাব',
    uiLanguageLabel: 'ভাষা',

    voiceTitle: 'স্মার্ট বাংলা ও ইংরেজি ভয়েস নোটপ্যাড',
    voiceSubtitle: 'বাংলা বা ইংরেজিতে মুখে বলুন, এক ক্লিকে যতিচিহ্ন বসান এবং হোয়াটসঅ্যাপে শেয়ার করুন।',
    speechLangBangla: 'বাংলা (bn-BD)',
    speechLangEnglish: 'English (en-US)',
    tapToSpeak: 'কথা বলতে চাপুন',
    listeningNow: 'শুনছি… স্পষ্টভাবে বলুন',
    tapToStop: 'থামাতে চাপুন',
    speechUnsupportedTitle: 'এই ব্রাউজারে ভয়েস ডিক্টেশন সাপোর্ট নেই',
    speechUnsupportedBody:
      'আপনার ব্রাউজারে Web Speech API চালু নেই। তবে আপনি সরাসরি লিখে দ্রুত যতিচিহ্ন, কপি, সেভ ও ডাউনলোড করতে পারবেন।',
    micPermissionError: 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।',
    noteTitlePlaceholder: 'নোটের শিরোনাম (ঐচ্ছিক — খালি রাখলে স্বয়ংক্রিয় নাম হবে)',
    noteContentPlaceholder: 'এখানে কথা বলে বা লিখে আপনার বাংলা বা ইংরেজি নোট তৈরি করুন...',
    punctuationLabel: 'দ্রুত যতিচিহ্ন',
    punctDari: '। দাঁড়ি',
    punctComma: ', কমা',
    punctQuestion: '? প্রশ্নবোধক',
    punctNewline: '↵ নতুন লাইন',
    actionCopy: 'কপি করুন',
    actionCopied: 'কপি হয়েছে',
    actionWhatsApp: 'হোয়াটসঅ্যাপে শেয়ার',
    actionSaveNote: 'নোট সেভ করুন',
    actionUpdateNote: 'নোট আপডেট করুন',
    actionNewNote: 'নতুন নোট',
    actionDownloadTxt: 'TXT ডাউনলোড',
    actionPrintPdf: 'প্রিন্ট / PDF',
    noteSavedToast: 'নোট সংরক্ষণ করা হয়েছে',
    recentNotesTitle: 'সংরক্ষিত ভয়েস নোট',
    searchNotesPlaceholder: 'সংরক্ষিত নোট খুঁজুন...',
    noNotesEmpty: 'কোনো ভয়েস নোট পাওয়া যায়নি।',
    noNotesAction: 'নতুন নোট লিখুন',
    deleteConfirm: 'মুছুন',
    loadNote: 'খুলুন',
    deleteLabel: 'নোট মুছুন',
    charactersCount: 'অক্ষর',
    wordsCount: 'শব্দ',

    receiptTitle: 'ডিজিটাল ক্যাশ মেমো ও ইনভয়েস',
    receiptSubtitle: 'ছোট দোকান, ফেসবুক পেজ ও ব্যবসার জন্য প্রিন্ট ও হোয়াটসঅ্যাপ উপযোগী মেমো তৈরি করুন।',
    shopSettingsToggle: 'দোকানের তথ্য ও সিল',
    shopSettingsTitle: 'দোকান / প্রতিষ্ঠানের তথ্য (স্বয়ংক্রিয়ভাবে সেভ হয়)',
    shopSavedIndicator: 'স্বয়ংক্রিয়ভাবে সংরক্ষিত',
    shopNameLabel: 'দোকান / ব্যবসার নাম',
    shopTaglineLabel: 'ট্যাগলাইন / স্লোগান',
    shopPhoneLabel: 'মোবাইল নম্বর',
    shopAddressLabel: 'ঠিকানা',
    shopStampLabel: 'লোগো / সিল লেখা',
    shopStampPlaceholder: 'যেমন: TRUSTED · DHAKA',

    customerSectionTitle: 'ক্রেতা ও মেমোর তথ্য',
    customerNameLabel: 'ক্রেতার নাম',
    customerNamePlaceholder: 'যেমন: রফিকুল ইসলাম',
    customerPhoneLabel: 'ক্রেতার মোবাইল',
    customerPhonePlaceholder: '017XXXXXXXX',
    invoiceNumberLabel: 'মেমো নং',
    invoiceDateLabel: 'তারিখ',

    itemsSectionTitle: 'পণ্যের তালিকা',
    itemNameCol: 'পণ্যের বিবরণ',
    itemQtyCol: 'পরিমাণ',
    itemPriceCol: 'একক দর (৳)',
    itemTotalCol: 'মোট',
    itemNamePlaceholder: 'পণ্য বা সেবার নাম লিখুন',
    addItemBtn: 'নতুন পণ্য যোগ করুন',
    removeItemLabel: 'পণ্য বাদ দিন',

    totalsSectionTitle: 'হিসাব ও পেমেন্ট',
    subtotalLabel: 'মোট মূল্য',
    discountLabel: 'ছাড় / ডিসকাউন্ট (৳)',
    deliveryChargeLabel: 'ডেলিভারি চার্জ (৳)',
    grandTotalLabel: 'সর্বমোট বিল',
    paymentStatusLabel: 'পেমেন্ট অবস্থা',
    statusPaid: 'PAID (পরিশোধিত)',
    statusDue: 'DUE (বাকি)',
    paidAmountLabel: 'অগ্রিম / জমা (৳)',
    dueAmountLabel: 'বাকি পরিমাণ',

    themeSectionTitle: 'মেমো ডিজাইন থিম',
    themeNames: {
      thermal: 'ক্লাসিক থার্মাল POS',
      'modern-blue': 'মডার্ন ব্লু বিজনেস',
      'emerald-boutique': 'এমেরাল্ড বুটিক',
    },
    previewHeading: 'লাইভ প্রিন্ট প্রিভিউ',
    saveInvoiceBtn: 'মেমো সেভ করুন',
    updateInvoiceBtn: 'মেমো আপডেট করুন',
    newInvoiceBtn: 'নতুন মেমো',
    exportPngBtn: 'PNG ডাউনলোড',
    printPdfBtn: 'প্রিন্ট / PDF',
    shareWhatsAppBtn: 'হোয়াটসঅ্যাপ',
    invoiceSavedToast: 'ক্যাশ মেমো সংরক্ষিত হয়েছে',
    validationMissingCustomer: 'সেভ করার আগে অনুগ্রহ করে ক্রেতার নাম লিখুন।',
    validationMissingItems: 'অন্তত একটি পণ্যের নাম ও দাম যোগ করুন।',

    receiptMemoTitle: 'ক্যাশ মেমো / CASH MEMO',
    receiptBillTo: 'ক্রেতা',
    receiptDate: 'তারিখ',
    receiptNo: 'মেমো নং',
    receiptFooterNote: 'আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!',

    historyTitle: 'সংরক্ষিত হিসাব ও দৈনিক সারাংশ',
    historySubtitle: 'মোট বিক্রি, বকেয়া হিসাব দেখুন এবং যেকোনো পুরনো মেমো পুনরায় ডাউনলোড বা এডিট করুন।',
    summaryTotalInvoices: 'মোট ক্যাশ মেমো',
    summaryTotalSales: 'মোট বিক্রি (৳)',
    summaryTotalDue: 'মোট বকেয়া (৳)',
    tabAllInvoices: 'ক্যাশ মেমো তালিকা',
    tabVoiceNotes: 'ভয়েস নোট তালিকা',
    searchHistoryPlaceholder: 'ক্রেতার নাম, ফোন বা মেমো নং দিয়ে খুঁজুন...',
    filterAll: 'সবগুলো',
    filterPaid: 'পরিশোধিত',
    filterDue: 'বাকি',
    openInEditorBtn: 'এডিট ও প্রিভিউ',
    downloadPngShort: 'PNG',
    noInvoicesEmpty: 'কোনো ক্যাশ মেমো পাওয়া যায়নি।',
    createFirstInvoiceBtn: 'নতুন মেমো তৈরি করুন',
  },
};
