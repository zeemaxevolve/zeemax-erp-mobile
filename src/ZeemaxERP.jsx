import React, { useState, useEffect, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  LayoutDashboard, Package, Boxes, Users, Truck, FileText, FileCheck2,
  Calculator, BarChart3, Settings as SettingsIcon, Plus, X, Printer,
  AlertTriangle, Search, Trash2, Pencil, ArrowRight, CheckCircle2,
  ChevronRight, Beaker, Receipt, ClipboardList, Wallet, TrendingUp,
  TrendingDown, BookOpen, Landmark, PackageCheck, Droplets, ShieldAlert,
  Phone, Mail, MapPin, Globe, FlaskConical, MessageCircle, Menu, Download,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   Palette: deep industrial navy + hazard-amber accent + teal for
   "healthy stock" signals. IBM Plex Sans for UI, IBM Plex Mono for
   all lot numbers, document numbers, and monetary figures — a nod
   to the batch-traceability data that runs through chemical trading.
   ============================================================ */
const TOKENS = {
  ink: "#12203A",
  navy: "#14294F",
  navyDeep: "#0B1A34",
  brand: "#1E9E4C",
  brandDeep: "#167A3C",
  amber: "#D98E2B",
  amberDeep: "#B5721A",
  teal: "#0F766E",
  red: "#B4222A",
  paper: "#F6F5F1",
  card: "#FFFFFF",
  line: "#E4E1D8",
  mute: "#6B7280",
};

const FONT_IMPORT = `/* Offline desktop build: no remote font import. Falls back to
   IBM Plex Sans if installed locally, otherwise the system UI font. */`;

/* ============================================================
   CHART OF ACCOUNTS (fixed for this MVP)
   ============================================================ */
const ACCOUNTS = [
  { code: "1000", name: "Cash & Bank", type: "asset" },
  { code: "1100", name: "Accounts Receivable", type: "asset" },
  { code: "1200", name: "Inventory", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2100", name: "VAT Payable", type: "liability" },
  { code: "3000", name: "Owner's Equity", type: "equity" },
  { code: "4000", name: "Sales Revenue", type: "revenue" },
  { code: "5000", name: "Cost of Goods Sold", type: "expense" },
  { code: "5100", name: "Inventory Write-off / Adjustment", type: "expense" },
  { code: "6000", name: "Operating Expenses", type: "expense" },
];
const acctName = (code) => ACCOUNTS.find((a) => a.code === code)?.name || code;

const HAZARD_CLASSES = [
  "Non-hazardous", "Flammable", "Corrosive", "Oxidizing",
  "Toxic", "Irritant", "Environmentally Hazardous",
];

const DOC_LABELS = { PROFORMA: "Proforma Invoice", INVOICE: "Invoice", WAYBILL: "Waybill", RECEIPT: "Receipt" };
const DOC_PREFIX = { PROFORMA: "PI", INVOICE: "INV", WAYBILL: "WB", GRN: "GRN", RECEIPT: "RCPT" };

/* ============================================================
   DEFAULT / EMPTY DATABASE
   Everything is placeholder / empty until a real client's data
   is entered via Settings and the module screens.
   ============================================================ */
function defaultSettings() {
  return {
      company_name: "Zeemax Chemical",
      tagline: "Solutions that Evolve, Results that Last.",
      address1: "196 Oshodi Apapa Expressway",
      address2: "Ilasamaja, Lagos",
      phone: "08162289022",
      email: "zeemaxevolvesltd@gmail.com",
      website: "www.zeemaxevolve.com",
      rc_no: "",
      tin: "",
      bank_name: "",
      bank_account_name: "Zeemax Chemical",
      bank_account_number: "",
      bank_address: "",
      vat_rate: 7.5,
      logo: "data:image/png;base64,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",
      signature: null,
      footer_text: "Powered by Zeemax Digital",
      waybill_footer_text: "Goods received in good condition and order.",
      terms_conditions: "Prices are valid for the period stated above.\nGoods remain the property of the seller until paid in full.\nDelivery timelines are estimates and subject to logistics availability.",
      payment_terms: "50% advance payment to confirm order.\nBalance due before dispatch, unless otherwise agreed.\nPlease reference the invoice number for all payments.",
  };
}

/** Fields restored by "Restore Default Branding" — deliberately excludes
 *  anything the person may have customized for their own real business
 *  details that shouldn't be silently reset, like RC/TIN and bank account
 *  number, which stay untouched. */
const BRANDING_FIELDS = [
  "company_name", "tagline", "address1", "address2", "phone", "email", "website",
  "logo", "footer_text", "waybill_footer_text",
];

function restoreDefaultBranding(db) {
  const defaults = defaultSettings();
  BRANDING_FIELDS.forEach((key) => { db.settings[key] = defaults[key]; });
}

function emptyDB() {
  return {
    settings: defaultSettings(),
    counters: { PROFORMA: 0, INVOICE: 0, WAYBILL: 0, GRN: 0, RECEIPT: 0 },
    warehouses: [{ id: "wh-main", name: "Main Warehouse" }],
    products: [],
    batches: [],
    customers: [],
    suppliers: [],
    documents: [],
    journal: [],
    payments: [],
  };
}

/** Merges one record collection (e.g. products, documents) by id.
 *  Whichever version of a given record has the more recent updated_at
 *  wins; records only present on one side are simply carried over.
 *  A record with no updated_at at all is treated as older than any
 *  timestamped record, so it never wins against real merge data. */
function mergeRecords(localList, incomingList) {
  const byId = new Map();
  (localList || []).forEach((r) => byId.set(r.id, r));
  let added = 0, updated = 0;
  (incomingList || []).forEach((r) => {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      added++;
    } else if ((r.updated_at || "") > (existing.updated_at || "")) {
      byId.set(r.id, r);
      updated++;
    }
  });
  return { merged: Array.from(byId.values()), added, updated };
}

const MERGE_COLLECTIONS = ["products", "batches", "customers", "suppliers", "documents", "journal", "payments"];

/** Combines two database snapshots — e.g. an export from your phone and
 *  your desktop's current data — into one, without either side losing
 *  anything. Deletions are respected because deletes are tombstones
 *  (_deleted: true, not a real removal): a tombstoned record with a newer
 *  updated_at correctly stays deleted after merging, and won't be
 *  resurrected by an older copy of itself from the other side.
 *  Document number counters take the higher of the two, so numbering
 *  never collides after a merge (e.g. both sides independently creating
 *  "their own" INV-000006). Settings/branding are deliberately NOT
 *  merged — the local device's settings are always kept, since merging
 *  is about combining transactional data, not silently changing
 *  configuration like your logo or VAT rate. */
function mergeDatabases(local, incoming) {
  const result = { ...local };
  const summary = {};

  MERGE_COLLECTIONS.forEach((key) => {
    const { merged, added, updated } = mergeRecords(local[key], incoming[key]);
    result[key] = merged;
    summary[key] = { added, updated };
  });

  const whIds = new Set((local.warehouses || []).map((w) => w.id));
  const newWarehouses = (incoming.warehouses || []).filter((w) => !whIds.has(w.id));
  result.warehouses = [...(local.warehouses || []), ...newWarehouses];
  summary.warehouses = { added: newWarehouses.length, updated: 0 };

  result.counters = { ...local.counters };
  Object.keys(incoming.counters || {}).forEach((k) => {
    result.counters[k] = Math.max(result.counters[k] || 0, incoming.counters[k] || 0);
  });

  result.settings = local.settings;

  return { db: result, summary };
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n, dp = 2) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-NG", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
/** Full timestamp (date+time), used to version records for merge/sync —
 *  separate from todayISO() which is date-only and used for document dates. */
function nowISO() {
  return new Date().toISOString();
}
function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Renders a DOM node (the printed document view) into a real PDF file,
 *  using html2canvas + jsPDF — pure JS/DOM, so this works identically on
 *  desktop (Electron) and mobile (Capacitor's WebView), unlike
 *  window.print(), which has no native print pipeline on Android and
 *  silently does nothing there. Splits across multiple A4 pages if the
 *  document is taller than one page. Returns the jsPDF instance so the
 *  caller decides what to do with it (save directly on desktop, or turn
 *  into base64 for a native mobile share sheet). */
async function generateDocumentPDF(node) {
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  return pdf;
}

/** data:application/pdf;base64,XXXX -> just "XXXX" — Capacitor's
 *  Filesystem.writeFile wants the raw base64 payload, not the data URI. */
function stripDataUriPrefix(dataUri) {
  const idx = dataUri.indexOf(",");
  return idx === -1 ? dataUri : dataUri.slice(idx + 1);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function productLabel(p) {
  if (!p) return "—";
  return p.brand ? `${p.name} (${p.brand})` : p.name;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function threeDigitsToWords(n) {
  let s = "";
  if (n >= 100) { s += ONES[Math.floor(n / 100)] + " Hundred "; n %= 100; }
  if (n >= 20) { s += TENS[Math.floor(n / 10)] + " "; n %= 10; }
  if (n > 0) s += ONES[n] + " ";
  return s.trim();
}
function numToWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const units = ["", "Thousand", "Million", "Billion"];
  let parts = [];
  let i = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk) parts.unshift(threeDigitsToWords(chunk) + (units[i] ? " " + units[i] : ""));
    num = Math.floor(num / 1000);
    i++;
  }
  return parts.join(" ").trim();
}
function amountInWords(n, currency = "Naira") {
  const whole = Math.floor(n);
  const kobo = Math.round((n - whole) * 100);
  let s = numToWords(whole) + " " + currency;
  if (kobo > 0) s += ` and ${numToWords(kobo)} Kobo`;
  return s + " Only";
}

/* ============================================================
   CORE BUSINESS LOGIC
   Every stock movement and sales/purchase event posts a balanced
   double-entry journal line so Accounting stays in sync with
   Inventory automatically — this is the spine of the app.
   ============================================================ */

function nextDocNumber(db, type) {
  const n = (db.counters[type] || 0) + 1;
  db.counters[type] = n;
  return `${DOC_PREFIX[type]}-${String(n).padStart(6, "0")}`;
}

function postJournal(db, { date, description, ref_type, ref_id, lines }) {
  const debit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const credit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (Math.abs(debit - credit) > 0.01) {
    throw new Error(`Journal entry does not balance (Dr ${debit.toFixed(2)} vs Cr ${credit.toFixed(2)})`);
  }
  db.journal.push({
    id: uid("jrn"),
    date,
    description,
    ref_type,
    ref_id,
    lines: lines.map((l) => ({ account: l.account, debit: l.debit || 0, credit: l.credit || 0 })),
    updated_at: nowISO(),
  });
}

function productStock(db, productId) {
  return db.batches
    .filter((b) => b.product_id === productId)
    .reduce((s, b) => s + b.qty, 0);
}

function productStockValue(db, productId) {
  const p = db.products.find((x) => x.id === productId);
  if (!p) return 0;
  return productStock(db, productId) * (p.avg_cost || 0);
}

function totalStockValue(db) {
  return db.products.filter((p) => !p._deleted).reduce((s, p) => s + productStockValue(db, p.id), 0);
}

/** Weighted-average cost update on a goods receipt */
function receiveStock(db, { product_id, warehouse_id, batch_no, qty, unit_cost, mfg_date, expiry_date, supplier_id, landed_extra = 0 }) {
  const product = db.products.find((p) => p.id === product_id);
  if (!product) throw new Error("Unknown product");
  const totalUnitCost = unit_cost + (landed_extra || 0) / qty;
  const oldQty = productStock(db, product_id);
  const oldCost = product.avg_cost || 0;
  const newQty = oldQty + qty;
  product.avg_cost = newQty > 0 ? (oldQty * oldCost + qty * totalUnitCost) / newQty : totalUnitCost;

  db.batches.push({
    id: uid("batch"),
    product_id,
    warehouse_id,
    batch_no: batch_no || `AUTO-${Date.now().toString(36).toUpperCase()}`,
    qty,
    unit_cost: totalUnitCost,
    mfg_date: mfg_date || null,
    expiry_date: expiry_date || null,
    received_date: todayISO(),
    updated_at: nowISO(),
  });

  const grnNumber = nextDocNumber(db, "GRN");
  const goodsValue = qty * unit_cost;
  const totalValue = qty * totalUnitCost;

  db.documents.push({
    id: uid("doc"),
    type: "GRN",
    number: grnNumber,
    date: todayISO(),
    supplier_id: supplier_id || null,
    lines: [{ product_id, batch_no, qty, rate: unit_cost, amount: goodsValue }],
    subtotal: goodsValue,
    landed_extra: landed_extra || 0,
    total: totalValue,
    status: "Received",
    updated_at: nowISO(),
  });

  postJournal(db, {
    date: todayISO(),
    description: `Goods receipt ${grnNumber} — ${product.name}`,
    ref_type: "GRN",
    ref_id: grnNumber,
    lines: supplier_id
      ? [{ account: "1200", debit: totalValue }, { account: "2000", credit: totalValue }]
      : [{ account: "1200", debit: totalValue }, { account: "1000", credit: totalValue }],
  });

  return grnNumber;
}

/** FIFO (by expiry, earliest first) batch consumption for a sale */
function consumeStock(db, product_id, qty) {
  const available = productStock(db, product_id);
  if (qty > available + 0.0001) {
    throw new Error("Insufficient stock to fulfil this quantity");
  }
  let remaining = qty;
  const consumed = [];
  const batches = db.batches
    .filter((b) => b.product_id === product_id && b.qty > 0)
    .sort((a, b) => (a.expiry_date || "9999").localeCompare(b.expiry_date || "9999"));
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(b.qty, remaining);
    b.qty -= take;
    b.updated_at = nowISO();
    remaining -= take;
    consumed.push({ batch_no: b.batch_no, qty: take });
  }
  return consumed;
}

function stockAdjust(db, { product_id, warehouse_id, qty_delta, reason }) {
  const product = db.products.find((p) => p.id === product_id);
  if (!product) throw new Error("Unknown product");
  const value = Math.abs(qty_delta) * (product.avg_cost || 0);

  if (qty_delta < 0) {
    consumeStock(db, product_id, Math.abs(qty_delta));
  } else {
    db.batches.push({
      id: uid("batch"), product_id, warehouse_id, batch_no: `ADJ-${Date.now().toString(36).toUpperCase()}`,
      qty: qty_delta, unit_cost: product.avg_cost || 0, mfg_date: null, expiry_date: null, received_date: todayISO(),
      updated_at: nowISO(),
    });
  }

  postJournal(db, {
    date: todayISO(),
    description: `Stock adjustment — ${product.name} (${reason || "no reason given"})`,
    ref_type: "ADJUSTMENT",
    ref_id: product_id,
    lines: qty_delta < 0
      ? [{ account: "5100", debit: value }, { account: "1200", credit: value }]
      : [{ account: "1200", debit: value }, { account: "5100", credit: value }],
  });
}

function lineTotals(lines, vatRate) {
  const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0);
  const vat = subtotal * (vatRate / 100);
  return { subtotal, vat, total: subtotal + vat };
}

function createProforma(db, { customer_id, subject, valid_days, lines, origin_of_goods, vat_exempt, vat_rate_override }) {
  const number = nextDocNumber(db, "PROFORMA");
  const rate = vat_exempt ? 0 : (vat_rate_override != null ? vat_rate_override : db.settings.vat_rate);
  const { subtotal, vat, total } = lineTotals(lines, rate);
  const doc = {
    id: uid("doc"), type: "PROFORMA", number, date: todayISO(),
    valid_till: addDays(todayISO(), valid_days || 14),
    customer_id, subject, origin_of_goods, lines, subtotal, vat, total, vat_exempt: !!vat_exempt, vat_rate_applied: rate, status: "Draft",
    updated_at: nowISO(),
  };
  db.documents.push(doc);
  return doc;
}

/** A Proforma has no stock or accounting effect, so full edits (including
 *  line items and amounts) are always safe — but only before it's been
 *  converted. Once converted, the Invoice already reflects a snapshot of
 *  it, so editing the Proforma further would be misleading. */
function updateProforma(db, proformaId, { customer_id, subject, valid_days, lines, origin_of_goods, vat_exempt, vat_rate_override }) {
  const pf = db.documents.find((d) => d.id === proformaId && d.type === "PROFORMA");
  if (!pf) throw new Error("Proforma not found");
  if (pf.status !== "Draft") throw new Error("This Proforma has already been converted to an Invoice and can no longer be edited.");
  const rate = vat_exempt ? 0 : (vat_rate_override != null ? vat_rate_override : db.settings.vat_rate);
  const { subtotal, vat, total } = lineTotals(lines, rate);
  Object.assign(pf, {
    customer_id, subject, origin_of_goods, lines,
    valid_till: addDays(todayISO(), valid_days || 14),
    subtotal, vat, total, vat_exempt: !!vat_exempt, vat_rate_applied: rate,
    updated_at: nowISO(),
  });
  return pf;
}

/** Deletes are "soft" — the record is tombstoned (_deleted: true) rather
 *  than removed from the array. This matters for merge/sync: if a record
 *  were hard-deleted here but still present in a backup from another
 *  device, a later merge would resurrect it. Every place that lists or
 *  sums documents filters out _deleted ones, so a tombstoned record is
 *  invisible everywhere in the UI — it's just not physically erased. */
function deleteProforma(db, proformaId) {
  const pf = db.documents.find((d) => d.id === proformaId && d.type === "PROFORMA");
  if (!pf) throw new Error("Proforma not found");
  pf._deleted = true;
  pf.updated_at = nowISO();
}

function convertProformaToInvoice(db, proformaId, { due_days = 14 } = {}) {
  const pf = db.documents.find((d) => d.id === proformaId);
  if (!pf) throw new Error("Proforma not found");
  if (pf.type !== "PROFORMA") throw new Error("Not a proforma");

  // Pre-validate stock for every line first, so a multi-line proforma either
  // converts entirely or not at all — no partial stock deduction on failure.
  pf.lines.forEach((l) => {
    const available = productStock(db, l.product_id);
    if (Number(l.qty) > available + 0.0001) {
      const product = db.products.find((p) => p.id === l.product_id);
      throw new Error(`Insufficient stock for ${product ? product.name : l.product_id}: need ${l.qty}, have ${available}`);
    }
  });

  // Reserve stock and capture COGS at current avg cost
  let cogs = 0;
  const enrichedLines = pf.lines.map((l) => {
    const consumed = consumeStock(db, l.product_id, Number(l.qty));
    const product = db.products.find((p) => p.id === l.product_id);
    cogs += Number(l.qty) * (product.avg_cost || 0);
    return { ...l, batch_no: consumed.map((c) => c.batch_no).join(", ") };
  });

  const number = nextDocNumber(db, "INVOICE");
  const invoice = {
    id: uid("doc"), type: "INVOICE", number, date: todayISO(),
    due_date: addDays(todayISO(), due_days), payment_terms: `Net ${due_days} days`,
    customer_id: pf.customer_id, subject: pf.subject, origin_of_goods: pf.origin_of_goods, lines: enrichedLines,
    subtotal: pf.subtotal, vat: pf.vat, total: pf.total, vat_exempt: !!pf.vat_exempt, vat_rate_applied: pf.vat_rate_applied,
    amount_paid: 0, status: "Unpaid", related_doc_id: pf.id, proforma_number: pf.number,
    updated_at: nowISO(),
  };
  db.documents.push(invoice);
  pf.status = "Converted";
  pf.related_doc_id = invoice.id;
  pf.updated_at = nowISO();

  postJournal(db, {
    date: todayISO(), description: `Invoice ${number} — Sales Revenue`, ref_type: "INVOICE", ref_id: number,
    lines: [
      { account: "1100", debit: invoice.total },
      { account: "4000", credit: invoice.subtotal },
      { account: "2100", credit: invoice.vat },
    ],
  });
  postJournal(db, {
    date: todayISO(), description: `Invoice ${number} — Cost of Goods Sold`, ref_type: "INVOICE", ref_id: number,
    lines: [{ account: "5000", debit: cogs }, { account: "1200", credit: cogs }],
  });

  return invoice;
}

/** Raise an Invoice directly, with no Proforma Invoice required first. */
function createInvoiceDirect(db, { customer_id, subject, origin_of_goods, due_days = 14, lines, vat_exempt, vat_rate_override }) {
  lines.forEach((l) => {
    const available = productStock(db, l.product_id);
    if (Number(l.qty) > available + 0.0001) {
      const product = db.products.find((p) => p.id === l.product_id);
      throw new Error(`Insufficient stock for ${product ? product.name : l.product_id}: need ${l.qty}, have ${available}`);
    }
  });

  let cogs = 0;
  const enrichedLines = lines.map((l) => {
    const consumed = consumeStock(db, l.product_id, Number(l.qty));
    const product = db.products.find((p) => p.id === l.product_id);
    cogs += Number(l.qty) * (product.avg_cost || 0);
    return { ...l, batch_no: consumed.map((c) => c.batch_no).join(", ") };
  });

  const rate = vat_exempt ? 0 : (vat_rate_override != null ? vat_rate_override : db.settings.vat_rate);
  const { subtotal, vat, total } = lineTotals(lines, rate);
  const number = nextDocNumber(db, "INVOICE");
  const invoice = {
    id: uid("doc"), type: "INVOICE", number, date: todayISO(),
    due_date: addDays(todayISO(), due_days), payment_terms: `Net ${due_days} days`,
    customer_id, subject, origin_of_goods, lines: enrichedLines,
    subtotal, vat, total, vat_exempt: !!vat_exempt, vat_rate_applied: rate,
    amount_paid: 0, status: "Unpaid", related_doc_id: null, proforma_number: null,
    updated_at: nowISO(),
  };
  db.documents.push(invoice);

  postJournal(db, {
    date: todayISO(), description: `Invoice ${number} — Sales Revenue`, ref_type: "INVOICE", ref_id: number,
    lines: [
      { account: "1100", debit: invoice.total },
      { account: "4000", credit: invoice.subtotal },
      { account: "2100", credit: invoice.vat },
    ],
  });
  postJournal(db, {
    date: todayISO(), description: `Invoice ${number} — Cost of Goods Sold`, ref_type: "INVOICE", ref_id: number,
    lines: [{ account: "5000", debit: cogs }, { account: "1200", credit: cogs }],
  });

  return invoice;
}

function generateWaybill(db, invoiceId, meta) {
  const inv = db.documents.find((d) => d.id === invoiceId);
  if (!inv) throw new Error("Invoice not found");
  const number = nextDocNumber(db, "WAYBILL");
  const lines = (meta.lines && meta.lines.length ? meta.lines : inv.lines).map((l, i) => ({
    ...inv.lines[i], ...l,
  }));
  const wb = {
    id: uid("doc"), type: "WAYBILL", number, date: todayISO(),
    customer_id: inv.customer_id, lines, related_doc_id: inv.id, invoice_number: inv.number,
    origin_of_goods: inv.origin_of_goods || "",
    delivery_address: meta.delivery_address || "", contact_person: meta.contact_person || "",
    contact_phone: meta.contact_phone || "", mode_of_transport: meta.mode_of_transport || "Road",
    account_manager: meta.account_manager || "", remarks: meta.remarks || "",
    vehicle_number: meta.vehicle_number || "", driver_name: meta.driver_name || "",
    driver_phone: meta.driver_phone || "", gross_weight: meta.gross_weight || "",
    net_weight: meta.net_weight || "", total_packages: meta.total_packages || "",
    status: "Dispatched",
    updated_at: nowISO(),
  };
  db.documents.push(wb);
  inv.dispatch_status = "Dispatched";
  inv.waybill_number = number;
  inv.updated_at = nowISO();
  return wb;
}

/** Waybill has no stock/accounting effect, so editing its delivery details
 *  in place is always safe — nothing downstream depends on these fields. */
function updateWaybill(db, waybillId, meta) {
  const wb = db.documents.find((d) => d.id === waybillId && d.type === "WAYBILL");
  if (!wb) throw new Error("Waybill not found");
  Object.assign(wb, {
    delivery_address: meta.delivery_address ?? wb.delivery_address,
    contact_person: meta.contact_person ?? wb.contact_person,
    contact_phone: meta.contact_phone ?? wb.contact_phone,
    mode_of_transport: meta.mode_of_transport ?? wb.mode_of_transport,
    account_manager: meta.account_manager ?? wb.account_manager,
    remarks: meta.remarks ?? wb.remarks,
    vehicle_number: meta.vehicle_number ?? wb.vehicle_number,
    driver_name: meta.driver_name ?? wb.driver_name,
    driver_phone: meta.driver_phone ?? wb.driver_phone,
    gross_weight: meta.gross_weight ?? wb.gross_weight,
    net_weight: meta.net_weight ?? wb.net_weight,
    total_packages: meta.total_packages ?? wb.total_packages,
    updated_at: nowISO(),
  });
  if (meta.lines) {
    wb.lines = wb.lines.map((l, i) => ({ ...l, ...(meta.lines[i] || {}) }));
  }
  return wb;
}

function deleteWaybill(db, waybillId) {
  const wb = db.documents.find((d) => d.id === waybillId && d.type === "WAYBILL");
  if (!wb) throw new Error("Waybill not found");
  if (wb.related_doc_id) {
    const inv = db.documents.find((d) => d.id === wb.related_doc_id);
    if (inv) { inv.waybill_number = null; inv.dispatch_status = null; inv.updated_at = nowISO(); }
  }
  wb._deleted = true;
  wb.updated_at = nowISO();
}

/** Only administrative fields are editable on an Invoice — changing the
 *  line items/amounts after the fact would desync stock and the ledger
 *  from what was actually posted, so that's deliberately not allowed here.
 *  Use Delete (if eligible) and re-create instead if the amounts are wrong. */
function updateInvoiceMeta(db, invoiceId, { subject, origin_of_goods, due_date }) {
  const inv = db.documents.find((d) => d.id === invoiceId && d.type === "INVOICE");
  if (!inv) throw new Error("Invoice not found");
  if (subject != null) inv.subject = subject;
  if (origin_of_goods != null) inv.origin_of_goods = origin_of_goods;
  if (due_date != null) inv.due_date = due_date;
  inv.updated_at = nowISO();
  return inv;
}

/** Deleting an Invoice must reverse everything it did: restore the stock
 *  that was deducted and remove the journal entries it posted. To keep
 *  this reversal unambiguous, it's only allowed before any payment has
 *  been recorded and before a Waybill has been generated from it — both
 *  of those create their own downstream records that would be orphaned. */
function deleteInvoice(db, invoiceId) {
  const inv = db.documents.find((d) => d.id === invoiceId && d.type === "INVOICE");
  if (!inv) throw new Error("Invoice not found");
  if ((inv.amount_paid || 0) > 0) {
    throw new Error("Cannot delete an invoice that already has a payment recorded against it.");
  }
  if (inv.waybill_number) {
    throw new Error("Cannot delete an invoice that already has a Waybill. Delete the Waybill first.");
  }

  // Restore the stock this invoice consumed. Exact original batches aren't
  // reconstructed (FIFO consumption may have spanned several), but the
  // total quantity is restored as a clearly-labeled reversal batch so
  // stock levels stay accurate.
  inv.lines.forEach((l) => {
    const product = db.products.find((p) => p.id === l.product_id);
    if (product && Number(l.qty) > 0) {
      db.batches.push({
        id: uid("batch"), product_id: l.product_id, warehouse_id: db.warehouses[0]?.id,
        batch_no: `REVERSED-${inv.number}`, qty: Number(l.qty), unit_cost: product.avg_cost || 0,
        mfg_date: null, expiry_date: null, received_date: todayISO(),
        updated_at: nowISO(),
      });
    }
  });

  // Tombstone the journal entries this invoice posted, rather than hard
  // deleting them — a hard delete could be "undone" by a later merge with
  // a backup from another device that still has the invoice and hadn't
  // seen the deletion yet, silently reviving phantom ledger entries.
  db.journal.forEach((j) => {
    if (j.ref_type === "INVOICE" && j.ref_id === inv.number) {
      j._deleted = true;
      j.updated_at = nowISO();
    }
  });

  // If this invoice came from a converted Proforma, reopen the Proforma
  // so it can be converted again instead of being stuck as "Converted"
  // with no invoice behind it.
  if (inv.related_doc_id) {
    const pf = db.documents.find((d) => d.id === inv.related_doc_id);
    if (pf) { pf.status = "Draft"; pf.related_doc_id = null; pf.updated_at = nowISO(); }
  }

  inv._deleted = true;
  inv.updated_at = nowISO();
}

function recordCustomerPayment(db, invoiceId, amount, date, payment_method = "Bank Transfer") {
  const inv = db.documents.find((d) => d.id === invoiceId);
  if (!inv) throw new Error("Invoice not found");
  inv.amount_paid = (inv.amount_paid || 0) + amount;
  inv.status = inv.amount_paid >= inv.total - 0.01 ? "Paid" : "Partial";
  db.payments.push({ id: uid("pay"), doc_id: invoiceId, doc_number: inv.number, type: "customer", amount, date, payment_method });
  postJournal(db, {
    date, description: `Payment received — Invoice ${inv.number}`, ref_type: "PAYMENT", ref_id: inv.number,
    lines: [{ account: "1000", debit: amount }, { account: "1100", credit: amount }],
  });

  const receiptNumber = nextDocNumber(db, "RECEIPT");
  const receipt = {
    id: uid("doc"), type: "RECEIPT", number: receiptNumber, date,
    customer_id: inv.customer_id, invoice_number: inv.number, related_doc_id: inv.id,
    lines: inv.lines, subtotal: inv.subtotal, vat: inv.vat, invoice_total: inv.total,
    amount, total: amount, payment_method, balance_after: inv.total - inv.amount_paid, status: "Issued",
  };
  db.documents.push(receipt);
  return receipt;
}

function recordSupplierPayment(db, grnDocId, amount, date) {
  const grn = db.documents.find((d) => d.id === grnDocId);
  postJournal(db, {
    date, description: `Payment to supplier — ${grn ? grn.number : "GRN"}`, ref_type: "SUPPLIER_PAYMENT", ref_id: grn ? grn.number : "",
    lines: [{ account: "2000", debit: amount }, { account: "1000", credit: amount }],
  });
  db.payments.push({ id: uid("pay"), doc_id: grnDocId, doc_number: grn ? grn.number : "", type: "supplier", amount, date });
}

function accountBalance(db, code) {
  let debit = 0, credit = 0;
  db.journal.filter((j) => !j._deleted).forEach((j) => j.lines.forEach((l) => { if (l.account === code) { debit += l.debit; credit += l.credit; } }));
  return { debit, credit, net: debit - credit };
}

function trialBalance(db) {
  return ACCOUNTS.map((a) => ({ ...a, ...accountBalance(db, a.code) }));
}

function profitAndLoss(db) {
  const revenue = -accountBalance(db, "4000").net * -1; // credit-normal -> positive
  const rev = accountBalance(db, "4000"); const revenueNet = rev.credit - rev.debit;
  const cogs = accountBalance(db, "5000"); const cogsNet = cogs.debit - cogs.credit;
  const writeoff = accountBalance(db, "5100"); const writeoffNet = writeoff.debit - writeoff.credit;
  const opex = accountBalance(db, "6000"); const opexNet = opex.debit - opex.credit;
  const grossProfit = revenueNet - cogsNet;
  const netProfit = grossProfit - writeoffNet - opexNet;
  return { revenueNet, cogsNet, grossProfit, writeoffNet, opexNet, netProfit };
}

function balanceSheet(db) {
  const cash = accountBalance(db, "1000").net;
  const ar = accountBalance(db, "1100").net;
  const inv = accountBalance(db, "1200").net;
  const totalAssets = cash + ar + inv;
  const ap = -accountBalance(db, "2000").net;
  const vatPayable = -accountBalance(db, "2100").net;
  const totalLiabilities = ap + vatPayable;
  const ownerEquity = -accountBalance(db, "3000").net;
  const { netProfit } = profitAndLoss(db);
  const retainedEarnings = netProfit;
  const totalEquity = ownerEquity + retainedEarnings;
  return { cash, ar, inv, totalAssets, ap, vatPayable, totalLiabilities, ownerEquity, retainedEarnings, totalEquity };
}

function arAging(db) {
  const today = new Date();
  return db.documents
    .filter((d) => d.type === "INVOICE" && !d._deleted && d.status !== "Paid")
    .map((d) => {
      const due = new Date(d.due_date);
      const daysOverdue = Math.floor((today - due) / 86400000);
      const balance = d.total - (d.amount_paid || 0);
      let bucket = "Current";
      if (daysOverdue > 90) bucket = "90+ days";
      else if (daysOverdue > 60) bucket = "61-90 days";
      else if (daysOverdue > 30) bucket = "31-60 days";
      else if (daysOverdue > 0) bucket = "1-30 days";
      return { ...d, daysOverdue, balance, bucket };
    });
}

/* ============================================================
   SHARED UI PRIMITIVES
   ============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      ${FONT_IMPORT}
      .cfe { font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif; color: ${TOKENS.ink}; background: ${TOKENS.paper}; }
      .cfe * { box-sizing: border-box; }
      .cfe .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
      .cfe ::-webkit-scrollbar { width: 8px; height: 8px; }
      .cfe ::-webkit-scrollbar-thumb { background: #D8D4C8; border-radius: 4px; }
      .cfe button { font-family: inherit; cursor: pointer; }
      .cfe input, .cfe select, .cfe textarea { font-family: inherit; }
      .cfe table { border-collapse: collapse; width: 100%; }
      .cfe .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; border: 1px solid transparent; padding: 8px 14px; font-size: 13.5px; font-weight: 600; transition: filter .12s ease, transform .08s ease; }
      .cfe .btn:active { transform: translateY(1px); }
      .cfe .btn-primary { background: ${TOKENS.navy}; color: #fff; }
      .cfe .btn-primary:hover { filter: brightness(1.12); }
      .cfe .btn-amber { background: ${TOKENS.brand}; color: #fff; }
      .cfe .btn-amber:hover { filter: brightness(1.08); }
      .cfe .btn-ghost { background: transparent; border-color: ${TOKENS.line}; color: ${TOKENS.ink}; }
      .cfe .btn-ghost:hover { background: #fff; }
      .cfe .btn-danger { background: #fff; border-color: #E3B3B3; color: ${TOKENS.red}; }
      .cfe .btn-danger:hover { background: #FDF1F1; }
      .cfe .btn-sm { padding: 5px 10px; font-size: 12.5px; }
      .cfe .card { background: ${TOKENS.card}; border: 1px solid ${TOKENS.line}; border-radius: 10px; }
      .cfe .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 100px; font-size: 11.5px; font-weight: 600; letter-spacing: .02em; }
      .cfe th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: ${TOKENS.mute}; font-weight: 600; padding: 9px 12px; border-bottom: 1px solid ${TOKENS.line}; white-space: nowrap; }
      .cfe td { padding: 10px 12px; border-bottom: 1px solid #EFEDE5; font-size: 13.5px; vertical-align: middle; }
      .cfe tr:last-child td { border-bottom: none; }
      .cfe tbody tr:hover { background: #FBFAF6; }
      .cfe .navitem { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 7px; font-size: 13.5px; font-weight: 500; color: #C7CEDE; cursor: pointer; transition: background .12s; }
      .cfe .navitem:hover { background: rgba(255,255,255,0.06); color: #fff; }
      .cfe .navitem.active { background: ${TOKENS.brand}; color: #fff; font-weight: 600; }
      .cfe input[type=text], .cfe input[type=number], .cfe input[type=date], .cfe input[type=email], .cfe input[type=tel], .cfe select, .cfe textarea {
        width: 100%; padding: 8px 10px; border: 1px solid #D8D4C8; border-radius: 6px; font-size: 13.5px; background: #fff; color: ${TOKENS.ink};
      }
      .cfe input:focus, .cfe select:focus, .cfe textarea:focus { outline: 2px solid ${TOKENS.brand}; outline-offset: 0; border-color: ${TOKENS.brand}; }
      .cfe label.field-label { display: block; font-size: 12px; font-weight: 600; color: ${TOKENS.mute}; margin-bottom: 4px; }
      .cfe .kpi { padding: 16px 18px; }
      .cfe .kpi .val { font-family: 'IBM Plex Mono'; font-size: 22px; font-weight: 600; }
      .cfe .modal-overlay { position: fixed; inset: 0; background: rgba(14,26,50,0.55); display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; z-index: 50; overflow-y: auto; }
      .cfe .modal-box { background: #fff; border-radius: 12px; width: 100%; max-width: 720px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
      .cfe .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .cfe .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .cfe .form-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
      .cfe .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .cfe .doc-viewer-scroll { scrollbar-width: thin; scrollbar-color: #C8C4B8 transparent; }
      .cfe .doc-viewer-scroll::-webkit-scrollbar { width: 10px; }
      .cfe .doc-viewer-scroll::-webkit-scrollbar-track { background: transparent; }
      .cfe .doc-viewer-scroll::-webkit-scrollbar-thumb { background: #C8C4B8; border-radius: 6px; border: 2px solid #fff; }
      .cfe .doc-viewer-scroll::-webkit-scrollbar-thumb:hover { background: #A9A392; }
      .cfe .doc-viewer-overlay { padding: 20px; align-items: center; }

      /* ===== App shell: sidebar + hamburger drawer for phones/tablets ===== */
      .cfe .sidebar-close-btn { display: none; background: none; border: none; padding: 4px; cursor: pointer; flex-shrink: 0; }
      .cfe .mobile-menu-btn { display: none; align-items: center; gap: 10px; background: #fff; border: 1px solid ${TOKENS.line}; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; cursor: pointer; color: ${TOKENS.navy}; width: 100%; text-align: left; }
      .cfe .sidebar-backdrop { display: none; }

      @media (max-width: 900px) {
        .cfe { display: block !important; border-radius: 0; border: none; min-height: 100vh; }
        .cfe .app-sidebar {
          position: fixed; inset: 0 auto 0 0; z-index: 60; height: 100vh;
          transform: translateX(-100%); transition: transform .22s ease;
          box-shadow: 8px 0 24px rgba(0,0,0,0.25); overflow-y: auto;
        }
        .cfe .app-sidebar.open { transform: translateX(0); }
        .cfe .sidebar-close-btn { display: block; }
        .cfe .mobile-menu-btn { display: flex; }
        .cfe .sidebar-backdrop {
          display: block; position: fixed; inset: 0; background: rgba(14,26,50,0.5); z-index: 55;
        }
        .cfe .app-main { padding: 14px !important; width: 100%; }
      }
      @media (max-width: 900px) {
        .cfe .form-grid-3, .cfe .form-grid-4 { grid-template-columns: 1fr 1fr; }
        .cfe .dashboard-kpi-grid { grid-template-columns: 1fr 1fr; }
        .cfe .dashboard-content-grid { grid-template-columns: 1fr; }
        .cfe .party-kpi-grid { grid-template-columns: 1fr 1fr; }
        .cfe .reports-aging-grid { grid-template-columns: 1fr 1fr 1fr; }
        .cfe .balance-sheet-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 480px) {
        .cfe .dashboard-kpi-grid { grid-template-columns: 1fr; }
        .cfe .party-kpi-grid { grid-template-columns: 1fr; }
        .cfe .reports-aging-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 640px) {
        .cfe .modal-overlay { padding: 0; align-items: stretch; }
        .cfe .doc-viewer-overlay { padding: 0; align-items: stretch; }
        .cfe .modal-box { max-width: 100% !important; min-height: 100vh; border-radius: 0; margin-top: 0 !important; }
        .cfe .doc-viewer-box { max-height: 100vh !important; height: 100vh; }
        .cfe .form-grid-2, .cfe .form-grid-3, .cfe .form-grid-4 { grid-template-columns: 1fr; }
        .cfe .table-scroll table { min-width: 560px; }
        .cfe .modal-box .card, .cfe .modal-box > div { padding-left: 14px !important; padding-right: 14px !important; }
        .cfe .print-doc { padding: 16px !important; }
        .cfe .doc-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px; }
        .cfe .doc-header-row > div:last-child { text-align: left !important; width: 100%; }
        .cfe .doc-header-row table { width: 100%; }
        .cfe .doc-two-col { flex-direction: column !important; gap: 14px !important; }
        .cfe .section-header { flex-direction: column; align-items: stretch !important; gap: 10px; }
        .cfe .section-header .btn { padding: 6px 12px; font-size: 12.5px; align-self: flex-start; }
      }
      .cfe .hazard-tag { background: repeating-linear-gradient(45deg, ${TOKENS.amber}, ${TOKENS.amber} 6px, #241705 6px, #241705 7px); height: 3px; width: 100%; border-radius: 2px; opacity: .85; }
      @media print {
        .no-print { display: none !important; }
        body * { visibility: hidden; }
        .print-doc, .print-doc * { visibility: visible; }
        .print-doc { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
        .cfe { background: #fff !important; }
      }
    `}</style>
  );
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: "#EEECE3", fg: TOKENS.ink },
    success: { bg: "#DFF3EE", fg: TOKENS.teal },
    warn: { bg: "#FBEBD3", fg: TOKENS.amberDeep },
    danger: { bg: "#FBE3E3", fg: TOKENS.red },
    info: { bg: "#E2E8F5", fg: TOKENS.navy },
  };
  const t = tones[tone] || tones.default;
  return <span className="badge" style={{ background: t.bg, color: t.fg }}>{children}</span>;
}

function statusTone(status) {
  if (["Paid", "Received", "Delivered", "Approved", "Converted", "Issued"].includes(status)) return "success";
  if (["Partial", "Sent", "Dispatched", "Draft"].includes(status)) return "warn";
  if (["Unpaid", "Overdue", "Cancelled"].includes(status)) return "danger";
  return "default";
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: wide ? 920 : 720, marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${TOKENS.line}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

/** A type-to-filter dropdown — used wherever a list can get long enough
 *  that a plain <select> becomes tedious (customers, products). Click or
 *  focus opens the filtered list; picking an item or clicking away closes
 *  it. Falls back to showing everything when the search box is empty. */
function SearchSelect({ options, value, onChange, getLabel, getSub, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((o) => o.id === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => getLabel(o).toLowerCase().includes(q) || (getSub && getSub(o) || "").toLowerCase().includes(q)) : options;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={open ? query : (selected ? getLabel(selected) : "")}
        placeholder={placeholder || "Search…"}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: 6, maxHeight: 200, overflowY: "auto", zIndex: 30, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12.5, color: TOKENS.mute }}>No matches</div>
          ) : filtered.map((o) => (
            <div key={o.id}
              onMouseDown={() => { onChange(o.id); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid #F2F1EA`, background: o.id === value ? "#F5F4EF" : "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F4EF")}
              onMouseLeave={(e) => (e.currentTarget.style.background = o.id === value ? "#F5F4EF" : "#fff")}
            >
              <div style={{ fontWeight: 600 }}>{getLabel(o)}</div>
              {getSub && getSub(o) && <div style={{ fontSize: 11, color: TOKENS.mute }}>{getSub(o)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: TOKENS.mute }}>
      <Icon size={30} style={{ opacity: 0.35, marginBottom: 10 }} />
      <div style={{ fontWeight: 600, color: TOKENS.ink, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 4, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{subtitle}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ============================================================
   PRINTABLE DOCUMENT VIEW — mirrors the Invoice / Proforma /
   Waybill Word templates so on-screen and printed docs match.
   ============================================================ */
function DocLabel({ children, color }) {
  return (
    <span style={{ display: "inline-block", background: color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 4, letterSpacing: ".03em" }}>
      {children}
    </span>
  );
}

function StampBox({ label, name, children }) {
  return (
    <div style={{ flex: 1, fontSize: 11 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {children ? children : (
        <>
          <div style={{ marginBottom: 14 }}>Name: {name || "_______________________"}</div>
          <div>Signature: _______________________</div>
        </>
      )}
    </div>
  );
}

function DocumentView({ db, doc, customer }) {
  const s = db.settings;
  const isWaybill = doc.type === "WAYBILL";
  const isReceipt = doc.type === "RECEIPT";
  const isProforma = doc.type === "PROFORMA";
  const themeColor = isWaybill ? TOKENS.brand : isReceipt ? TOKENS.teal : TOKENS.navy;
  const custName = customer ? customer.name : "[Customer Name]";
  const termsList = (s.terms_conditions || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const paymentTermsList = (s.payment_terms || "").split("\n").map((l) => l.trim()).filter(Boolean);

  const ContactLine = ({ icon: Icon, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TOKENS.mute, marginBottom: 2 }}>
      <Icon size={11} color={themeColor} /> {children}
    </div>
  );

  return (
    <div className="print-doc" style={{ background: "#fff", padding: "26px 30px", fontSize: 13 }}>
      {/* ===== HEADER: logo + name + tagline lockup (left), contact info (right) ===== */}
      <div className="doc-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {s.logo ? <img src={s.logo} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : (
              <div style={{ width: 44, height: 44, borderRadius: 8, border: "1.5px dashed #C8C4B8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FlaskConical size={22} color={themeColor} />
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: themeColor, letterSpacing: ".01em", lineHeight: 1.2 }}>{(s.company_name || "[COMPANY NAME]").toUpperCase()}</div>
            {s.tagline && <div style={{ fontSize: 10, color: TOKENS.brand, fontStyle: "italic", lineHeight: 1.3 }}>{s.tagline}</div>}
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          {/* Fixed legal entity name — deliberately NOT driven by the
              editable Company Name/branding setting. The trading name next
              to the logo can change with rebrands; this stays constant,
              as printed on the company's registration/board letterhead. */}
          <div style={{ fontSize: 14, fontWeight: 800, color: themeColor, letterSpacing: ".01em", marginBottom: 4 }}>ZEEMAX EVOLVE LTD.</div>
          <ContactLine icon={MapPin}>{s.address1 || "[Company Address]"}{s.address2 ? `, ${s.address2}` : ""}</ContactLine>
          <ContactLine icon={Phone}>{s.phone || "[Company Phone]"}</ContactLine>
          <ContactLine icon={Mail}>{s.email || "[company@email.com]"}</ContactLine>
          {s.website && <ContactLine icon={Globe}>{s.website}</ContactLine>}
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${themeColor}, ${TOKENS.brand})` }} />

      {/* ===== TITLE + DOC NUMBER BOX ===== */}
      <div className="doc-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: themeColor }}>
            {isWaybill ? "WAYBILL / DELIVERY NOTE" : DOC_LABELS[doc.type].toUpperCase()}
          </div>
          {isProforma && <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>FOR BUDGETARY & PROCUREMENT PURPOSES ONLY</div>}
          {isReceipt && <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>OFFICIAL PAYMENT RECEIPT</div>}
        </div>
        <table style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 4, fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>{isWaybill ? "Waybill No." : isReceipt ? "Receipt No." : isProforma ? "Proforma No." : "Invoice No."}</td>
              <td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{doc.number}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Date</td>
              <td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{fmtDate(doc.date)}</td>
            </tr>
            {isProforma && (
              <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Validity</td><td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{fmtDate(doc.valid_till)}</td></tr>
            )}
            {doc.type === "INVOICE" && (
              <>
                <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Terms</td><td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{doc.payment_terms || "—"}</td></tr>
                <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Due Date</td><td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{fmtDate(doc.due_date)}</td></tr>
              </>
            )}
            {isWaybill && (
              <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Invoice Ref.</td><td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{doc.invoice_number || "—"}</td></tr>
            )}
            {isReceipt && (
              <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700, borderBottom: `1px solid ${TOKENS.line}` }}>Invoice Ref.</td><td className="mono" style={{ padding: "5px 10px", borderBottom: `1px solid ${TOKENS.line}` }}>{doc.invoice_number || "—"}</td></tr>
            )}
            {!isReceipt && (
              <tr><td style={{ padding: "5px 10px", background: "#F5F4EF", fontWeight: 700 }}>Origin of Goods</td><td className="mono" style={{ padding: "5px 10px" }}>{doc.origin_of_goods || "—"}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== SELLER / BUYER ===== */}
      <div className="doc-two-col" style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 18 }}>
        <div style={{ flex: 1 }}>
          <DocLabel color={themeColor}>{isWaybill ? "FROM (SHIPPER)" : "SELLER"}</DocLabel>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{s.company_name || "[Company Name]"}</div>
          <div style={{ color: TOKENS.mute, fontSize: 11.5, lineHeight: 1.7 }}>
            Phone: {s.phone || "[Company Phone]"}<br />
            Email: {s.email || "[Company Email]"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <DocLabel color={TOKENS.brand}>{isWaybill ? "TO (CONSIGNEE)" : isReceipt ? "RECEIVED FROM" : "BUYER"}</DocLabel>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{custName}</div>
          <div style={{ color: TOKENS.mute, fontSize: 11.5, lineHeight: 1.7 }}>
            Phone: {customer?.phone || "[Customer Phone]"}<br />
            Email: {customer?.email || "[Customer Email]"}
          </div>
        </div>
      </div>

      {doc.subject && !isWaybill && (
        <div style={{ marginTop: 12, fontSize: 12.5 }}><b>Subject:</b> {doc.subject}</div>
      )}

      {/* ===== SECTION BAR + TABLE (all four document types share this structure) ===== */}
      <div style={{ background: themeColor, color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 12px", marginTop: 18, letterSpacing: ".03em" }}>
        {isWaybill ? "GOODS DETAILS" : isProforma ? "QUOTATION DETAILS" : isReceipt ? "ITEMS PAID FOR" : "INVOICE DETAILS"}
      </div>
      <div className="table-scroll">
        <table style={{ width: "100%", fontSize: 12 }}>
          <thead>
          <tr style={{ background: "#F5F4EF" }}>
            <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${TOKENS.line}` }}>S/N</th>
            <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${TOKENS.line}` }}>Description of Goods</th>
            <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${TOKENS.line}` }}>Qty</th>
            <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${TOKENS.line}` }}>Unit</th>
            {isWaybill ? (
              <>
                <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${TOKENS.line}` }}>Batch / Lot</th>
                <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${TOKENS.line}` }}>Weight (KG)</th>
                <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${TOKENS.line}` }}>Remarks</th>
              </>
            ) : (
              <>
                <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${TOKENS.line}` }}>Unit Price (₦)</th>
                <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${TOKENS.line}` }}>Amount (₦)</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #EEE" }}>
              <td style={{ padding: "6px 8px" }}>{i + 1}</td>
              <td style={{ padding: "6px 8px" }}>{l.product_name || l.item_description}</td>
              <td className="mono" style={{ padding: "6px 8px", textAlign: "right" }}>{fmtNum(l.qty)}</td>
              <td style={{ padding: "6px 8px" }}>{l.uom}</td>
              {isWaybill ? (
                <>
                  <td className="mono" style={{ padding: "6px 8px" }}>{l.batch_no || "—"}</td>
                  <td className="mono" style={{ padding: "6px 8px", textAlign: "right" }}>{l.weight_kg || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{l.remarks || "—"}</td>
                </>
              ) : (
                <>
                  <td className="mono" style={{ padding: "6px 8px", textAlign: "right" }}>{fmtNum(l.rate)}</td>
                  <td className="mono" style={{ padding: "6px 8px", textAlign: "right" }}>{fmtMoney(l.qty * l.rate)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {isWaybill ? (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", fontSize: 12, fontWeight: 700, background: "#F5F4EF" }}>
          <span>Total Packages: <span className="mono">{doc.total_packages || "—"}</span></span>
          <span>Total Weight (KG): <span className="mono">{doc.net_weight || "—"}</span></span>
        </div>
      ) : isReceipt ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <table style={{ width: 280, fontSize: 12.5 }}>
            <tbody>
              <tr><td style={{ padding: "4px 8px", color: TOKENS.mute }}>Invoice Total</td><td className="mono" style={{ padding: "4px 8px", textAlign: "right" }}>NGN {fmtMoney(doc.invoice_total)}</td></tr>
              <tr><td style={{ padding: "4px 8px", color: TOKENS.mute }}>Payment Method</td><td style={{ padding: "4px 8px", textAlign: "right" }}>{doc.payment_method || "—"}</td></tr>
              <tr style={{ fontWeight: 700, background: themeColor }}><td style={{ padding: "7px 8px", color: "#fff" }}>Amount Received</td><td className="mono" style={{ padding: "7px 8px", textAlign: "right", color: "#fff" }}>NGN {fmtMoney(doc.amount)}</td></tr>
              <tr style={{ fontWeight: 700, background: doc.balance_after > 0.01 ? "#FBE3E3" : "#DFF3EE" }}>
                <td style={{ padding: "6px 8px" }}>Balance Remaining</td>
                <td className="mono" style={{ padding: "6px 8px", textAlign: "right", color: doc.balance_after > 0.01 ? TOKENS.red : TOKENS.teal }}>NGN {fmtMoney(doc.balance_after)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <table style={{ width: 260, fontSize: 12.5 }}>
            <tbody>
              <tr><td style={{ padding: "4px 8px", color: TOKENS.mute }}>{isProforma ? "Total Estimated Value" : "Subtotal"}</td><td className="mono" style={{ padding: "4px 8px", textAlign: "right" }}>{fmtMoney(doc.subtotal)}</td></tr>
              <tr><td style={{ padding: "4px 8px", color: TOKENS.mute }}>{doc.vat_exempt ? "VAT (Exempt)" : `VAT (${doc.vat_rate_applied != null ? doc.vat_rate_applied : db.settings.vat_rate}%)`}</td><td className="mono" style={{ padding: "4px 8px", textAlign: "right" }}>{fmtMoney(doc.vat)}</td></tr>
              <tr style={{ fontWeight: 700, background: "#F5F4EF" }}><td style={{ padding: "7px 8px" }}>{isProforma ? "Amount Payable" : "Grand Total"}</td><td className="mono" style={{ padding: "7px 8px", textAlign: "right" }}>NGN {fmtMoney(doc.total)}</td></tr>
              {doc.type === "INVOICE" && (
                <tr style={{ fontWeight: 700, background: "#FBE3E3" }}>
                  <td style={{ padding: "6px 8px" }}>Balance Due</td>
                  <td className="mono" style={{ padding: "6px 8px", textAlign: "right", color: TOKENS.red }}>NGN {fmtMoney(doc.total - (doc.amount_paid || 0))}</td>
                </tr>
              )}
                </tbody>
              </table>
            </div>
          )}
      {!isWaybill && (
        <div style={{ fontSize: 11.5, fontStyle: "italic", color: TOKENS.mute, marginTop: 4 }}>
          (Amount in Words): {amountInWords(doc.total)}
        </div>
      )}

      {/* ===== WAYBILL: delivery details block (shown above table normally, kept here for simplicity) ===== */}
      {isWaybill && (
        <div style={{ marginTop: 4 }}>
          <div style={{ background: TOKENS.brand, color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 12px", marginTop: 14, letterSpacing: ".03em" }}>DELIVERY DETAILS</div>
          <table style={{ width: "100%", fontSize: 12 }}>
            <tbody>
              <tr><td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600, width: 150 }}>Delivery Address</td><td style={{ padding: "5px 8px" }} colSpan={3}>{doc.delivery_address || customer?.address || "—"}</td></tr>
              <tr>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Contact Person</td><td style={{ padding: "5px 8px" }}>{doc.contact_person || "—"}</td>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600, width: 110 }}>Phone</td><td style={{ padding: "5px 8px" }}>{doc.contact_phone || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Mode of Transport</td><td style={{ padding: "5px 8px" }}>{doc.mode_of_transport || "Road"}</td>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Vehicle No.</td><td style={{ padding: "5px 8px" }}>{doc.vehicle_number || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Driver Name</td><td style={{ padding: "5px 8px" }}>{doc.driver_name || "—"}</td>
                <td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Driver Phone</td><td style={{ padding: "5px 8px" }}>{doc.driver_phone || "—"}</td>
              </tr>
              <tr><td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Account Manager</td><td style={{ padding: "5px 8px" }} colSpan={3}>{doc.account_manager || "—"}</td></tr>
              <tr><td style={{ padding: "5px 8px", background: "#F5F4EF", fontWeight: 600 }}>Remarks</td><td style={{ padding: "5px 8px" }} colSpan={3}>{doc.remarks || "—"}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#FBE3E3", borderRadius: 6, fontSize: 11.5 }}>
            <b style={{ color: TOKENS.red }}>⚠ Handling Notice:</b> Confirm hazard class and handling precautions on the SDS before loading, transporting, or offloading this consignment.
          </div>
        </div>
      )}

      {/* ===== PAYMENT DETAILS + TERMS (Proforma / Invoice only) ===== */}
      {!isWaybill && !isReceipt && (
        <div style={{ display: "flex", gap: 20, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: themeColor, marginBottom: 6 }}>PAYMENT DETAILS</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.8 }}>
              Bank Name: {s.bank_name || "—"}<br />
              Account Name: {s.bank_account_name || "—"}<br />
              Account Number: {s.bank_account_number || "—"}<br />
              {s.bank_address && <>Bank Address: {s.bank_address}<br /></>}
            </div>
            {paymentTermsList.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 11, color: TOKENS.mute }}>
                {paymentTermsList.map((t, i) => <li key={i} style={{ marginBottom: 2 }}>{t}</li>)}
              </ul>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: themeColor, marginBottom: 6 }}>TERMS & CONDITIONS</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11 }}>
              {termsList.length > 0 ? termsList.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ===== BOTTOM: PREPARED BY / SIGNATORY / STAMP or RECEIVED BY / DISPATCHED BY / STAMP ===== */}
      <div style={{ display: "flex", gap: 20, marginTop: 24, paddingTop: 14, borderTop: `1px solid ${TOKENS.line}` }}>
        {isWaybill ? (
          <>
            <StampBox label="RECEIVED BY (CONSIGNEE)" />
            <StampBox label="DISPATCHED BY" />
          </>
        ) : (
          <>
            <StampBox label="PREPARED BY" name={s.company_name}>
              <div>{s.company_name || "[Company Name]"}</div>
            </StampBox>
            <StampBox label="AUTHORIZED SIGNATORY">
              {s.signature ? <img src={s.signature} alt="signature and stamp" style={{ maxHeight: 55, maxWidth: 150 }} /> : <div>Name: _______________________<br />Position: _______________________</div>}
            </StampBox>
          </>
        )}
        <div style={{ width: 130, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8 }}>COMPANY STAMP</div>
          {s.signature ? (
            <img src={s.signature} alt="stamp" style={{ maxHeight: 60, maxWidth: 120 }} />
          ) : (
            <div style={{ width: 100, height: 60, border: "1.5px dashed #C8C4B8", borderRadius: 4, margin: "0 auto" }} />
          )}
        </div>
      </div>

      <div style={{ background: themeColor, color: "#fff", textAlign: "center", fontSize: 10.5, fontWeight: 600, padding: "8px 12px", marginTop: 20, borderRadius: 3, letterSpacing: ".02em" }}>
        {isWaybill ? (s.waybill_footer_text || "Goods received in good condition and order.") : (s.footer_text || "Powered by Zeemax Digital")}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ db, go }) {
  const stockValue = totalStockValue(db);
  const ar = accountBalance(db, "1100").net;
  const ap = -accountBalance(db, "2000").net;
  const cash = accountBalance(db, "1000").net;
  const lowStock = db.products.filter((p) => !p._deleted && productStock(db, p.id) <= (p.reorder_level || 0));
  const expiringSoon = db.batches.filter((b) => b.expiry_date && b.qty > 0 && new Date(b.expiry_date) < new Date(Date.now() + 60 * 86400000));
  const recentDocs = [...db.documents].filter(d => d.type !== "GRN" && !d._deleted).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
  const hasData = db.products.some((p) => !p._deleted) || db.documents.some((d) => !d._deleted);

  const kpis = [
    { label: "Stock Value", value: `NGN ${fmtMoney(stockValue)}`, icon: Boxes, tone: TOKENS.navy },
    { label: "Accounts Receivable", value: `NGN ${fmtMoney(ar)}`, icon: TrendingUp, tone: TOKENS.teal },
    { label: "Accounts Payable", value: `NGN ${fmtMoney(ap)}`, icon: TrendingDown, tone: TOKENS.red },
    { label: "Cash & Bank", value: `NGN ${fmtMoney(cash)}`, icon: Wallet, tone: TOKENS.amberDeep },
  ];

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="Live snapshot of stock, receivables, and cash position." />
      {!hasData && (
        <EmptyState icon={Beaker} title="No records yet"
          subtitle="This is a blank workspace — add your first product and customer to start raising Proforma Invoices, Invoices, and Waybills that flow straight into the books."
          action={<button className="btn btn-primary" onClick={() => go("products")}>Add your first product <ArrowRight size={14} /></button>} />
      )}
      <div className="dashboard-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: hasData ? 0 : 18 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: TOKENS.mute, fontWeight: 600 }}>{k.label}</span>
              <k.icon size={16} color={k.tone} />
            </div>
            <div className="val" style={{ marginTop: 6 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-content-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Recent Documents</div>
          {recentDocs.length === 0 ? (
            <div style={{ color: TOKENS.mute, fontSize: 13 }}>No sales documents yet.</div>
          ) : (
            <div className="table-scroll">
            <table>
              <thead><tr><th>Type</th><th>Number</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recentDocs.map((d) => (
                  <tr key={d.id}>
                    <td>{DOC_LABELS[d.type]}</td>
                    <td className="mono">{d.number}</td>
                    <td>{fmtDate(d.date)}</td>
                    <td className="mono">{d.total != null ? `NGN ${fmtMoney(d.total)}` : "—"}</td>
                    <td><Badge tone={statusTone(d.status)}>{d.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldAlert size={15} color={TOKENS.amberDeep} /> Alerts
          </div>
          {lowStock.length === 0 && expiringSoon.length === 0 ? (
            <div style={{ color: TOKENS.mute, fontSize: 13 }}>No low-stock or expiry alerts.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lowStock.map((p) => (
                <div key={p.id} style={{ fontSize: 12.5, padding: "8px 10px", background: "#FBEBD3", borderRadius: 6 }}>
                  <b>{productLabel(p)}</b> is at {fmtNum(productStock(db, p.id))} {p.uom_base} — below reorder level ({fmtNum(p.reorder_level)}).
                </div>
              ))}
              {expiringSoon.map((b) => {
                const p = db.products.find((x) => x.id === b.product_id);
                return (
                  <div key={b.id} style={{ fontSize: 12.5, padding: "8px 10px", background: "#FBE3E3", borderRadius: 6 }}>
                    Batch <span className="mono">{b.batch_no}</span> of <b>{p?.name}</b> expires {fmtDate(b.expiry_date)}.
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Boxes size={15} color={TOKENS.brand} /> Stock on Hand
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => go("inventory")}>View Inventory <ArrowRight size={12} /></button>
        </div>
        {db.products.length === 0 ? (
          <div style={{ color: TOKENS.mute, fontSize: 13 }}>No products yet — remaining quantities will appear here once you add products and receive stock.</div>
        ) : (
          <div className="table-scroll">
          <table>
            <thead><tr><th>Product</th><th style={{ textAlign: "right" }}>Remaining Qty</th><th style={{ textAlign: "right" }}>Reorder Level</th><th style={{ textAlign: "right" }}>Stock Value</th></tr></thead>
            <tbody>
              {db.products.map((p) => {
                const stock = productStock(db, p.id);
                const low = stock <= (p.reorder_level || 0);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{productLabel(p)}</td>
                    <td className="mono" style={{ textAlign: "right", color: low ? TOKENS.red : TOKENS.ink, fontWeight: low ? 700 : 400 }}>{fmtNum(stock)} {p.uom_base}</td>
                    <td className="mono" style={{ textAlign: "right", color: TOKENS.mute }}>{fmtNum(p.reorder_level)} {p.uom_base}</td>
                    <td className="mono" style={{ textAlign: "right" }}>NGN {fmtMoney(productStockValue(db, p.id))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
        {subtitle && <div style={{ color: TOKENS.mute, fontSize: 13, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function ProductForm({ db, initial, onSave, onClose, go }) {
  const isNew = !initial;
  const [f, setF] = useState(initial || {
    name: "", brand: "", cas_no: "", uom_base: "KG", density: "", hazard_class: "Non-hazardous", reorder_level: 0,
    opening_qty: "", opening_unit_cost: "", opening_batch_no: "", opening_warehouse_id: db.warehouses[0]?.id || "",
    opening_mfg_date: todayISO(), opening_expiry_date: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const norm = (s) => (s || "").trim().toLowerCase();
  const duplicate = isNew && f.name && db.products.find((p) => !p._deleted && norm(p.name) === norm(f.name) && norm(p.brand) === norm(f.brand));

  return (
    <Modal title={initial ? "Edit Product" : "Add Product"} onClose={onClose}>
      <div className="form-grid-2">
        <Field label="Product Name"><input type="text" value={f.name} onChange={set("name")} placeholder="e.g. Caustic Soda" /></Field>
        <Field label="Brand (optional)"><input type="text" value={f.brand} onChange={set("brand")} placeholder="e.g. KLP" /></Field>
        <Field label="CAS Number"><input type="text" value={f.cas_no} onChange={set("cas_no")} placeholder="e.g. 31566-31-1" /></Field>
        <Field label="Base Unit of Measure"><select value={f.uom_base} onChange={set("uom_base")}>{["KG", "L", "MT", "G", "DRUM", "BAG", "UNIT"].map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Density (kg/L, optional)"><input type="number" step="0.001" value={f.density} onChange={set("density")} placeholder="for unit conversion" /></Field>
        <Field label="Hazard Classification"><select value={f.hazard_class} onChange={set("hazard_class")}>{HAZARD_CLASSES.map((h) => <option key={h}>{h}</option>)}</select></Field>
        <Field label="Reorder Level"><input type="number" value={f.reorder_level} onChange={set("reorder_level")} /></Field>
      </div>

      {duplicate && (
        <div style={{ padding: "10px 12px", background: "#FBE3E3", borderRadius: 6, fontSize: 12.5, marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={15} color={TOKENS.red} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>"{f.name}"{f.brand ? ` (${f.brand})` : ""}" already exists</b> — currently at {fmtNum(productStock(db, duplicate.id))} {duplicate.uom_base}.
            Creating another entry here would split your stock into two separate records instead of adding to the total. Cancel this and use{" "}
            <button className="btn btn-ghost btn-sm" style={{ padding: "1px 6px" }} onClick={() => { onClose(); go && go("inventory"); }}>Goods Receipt</button> on the existing product instead — quantities always sum automatically there, with every delivery kept as its own traceable batch.
          </div>
        </div>
      )}

      {isNew ? (
        <>
          <div style={{ borderTop: `1px solid ${TOKENS.line}`, margin: "14px 0 12px" }} />
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Opening Stock <span style={{ fontWeight: 400, color: TOKENS.mute }}>(optional)</span></div>
          <div style={{ fontSize: 12, color: TOKENS.mute, marginBottom: 10 }}>
            If you already have this chemical in stock, enter it here — it creates the first batch (with its own expiry date) and posts the matching accounting entry, same as a Goods Receipt.
          </div>
          <div className="form-grid-3">
            <Field label="Quantity"><input type="number" value={f.opening_qty} onChange={set("opening_qty")} placeholder="0" /></Field>
            <Field label="Unit Cost (NGN)"><input type="number" value={f.opening_unit_cost} onChange={set("opening_unit_cost")} placeholder="0.00" /></Field>
            <Field label="Warehouse"><select value={f.opening_warehouse_id} onChange={set("opening_warehouse_id")}>{db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            <Field label="Batch / Lot No."><input type="text" value={f.opening_batch_no} onChange={set("opening_batch_no")} placeholder="auto-generated if blank" /></Field>
            <Field label="Manufacture Date"><input type="date" value={f.opening_mfg_date} onChange={set("opening_mfg_date")} /></Field>
            <Field label="Expiry Date"><input type="date" value={f.opening_expiry_date} onChange={set("opening_expiry_date")} /></Field>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 4, fontSize: 12, color: TOKENS.mute, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Boxes size={13} />
          Stock quantities, batches, and expiry dates for this product are managed per-batch in
          <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px" }} onClick={() => { onClose(); go && go("inventory"); }}>Inventory & Stock <ArrowRight size={12} /></button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!f.name || duplicate} onClick={() => onSave(f)}>Save Product</button>
      </div>
    </Modal>
  );
}

function Products({ db, mutate, go }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const list = db.products.filter((p) => !p._deleted && (p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand || "").toLowerCase().includes(q.toLowerCase()) || p.cas_no.toLowerCase().includes(q.toLowerCase())));

  const save = (f) => {
    const ok = mutate((db) => {
      const { opening_qty, opening_unit_cost, opening_batch_no, opening_warehouse_id, opening_mfg_date, opening_expiry_date, ...rest } = f;
      if (f.id) {
        Object.assign(db.products.find((p) => p.id === f.id), rest, {
          reorder_level: Number(rest.reorder_level) || 0,
          density: rest.density === "" || rest.density == null ? null : Number(rest.density),
          updated_at: nowISO(),
        });
      } else {
        const norm = (s) => (s || "").trim().toLowerCase();
        const clash = db.products.find((p) => !p._deleted && norm(p.name) === norm(rest.name) && norm(p.brand) === norm(rest.brand));
        if (clash) {
          throw new Error(`"${rest.name}"${rest.brand ? ` (${rest.brand})` : ""} already exists — use Goods Receipt to add more stock to it instead of creating a duplicate.`);
        }
        const product = {
          id: uid("prod"), avg_cost: 0, ...rest,
          reorder_level: Number(rest.reorder_level) || 0,
          density: rest.density === "" || rest.density == null ? null : Number(rest.density),
          updated_at: nowISO(),
        };
        db.products.push(product);
        const qty = Number(opening_qty) || 0;
        if (qty > 0) {
          receiveStock(db, {
            product_id: product.id,
            warehouse_id: opening_warehouse_id || db.warehouses[0]?.id,
            batch_no: opening_batch_no,
            qty,
            unit_cost: Number(opening_unit_cost) || 0,
            mfg_date: opening_mfg_date || null,
            expiry_date: opening_expiry_date || null,
          });
        }
      }
    });
    if (ok) setModal(null);
  };
  const remove = (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    mutate((db) => {
      const p = db.products.find((p) => p.id === id);
      if (p) { p._deleted = true; p.updated_at = nowISO(); }
    });
  };

  return (
    <div>
      <SectionHeader title="Products" subtitle="Your chemical catalog — CAS numbers, brand, hazard class, and unit of measure."
        action={<button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> Add Product</button>} />
      <div style={{ marginBottom: 12, maxWidth: 320 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: TOKENS.mute }} />
          <input type="text" placeholder="Search name, brand, or CAS no." value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Beaker} title="No products yet" subtitle="Add chemicals you trade — each product tracks its own stock, weighted-average cost, and hazard class."
          action={<button className="btn btn-primary" onClick={() => setModal({})}>Add Product</button>} />
      ) : (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead><tr><th>Product</th><th>Brand</th><th>CAS No.</th><th>Hazard Class</th><th>UOM</th><th style={{ textAlign: "right" }}>In Stock</th><th style={{ textAlign: "right" }}>Avg. Cost</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => {
                const stock = productStock(db, p.id);
                const low = stock <= (p.reorder_level || 0);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.brand || "—"}</td>
                    <td className="mono">{p.cas_no || "—"}</td>
                    <td><Badge tone={p.hazard_class === "Non-hazardous" ? "default" : "warn"}>{p.hazard_class}</Badge></td>
                    <td>{p.uom_base}</td>
                    <td className="mono" style={{ textAlign: "right", color: low ? TOKENS.red : TOKENS.ink, fontWeight: low ? 700 : 400 }}>{fmtNum(stock)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(p.avg_cost)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)}><Pencil size={13} /></button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {modal !== null && <ProductForm db={db} initial={modal.id ? modal : null} onClose={() => setModal(null)} onSave={save} go={go} />}
    </div>
  );
}

/* ============================================================
   INVENTORY — Goods Receipt, Batches, Stock Adjustment
   ============================================================ */
function ReceiptForm({ db, onSave, onClose }) {
  const [f, setF] = useState({
    product_id: db.products[0]?.id || "", warehouse_id: db.warehouses[0]?.id || "",
    supplier_id: "", batch_no: "", qty: "", unit_cost: "", landed_extra: "0",
    mfg_date: todayISO(), expiry_date: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const canSave = f.product_id && f.qty && f.unit_cost;
  return (
    <Modal title="Goods Receipt (Stock In)" onClose={onClose}>
      {db.products.length === 0 ? (
        <EmptyState icon={Beaker} title="Add a product first" subtitle="You need at least one product in the catalog before receiving stock." />
      ) : (
        <>
          <div className="form-grid-2">
            <Field label="Product"><select value={f.product_id} onChange={set("product_id")}>{db.products.map((p) => <option key={p.id} value={p.id}>{productLabel(p)}</option>)}</select></Field>
            <Field label="Warehouse"><select value={f.warehouse_id} onChange={set("warehouse_id")}>{db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            <Field label="Supplier (optional)"><select value={f.supplier_id} onChange={set("supplier_id")}><option value="">— Cash purchase —</option>{db.suppliers.filter((s) => !s._deleted).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Batch / Lot No."><input type="text" value={f.batch_no} onChange={set("batch_no")} placeholder="auto-generated if blank" /></Field>
            <Field label="Quantity"><input type="number" value={f.qty} onChange={set("qty")} /></Field>
            <Field label="Unit Cost (NGN)"><input type="number" value={f.unit_cost} onChange={set("unit_cost")} /></Field>
            <Field label="Landed Cost Extra (freight/duty, NGN total)"><input type="number" value={f.landed_extra} onChange={set("landed_extra")} /></Field>
            <Field label="Manufacture Date"><input type="date" value={f.mfg_date} onChange={set("mfg_date")} /></Field>
            <Field label="Expiry Date"><input type="date" value={f.expiry_date} onChange={set("expiry_date")} /></Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ ...f, qty: Number(f.qty), unit_cost: Number(f.unit_cost), landed_extra: Number(f.landed_extra) || 0 })}>Post Receipt</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function AdjustForm({ db, onSave, onClose }) {
  const [f, setF] = useState({ product_id: db.products[0]?.id || "", warehouse_id: db.warehouses[0]?.id || "", qty_delta: "", reason: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Stock Adjustment" onClose={onClose}>
      <div className="form-grid-2">
        <Field label="Product"><select value={f.product_id} onChange={set("product_id")}>{db.products.map((p) => <option key={p.id} value={p.id}>{productLabel(p)}</option>)}</select></Field>
        <Field label="Warehouse"><select value={f.warehouse_id} onChange={set("warehouse_id")}>{db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        <Field label="Quantity Change (+ add, − remove)"><input type="number" value={f.qty_delta} onChange={set("qty_delta")} placeholder="e.g. -5 for spillage" /></Field>
        <Field label="Reason"><input type="text" value={f.reason} onChange={set("reason")} placeholder="e.g. spillage, damage, count correction" /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!f.product_id || !f.qty_delta} onClick={() => onSave({ ...f, qty_delta: Number(f.qty_delta) })}>Post Adjustment</button>
      </div>
    </Modal>
  );
}

function Inventory({ db, mutate, notify }) {
  const [modal, setModal] = useState(null);
  const batches = [...db.batches].filter((b) => b.qty > 0).sort((a, b) => (a.expiry_date || "9999").localeCompare(b.expiry_date || "9999"));

  const doReceive = (f) => {
    const ok = mutate((db) => receiveStock(db, f));
    if (ok) {
      notify("Goods receipt posted — stock and ledger updated.");
      setModal(null);
    }
  };
  const doAdjust = (f) => {
    const ok = mutate((db) => stockAdjust(db, f));
    if (ok) {
      notify("Stock adjustment posted.");
      setModal(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Inventory & Stock" subtitle="Batch-level stock across warehouses, valued at weighted-average cost."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setModal("adjust")}><ClipboardList size={15} /> Stock Adjustment</button>
            <button className="btn btn-primary" onClick={() => setModal("receive")}><Plus size={15} /> Goods Receipt</button>
          </div>
        } />
      {batches.length === 0 ? (
        <EmptyState icon={Boxes} title="No stock on hand" subtitle="Post a Goods Receipt to bring chemicals into inventory — this automatically debits Inventory and credits Accounts Payable or Cash."
          action={<button className="btn btn-primary" onClick={() => setModal("receive")}>Post Goods Receipt</button>} />
      ) : (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead><tr><th>Product</th><th>Batch / Lot</th><th>Warehouse</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Unit Cost</th><th>Mfg Date</th><th>Expiry</th></tr></thead>
            <tbody>
              {batches.map((b) => {
                const p = db.products.find((x) => x.id === b.product_id);
                const w = db.warehouses.find((x) => x.id === b.warehouse_id);
                const expSoon = b.expiry_date && new Date(b.expiry_date) < new Date(Date.now() + 60 * 86400000);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{productLabel(p)}</td>
                    <td className="mono">{b.batch_no}</td>
                    <td>{w?.name || "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{fmtNum(b.qty)} {p?.uom_base}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(b.unit_cost)}</td>
                    <td>{fmtDate(b.mfg_date)}</td>
                    <td>{b.expiry_date ? <span style={{ color: expSoon ? TOKENS.red : TOKENS.ink, fontWeight: expSoon ? 700 : 400 }}>{fmtDate(b.expiry_date)}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {modal === "receive" && <ReceiptForm db={db} onClose={() => setModal(null)} onSave={doReceive} />}
      {modal === "adjust" && <AdjustForm db={db} onClose={() => setModal(null)} onSave={doAdjust} />}
    </div>
  );
}

/* ============================================================
   CUSTOMERS / SUPPLIERS (shared component, different collection)
   ============================================================ */
function PartyForm({ title, initial, onSave, onClose, showCredit }) {
  const [f, setF] = useState(initial || { name: "", address: "", city_state: "", phone: "", email: "", credit_limit: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={title} onClose={onClose}>
      <div className="form-grid-2">
        <Field label="Name"><input type="text" value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone"><input type="tel" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Address"><input type="text" value={f.address} onChange={set("address")} /></Field>
        <Field label="City / State"><input type="text" value={f.city_state} onChange={set("city_state")} /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set("email")} /></Field>
        {showCredit && <Field label="Credit Limit (NGN)"><input type="number" value={f.credit_limit} onChange={set("credit_limit")} /></Field>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!f.name} onClick={() => onSave(f)}>Save</button>
      </div>
    </Modal>
  );
}

function PartyDetail({ db, party, kind, onClose }) {
  const isCustomer = kind === "customers";
  const docs = db.documents
    .filter((d) => !d._deleted && (isCustomer ? d.customer_id === party.id : d.supplier_id === party.id))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const invoices = docs.filter((d) => d.type === "INVOICE");
  const totalInvoiced = invoices.reduce((s, d) => s + (d.total || 0), 0);
  const totalPaid = invoices.reduce((s, d) => s + (d.amount_paid || 0), 0);
  const outstanding = totalInvoiced - totalPaid;
  const grns = docs.filter((d) => d.type === "GRN");
  const totalPurchased = grns.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <Modal title={`${party.name} — Transaction History`} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 24, fontSize: 13, marginBottom: 6, color: TOKENS.mute }}>
        <div>Phone: <b style={{ color: TOKENS.ink }}>{party.phone || "—"}</b></div>
        <div>Email: <b style={{ color: TOKENS.ink }}>{party.email || "—"}</b></div>
        {party.city_state && <div>{party.city_state}</div>}
      </div>

      {isCustomer ? (
        <div className="party-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, margin: "14px 0" }}>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Proforma Invoices</div>
            <div className="val" style={{ fontSize: 18 }}>{docs.filter((d) => d.type === "PROFORMA").length}</div>
          </div>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Total Invoiced</div>
            <div className="val" style={{ fontSize: 16 }}>NGN {fmtMoney(totalInvoiced)}</div>
          </div>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Total Paid</div>
            <div className="val" style={{ fontSize: 16, color: TOKENS.teal }}>NGN {fmtMoney(totalPaid)}</div>
          </div>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Outstanding Balance</div>
            <div className="val" style={{ fontSize: 16, color: outstanding > 0.01 ? TOKENS.red : TOKENS.ink }}>NGN {fmtMoney(outstanding)}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, margin: "14px 0" }}>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Goods Receipts</div>
            <div className="val" style={{ fontSize: 18 }}>{grns.length}</div>
          </div>
          <div className="card kpi" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.mute, fontWeight: 600 }}>Total Purchased</div>
            <div className="val" style={{ fontSize: 16 }}>NGN {fmtMoney(totalPurchased)}</div>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>All Transactions</div>
      {docs.length === 0 ? (
        <div style={{ color: TOKENS.mute, fontSize: 13 }}>No Proforma Invoices, Invoices, Waybills, or Receipts recorded for {party.name} yet.</div>
      ) : (
        <div className="table-scroll">
        <table>
          <thead><tr><th>Type</th><th>Number</th><th>Date</th><th style={{ textAlign: "right" }}>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{DOC_LABELS[d.type] || d.type}</td>
                <td className="mono">{d.number}</td>
                <td>{fmtDate(d.date)}</td>
                <td className="mono" style={{ textAlign: "right" }}>{d.total != null ? `NGN ${fmtMoney(d.total)}` : "—"}</td>
                <td><Badge tone={statusTone(d.status)}>{d.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Modal>
  );
}

function PartyList({ db, mutate, kind }) {
  const collection = kind === "customers" ? "customers" : "suppliers";
  const label = kind === "customers" ? "Customer" : "Supplier";
  const [modal, setModal] = useState(null);
  const [historyParty, setHistoryParty] = useState(null);
  const list = db[collection].filter((c) => !c._deleted);

  const save = (f) => {
    const ok = mutate((db) => {
      if (f.id) Object.assign(db[collection].find((c) => c.id === f.id), f, { updated_at: nowISO() });
      else db[collection].push({ id: uid(kind.slice(0, 4)), ...f, credit_limit: Number(f.credit_limit) || 0, updated_at: nowISO() });
    });
    if (ok) setModal(null);
  };
  const remove = (id) => {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    mutate((db) => {
      const c = db[collection].find((c) => c.id === id);
      if (c) { c._deleted = true; c.updated_at = nowISO(); }
    });
  };
  const txnCount = (partyId) => db.documents.filter((d) => !d._deleted && (kind === "customers" ? d.customer_id === partyId : d.supplier_id === partyId)).length;

  return (
    <div>
      <SectionHeader title={label + "s"} subtitle={kind === "customers" ? "Buyers you invoice and deliver to — click a name for their full transaction history." : "Vendors you purchase chemicals from."}
        action={<button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> Add {label}</button>} />
      {list.length === 0 ? (
        <EmptyState icon={Users} title={`No ${label.toLowerCase()}s yet`} subtitle={`Add a ${label.toLowerCase()} record — placeholder until you onboard a real client or vendor.`}
          action={<button className="btn btn-primary" onClick={() => setModal({})}>Add {label}</button>} />
      ) : (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City / State</th>{kind === "customers" && <th style={{ textAlign: "right" }}>Credit Limit</th>}<th style={{ textAlign: "right" }}>Transactions</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, cursor: "pointer", color: TOKENS.navy }} onClick={() => setHistoryParty(c)}>{c.name}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.city_state || "—"}</td>
                  {kind === "customers" && <td className="mono" style={{ textAlign: "right" }}>{c.credit_limit ? fmtMoney(c.credit_limit) : "—"}</td>}
                  <td style={{ textAlign: "right" }}><Badge tone="info">{txnCount(c.id)}</Badge></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setHistoryParty(c)}><ClipboardList size={13} /> History</button>{" "}
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}><Pencil size={13} /></button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {modal !== null && <PartyForm title={(modal.id ? "Edit " : "Add ") + label} initial={modal.id ? modal : null} showCredit={kind === "customers"} onClose={() => setModal(null)} onSave={save} />}
      {historyParty && <PartyDetail db={db} party={historyParty} kind={kind} onClose={() => setHistoryParty(null)} />}
    </div>
  );
}

/* ============================================================
   SALES — Proforma Invoice → Invoice → Waybill
   ============================================================ */
function LineItemsEditor({ db, lines, setLines, withRate = true }) {
  const activeProducts = db.products.filter((p) => !p._deleted);
  const addLine = () => setLines([...lines, { product_id: activeProducts[0]?.id || "", qty: "", rate: "" }]);
  const updateLine = (i, patch) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  useEffect(() => { if (lines.length === 0 && activeProducts.length) addLine(); }, []); // eslint-disable-line

  return (
    <div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Description of Goods</th><th style={{ width: 90 }}>Unit</th><th style={{ width: 100 }}>Qty</th>
              {withRate && <th style={{ width: 130 }}>Unit Price (₦)</th>}
              {withRate && <th style={{ width: 130, textAlign: "right" }}>Amount (₦)</th>}
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const product = db.products.find((p) => p.id === l.product_id);
              return (
                <tr key={i}>
                  <td style={{ minWidth: 180 }}>
                    <SearchSelect
                      options={activeProducts}
                      value={l.product_id}
                      onChange={(id) => updateLine(i, { product_id: id })}
                      getLabel={(p) => productLabel(p)}
                      getSub={(p) => p.cas_no}
                      placeholder="Search products…"
                    />
                  </td>
                  <td>{product?.uom_base || "—"}</td>
                  <td><input type="number" value={l.qty} onChange={(e) => updateLine(i, { qty: e.target.value })} /></td>
                  {withRate && <td><input type="number" value={l.rate} onChange={(e) => updateLine(i, { rate: e.target.value })} /></td>}
                  {withRate && <td className="mono" style={{ textAlign: "right" }}>{fmtMoney((Number(l.qty) || 0) * (Number(l.rate) || 0))}</td>}
                  <td><button className="btn btn-ghost btn-sm" onClick={() => removeLine(i)}><X size={13} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addLine}><Plus size={13} /> Add Line</button>
    </div>
  );
}

function ProformaForm({ db, initial, onSave, onClose }) {
  const isEdit = !!initial;
  const activeCustomers = db.customers.filter((c) => !c._deleted);
  const activeProducts = db.products.filter((p) => !p._deleted);
  const [customer_id, setCustomer] = useState(initial?.customer_id || activeCustomers[0]?.id || "");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [origin_of_goods, setOrigin] = useState(initial?.origin_of_goods || "");
  const [valid_days, setValidDays] = useState(14);
  const [applyVat, setApplyVat] = useState(initial ? !initial.vat_exempt : true);
  const [vatRate, setVatRate] = useState(initial && initial.vat_rate_applied != null ? initial.vat_rate_applied : db.settings.vat_rate);
  const [lines, setLines] = useState(initial ? initial.lines.map((l) => ({ product_id: l.product_id, qty: l.qty, rate: l.rate })) : []);
  const totals = lineTotals(lines, applyVat ? Number(vatRate) || 0 : 0);
  const canSave = customer_id && lines.length > 0 && lines.every((l) => l.product_id && Number(l.qty) > 0 && Number(l.rate) >= 0);

  return (
    <Modal title={isEdit ? `Edit Proforma ${initial.number}` : "New Proforma Invoice"} onClose={onClose} wide>
      {activeCustomers.length === 0 || activeProducts.length === 0 ? (
        <EmptyState icon={FileText} title="Add a customer and product first" subtitle="A Proforma Invoice needs at least one customer and one product in the catalog." />
      ) : (
        <>
          <div className="form-grid-4">
            <Field label="Customer"><SearchSelect options={activeCustomers} value={customer_id} onChange={setCustomer} getLabel={(c) => c.name} getSub={(c) => c.phone} placeholder="Search customers…" /></Field>
            <Field label="Subject"><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Glycerol Monostearate" /></Field>
            <Field label="Origin of Goods"><input type="text" value={origin_of_goods} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Local / Imported (China)" /></Field>
            <Field label="Valid For (days)"><input type="number" value={valid_days} onChange={(e) => setValidDays(e.target.value)} /></Field>
          </div>
          <LineItemsEditor db={db} lines={lines} setLines={setLines} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} style={{ width: "auto" }} />
              Apply VAT — uncheck if this customer or sale is VAT-exempt
            </label>
            {applyVat && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                Rate:
                <input type="number" step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} style={{ width: 70 }} />
                %
              </label>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <table style={{ width: 240, fontSize: 13 }}>
              <tbody>
                <tr><td style={{ color: TOKENS.mute }}>Sub Total</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.subtotal)}</td></tr>
                <tr><td style={{ color: TOKENS.mute }}>{applyVat ? `VAT (${vatRate}%)` : "VAT (Exempt)"}</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.vat)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td>Amount Payable</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ customer_id, subject, origin_of_goods, valid_days: Number(valid_days), vat_exempt: !applyVat, vat_rate_override: applyVat ? Number(vatRate) || 0 : 0, lines: lines.map((l) => ({ ...l, qty: Number(l.qty), rate: Number(l.rate) })) })}>{isEdit ? "Save Changes" : "Save Proforma"}</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function InvoiceEditForm({ invoice, onSave, onClose }) {
  const [subject, setSubject] = useState(invoice.subject || "");
  const [origin_of_goods, setOrigin] = useState(invoice.origin_of_goods || "");
  const [due_date, setDueDate] = useState(invoice.due_date || "");

  return (
    <Modal title={`Edit Invoice ${invoice.number}`} onClose={onClose}>
      <div style={{ fontSize: 11.5, color: TOKENS.mute, marginBottom: 10, background: "#F5F4EF", padding: "8px 12px", borderRadius: 6 }}>
        Only administrative details can be edited here — line items and amounts are locked once stock and accounting entries have posted. To change amounts, delete this invoice (if no payment/waybill exists yet) and create it again.
      </div>
      <Field label="Subject"><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      <Field label="Origin of Goods"><input type="text" value={origin_of_goods} onChange={(e) => setOrigin(e.target.value)} /></Field>
      <Field label="Due Date"><input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ subject, origin_of_goods, due_date })}>Save Changes</button>
      </div>
    </Modal>
  );
}

function WaybillForm({ db, invoice, initial, onSave, onClose }) {
  const isEdit = !!initial;
  const source = initial || invoice;
  const customer = db.customers.find((c) => c.id === source.customer_id);
  const [f, setF] = useState(isEdit ? {
    delivery_address: initial.delivery_address || "", contact_person: initial.contact_person || "", contact_phone: initial.contact_phone || "",
    mode_of_transport: initial.mode_of_transport || "Road", vehicle_number: initial.vehicle_number || "", driver_name: initial.driver_name || "",
    driver_phone: initial.driver_phone || "", account_manager: initial.account_manager || "", remarks: initial.remarks || "",
    gross_weight: initial.gross_weight || "", net_weight: initial.net_weight || "", total_packages: initial.total_packages || "",
  } : {
    delivery_address: customer?.address || "", contact_person: "", contact_phone: customer?.phone || "",
    mode_of_transport: "Road", vehicle_number: "", driver_name: "", driver_phone: "",
    account_manager: "", remarks: "", gross_weight: "", net_weight: "", total_packages: "",
  });
  const sourceLines = isEdit ? initial.lines : invoice.lines;
  const [lineExtras, setLineExtras] = useState(sourceLines.map((l) => ({ weight_kg: l.weight_kg || "", remarks: l.remarks || "" })));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setLineExtra = (i, k) => (e) => setLineExtras(lineExtras.map((l, idx) => (idx === i ? { ...l, [k]: e.target.value } : l)));

  const save = () => {
    const lines = sourceLines.map((l, i) => ({ weight_kg: lineExtras[i]?.weight_kg, remarks: lineExtras[i]?.remarks }));
    onSave({ ...f, lines });
  };

  return (
    <Modal title={isEdit ? `Edit Waybill ${initial.number}` : `Generate Waybill for ${invoice.number}`} onClose={onClose} wide>
      <div className="form-grid-2">
        <Field label="Delivery Address"><input type="text" value={f.delivery_address} onChange={set("delivery_address")} /></Field>
        <Field label="Mode of Transport"><select value={f.mode_of_transport} onChange={set("mode_of_transport")}>{["Road", "Sea", "Air", "Rail"].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Contact Person"><input type="text" value={f.contact_person} onChange={set("contact_person")} /></Field>
        <Field label="Contact Phone"><input type="tel" value={f.contact_phone} onChange={set("contact_phone")} /></Field>
        <Field label="Vehicle No."><input type="text" value={f.vehicle_number} onChange={set("vehicle_number")} placeholder="e.g. LND-234-XY" /></Field>
        <Field label="Driver Name"><input type="text" value={f.driver_name} onChange={set("driver_name")} /></Field>
        <Field label="Driver Phone"><input type="tel" value={f.driver_phone} onChange={set("driver_phone")} /></Field>
        <Field label="Account Manager"><input type="text" value={f.account_manager} onChange={set("account_manager")} /></Field>
        <Field label="Total Packages"><input type="text" value={f.total_packages} onChange={set("total_packages")} placeholder="e.g. 15 bags" /></Field>
        <Field label="Total Weight (KG)"><input type="text" value={f.net_weight} onChange={set("net_weight")} placeholder="e.g. 375" /></Field>
        <Field label="Remarks"><input type="text" value={f.remarks} onChange={set("remarks")} /></Field>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, margin: "10px 0 6px" }}>Per-Item Weight & Remarks (optional)</div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Product</th><th style={{ width: 130 }}>Weight (KG)</th><th>Remarks</th></tr></thead>
          <tbody>
            {sourceLines.map((l, i) => {
              const product = db.products.find((p) => p.id === l.product_id);
              return (
                <tr key={i}>
                  <td>{product ? productLabel(product) : l.item_description}</td>
                  <td><input type="text" value={lineExtras[i]?.weight_kg || ""} onChange={setLineExtra(i, "weight_kg")} /></td>
                  <td><input type="text" value={lineExtras[i]?.remarks || ""} onChange={setLineExtra(i, "remarks")} placeholder="e.g. Handle with care" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>{isEdit ? "Save Changes" : "Generate Waybill"}</button>
      </div>
    </Modal>
  );

}

function PaymentForm({ invoice, onSave, onClose }) {
  const balance = invoice.total - (invoice.amount_paid || 0);
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [date, setDate] = useState(todayISO());
  const [payment_method, setPaymentMethod] = useState("Bank Transfer");
  return (
    <Modal title={`Record Payment — ${invoice.number}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: TOKENS.mute, marginBottom: 10 }}>Balance due: <b className="mono" style={{ color: TOKENS.ink }}>NGN {fmtMoney(balance)}</b></div>
      <div className="form-grid-2">
        <Field label="Amount Received (NGN)"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Payment Method"><select value={payment_method} onChange={(e) => setPaymentMethod(e.target.value)}>{["Bank Transfer", "Cash", "Cheque", "POS/Card", "Other"].map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!Number(amount)} onClick={() => onSave(Number(amount), date, payment_method)}>Record Payment</button>
      </div>
    </Modal>
  );
}

function InvoiceForm({ db, onSave, onClose }) {
  const activeCustomers = db.customers.filter((c) => !c._deleted);
  const activeProducts = db.products.filter((p) => !p._deleted);
  const [customer_id, setCustomer] = useState(activeCustomers[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [origin_of_goods, setOrigin] = useState("");
  const [due_days, setDueDays] = useState(14);
  const [applyVat, setApplyVat] = useState(true);
  const [vatRate, setVatRate] = useState(db.settings.vat_rate);
  const [lines, setLines] = useState([]);
  const totals = lineTotals(lines, applyVat ? Number(vatRate) || 0 : 0);
  const canSave = customer_id && lines.length > 0 && lines.every((l) => l.product_id && Number(l.qty) > 0 && Number(l.rate) >= 0);

  return (
    <Modal title="New Invoice" onClose={onClose} wide>
      {activeCustomers.length === 0 || activeProducts.length === 0 ? (
        <EmptyState icon={Receipt} title="Add a customer and product first" subtitle="An Invoice needs at least one customer and one product in the catalog." />
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: TOKENS.mute, marginBottom: 10, background: "#F5F4EF", padding: "8px 12px", borderRadius: 6 }}>
            This raises the Invoice directly — no Proforma Invoice needed first. Stock is deducted and the accounting entries post immediately, exactly as if you had converted a Proforma.
          </div>
          <div className="form-grid-4">
            <Field label="Customer"><SearchSelect options={activeCustomers} value={customer_id} onChange={setCustomer} getLabel={(c) => c.name} getSub={(c) => c.phone} placeholder="Search customers…" /></Field>
            <Field label="Subject"><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Glycerol Monostearate" /></Field>
            <Field label="Origin of Goods"><input type="text" value={origin_of_goods} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Local / Imported (China)" /></Field>
            <Field label="Due In (days)"><input type="number" value={due_days} onChange={(e) => setDueDays(e.target.value)} /></Field>
          </div>
          <LineItemsEditor db={db} lines={lines} setLines={setLines} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} style={{ width: "auto" }} />
              Apply VAT — uncheck if this customer or sale is VAT-exempt
            </label>
            {applyVat && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                Rate:
                <input type="number" step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} style={{ width: 70 }} />
                %
              </label>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <table style={{ width: 240, fontSize: 13 }}>
              <tbody>
                <tr><td style={{ color: TOKENS.mute }}>Sub Total</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.subtotal)}</td></tr>
                <tr><td style={{ color: TOKENS.mute }}>{applyVat ? `VAT (${vatRate}%)` : "VAT (Exempt)"}</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.vat)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td>Grand Total</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totals.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ customer_id, subject, origin_of_goods, due_days: Number(due_days), vat_exempt: !applyVat, vat_rate_override: applyVat ? Number(vatRate) || 0 : 0, lines: lines.map((l) => ({ ...l, qty: Number(l.qty), rate: Number(l.rate) })) })}>Save Invoice</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function Sales({ db, mutate, notify }) {
  const [tab, setTab] = useState("PROFORMA");
  const [modal, setModal] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const docs = db.documents.filter((d) => d.type === tab && !d._deleted).sort((a, b) => (b.number || "").localeCompare(a.number || ""));
  const custName = (id) => db.customers.find((c) => c.id === id)?.name || "—";

  const saveProforma = (data) => {
    const ok = mutate((db) => createProforma(db, data));
    if (ok) {
      notify("Proforma Invoice created.");
      setModal(null);
    }
  };
  const convert = (id) => {
    let createdInvoice;
    const ok = mutate((db) => { createdInvoice = convertProformaToInvoice(db, id); });
    if (ok) {
      notify("Converted to Invoice — stock deducted, journal posted.");
      setTab("INVOICE");
      setModal({ kind: "waybill", doc: createdInvoice });
    }
  };
  const saveInvoice = (data) => {
    let createdInvoice;
    const ok = mutate((db) => { createdInvoice = createInvoiceDirect(db, data); });
    if (ok) {
      notify("Invoice created — stock deducted, journal posted.");
      setTab("INVOICE");
      setModal({ kind: "waybill", doc: createdInvoice });
    }
  };
  const saveWaybill = (invoiceId, meta) => {
    const ok = mutate((db) => generateWaybill(db, invoiceId, meta));
    if (ok) {
      notify("Waybill generated.");
      setModal(null);
      setTab("WAYBILL");
    }
  };
  const savePayment = (invoiceId, amount, date, payment_method) => {
    const ok = mutate((db) => recordCustomerPayment(db, invoiceId, amount, date, payment_method));
    if (ok) {
      notify("Payment recorded — receipt generated, Cash debited, Receivable credited.");
      setModal(null);
      setTab("RECEIPT");
    }
  };

  const isMobilePlatform = typeof window !== "undefined" && window.zeemaxNative?.platform === "android";

  const shareToWhatsApp = (doc) => {
    const customer = db.customers.find((c) => c.id === doc.customer_id);
    const parts = [
      `*${DOC_LABELS[doc.type] || doc.type} - ${doc.number}*`,
      db.settings.company_name ? `From: ${db.settings.company_name}` : null,
      customer ? `To: ${customer.name}` : null,
      doc.date ? `Date: ${fmtDate(doc.date)}` : null,
    ];
    if (doc.type === "RECEIPT") {
      parts.push(`Amount Received: NGN ${fmtMoney(doc.amount)}`);
      if (doc.payment_method) parts.push(`Payment Method: ${doc.payment_method}`);
      if (doc.invoice_number) parts.push(`Ref. Invoice: ${doc.invoice_number}`);
      if (doc.balance_after > 0.01) parts.push(`Balance Remaining: NGN ${fmtMoney(doc.balance_after)}`);
    } else if (doc.total != null) {
      parts.push(`Total: NGN ${fmtMoney(doc.total)}`);
      if (doc.type === "INVOICE") parts.push(`Balance Due: NGN ${fmtMoney(doc.total - (doc.amount_paid || 0))}`);
    }
    const text = parts.filter(Boolean).join("\n");
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (window.zeemaxNative && typeof window.zeemaxNative.openExternal === "function") {
      window.zeemaxNative.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  /** Real PDF generation — actually attaches the formatted document, not
   *  just a text summary. On desktop this saves a .pdf file directly
   *  (jsPDF's built-in browser download). On mobile — where window.print()
   *  doesn't work at all, since Android's WebView has no print pipeline —
   *  this is the ONLY way to get a real copy of the document out of the
   *  app, so it hands the generated PDF to the native Share sheet instead,
   *  with WhatsApp, email, Drive, etc. all available as targets for it. */
  const downloadOrSharePDF = async (doc) => {
    const node = document.querySelector(".print-doc");
    if (!node) return;
    if (isMobilePlatform && typeof window.zeemaxNative?.sharePDF !== "function") {
      notify("Share as PDF isn't available yet on this build — the app needs updating with the latest native bridge.", "error");
      return;
    }
    setPdfBusy(true);
    try {
      const pdf = await generateDocumentPDF(node);
      const safeNumber = (doc.number || "document").replace(/[^A-Za-z0-9-_]/g, "_");
      const filename = `${doc.type}-${safeNumber}.pdf`;
      if (isMobilePlatform) {
        const base64 = stripDataUriPrefix(pdf.output("datauristring"));
        await window.zeemaxNative.sharePDF(base64, filename);
      } else {
        pdf.save(filename);
      }
    } catch (e) {
      notify("Could not generate the PDF: " + e.message, "error");
    }
    setPdfBusy(false);
  };

  const saveInvoiceEdit = (invoiceId, meta) => {
    const ok = mutate((db) => updateInvoiceMeta(db, invoiceId, meta));
    if (ok) {
      notify("Invoice updated.");
      setModal(null);
    }
  };

  const deleteInvoiceRow = (doc) => {
    if (doc.amount_paid > 0) { notify("Cannot delete: a payment is already recorded against this invoice.", "error"); return; }
    if (doc.waybill_number) { notify("Cannot delete: a Waybill already exists for this invoice — delete that first.", "error"); return; }
    if (!confirm(`Delete Invoice ${doc.number}? This restores the stock it deducted and removes its accounting entries. This cannot be undone.`)) return;
    const ok = mutate((db) => deleteInvoice(db, doc.id));
    if (ok) notify("Invoice deleted — stock restored, journal entries reversed.");
  };

  const saveWaybillEdit = (waybillId, meta) => {
    const ok = mutate((db) => updateWaybill(db, waybillId, meta));
    if (ok) {
      notify("Waybill updated.");
      setModal(null);
    }
  };

  const deleteWaybillRow = (doc) => {
    if (!confirm(`Delete Waybill ${doc.number}? The linked Invoice will show as not yet dispatched again. This cannot be undone.`)) return;
    const ok = mutate((db) => deleteWaybill(db, doc.id));
    if (ok) notify("Waybill deleted.");
  };

  const saveProformaEdit = (proformaId, data) => {
    const ok = mutate((db) => updateProforma(db, proformaId, data));
    if (ok) {
      notify("Proforma updated.");
      setModal(null);
    }
  };

  const deleteProformaRow = (doc) => {
    const msg = doc.status === "Converted"
      ? `Proforma ${doc.number} was already converted to an Invoice. Deleting it only removes this quotation record — the Invoice itself is unaffected. Continue?`
      : `Delete Proforma ${doc.number}? This cannot be undone.`;
    if (!confirm(msg)) return;
    const ok = mutate((db) => deleteProforma(db, doc.id));
    if (ok) notify("Proforma deleted.");
  };

  const tabs = [
    { key: "PROFORMA", label: "Proforma Invoices", icon: FileText },
    { key: "INVOICE", label: "Invoices", icon: Receipt },
    { key: "WAYBILL", label: "Waybills", icon: Truck },
    { key: "RECEIPT", label: "Receipts", icon: FileCheck2 },
  ];

  return (
    <div>
      <SectionHeader title="Sales Documents" subtitle="Proforma Invoice → Invoice → Waybill, all linked and traceable — or skip straight to an Invoice."
        action={
          tab === "PROFORMA" ? <button className="btn btn-primary" onClick={() => setModal("new-proforma")}><Plus size={15} /> New Proforma</button> :
          tab === "INVOICE" ? <button className="btn btn-primary" onClick={() => setModal("new-invoice")}><Plus size={15} /> New Invoice</button> :
          null
        } />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, borderBottom: `1px solid ${TOKENS.line}` }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: "none", border: "none", padding: "8px 4px", marginRight: 18, fontSize: 13.5, fontWeight: 600,
              color: tab === t.key ? TOKENS.navy : TOKENS.mute, borderBottom: tab === t.key ? `2px solid ${TOKENS.brand}` : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <t.icon size={14} /> {t.label} <span style={{ color: TOKENS.mute, fontWeight: 400 }}>({db.documents.filter(d => d.type === t.key && !d._deleted).length})</span>
          </button>
        ))}
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={tabs.find(t => t.key === tab).icon} title={`No ${DOC_LABELS[tab].toLowerCase()}s yet`}
          subtitle={tab === "PROFORMA" ? "Create a Proforma Invoice to quote a customer — it has no accounting effect until converted." : tab === "INVOICE" ? "Convert an approved Proforma Invoice to raise an Invoice." : tab === "WAYBILL" ? "Generate a Waybill from a dispatched Invoice." : "A Receipt is generated automatically every time you record a customer payment on an Invoice."} />
      ) : (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Number</th><th>Customer</th><th>Date</th>
                {tab !== "WAYBILL" && <th style={{ textAlign: "right" }}>Total</th>}
                <th>Status</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{d.number}</td>
                  <td>{custName(d.customer_id)}</td>
                  <td>{fmtDate(d.date)}</td>
                  {tab !== "WAYBILL" && <td className="mono" style={{ textAlign: "right" }}>NGN {fmtMoney(d.total)}</td>}
                  <td>
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    {d.type === "INVOICE" && d.waybill_number && <span style={{ marginLeft: 6 }}><Badge tone="info">Dispatched</Badge></span>}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewDoc(d)}><Printer size={13} /> View</button>{" "}
                    {tab === "PROFORMA" && (
                      <>
                        {d.status === "Draft" && (
                          <button className="btn btn-amber btn-sm" onClick={() => convert(d.id)}>Convert to Invoice <ArrowRight size={12} /></button>
                        )}{" "}
                        <button className="btn btn-ghost btn-sm" title={d.status === "Draft" ? "Edit this Proforma" : "Already converted — cannot edit"} disabled={d.status !== "Draft"} onClick={() => setModal({ kind: "edit-proforma", doc: d })}><Pencil size={13} /></button>{" "}
                        <button className="btn btn-danger btn-sm" title="Delete this Proforma" onClick={() => deleteProformaRow(d)}><Trash2 size={13} /></button>
                      </>
                    )}
                    {tab === "INVOICE" && (
                      <>
                        {d.status !== "Paid" && <button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: "pay", doc: d })}>Record Payment</button>}{" "}
                        {!d.waybill_number && <button className="btn btn-amber btn-sm" onClick={() => setModal({ kind: "waybill", doc: d })}>Generate Waybill</button>}{" "}
                        <button className="btn btn-ghost btn-sm" title="Edit subject, origin of goods, due date" onClick={() => setModal({ kind: "edit-invoice", doc: d })}><Pencil size={13} /></button>{" "}
                        <button className="btn btn-danger btn-sm" title={d.amount_paid > 0 ? "Cannot delete: a payment is already recorded" : d.waybill_number ? "Cannot delete: a Waybill already exists — delete that first" : "Delete this invoice"} onClick={() => deleteInvoiceRow(d)}><Trash2 size={13} /></button>
                      </>
                    )}
                    {tab === "WAYBILL" && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: "edit-waybill", doc: d })}><Pencil size={13} /></button>{" "}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteWaybillRow(d)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {modal === "new-proforma" && <ProformaForm db={db} onClose={() => setModal(null)} onSave={saveProforma} />}
      {modal?.kind === "edit-proforma" && <ProformaForm db={db} initial={modal.doc} onClose={() => setModal(null)} onSave={(data) => saveProformaEdit(modal.doc.id, data)} />}
      {modal === "new-invoice" && <InvoiceForm db={db} onClose={() => setModal(null)} onSave={saveInvoice} />}
      {modal?.kind === "waybill" && <WaybillForm db={db} invoice={modal.doc} onClose={() => setModal(null)} onSave={(meta) => saveWaybill(modal.doc.id, meta)} />}
      {modal?.kind === "edit-waybill" && <WaybillForm db={db} initial={modal.doc} onClose={() => setModal(null)} onSave={(meta) => saveWaybillEdit(modal.doc.id, meta)} />}
      {modal?.kind === "edit-invoice" && <InvoiceEditForm invoice={modal.doc} onClose={() => setModal(null)} onSave={(meta) => saveInvoiceEdit(modal.doc.id, meta)} />}
      {modal?.kind === "pay" && <PaymentForm invoice={modal.doc} onClose={() => setModal(null)} onSave={(amt, date, method) => savePayment(modal.doc.id, amt, date, method)} />}

      {viewDoc && (
        <div className="modal-overlay doc-viewer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewDoc(null); }}>
          <div className="modal-box doc-viewer-box" style={{ maxWidth: 780, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div className="no-print doc-viewer-toolbar" style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${TOKENS.line}`, flexShrink: 0, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!isMobilePlatform && (
                  <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={13} /> Print</button>
                )}
                <button className="btn btn-primary btn-sm" disabled={pdfBusy} onClick={() => downloadOrSharePDF(viewDoc)}>
                  <Download size={13} /> {pdfBusy ? "Generating…" : isMobilePlatform ? "Share as PDF" : "Download PDF"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => shareToWhatsApp(viewDoc)}><MessageCircle size={13} /> Share via WhatsApp</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewDoc(null)}><X size={14} /></button>
            </div>
            <div className="doc-viewer-scroll" style={{ overflowY: "auto", flex: 1 }}>
              <DocumentView db={db} doc={{
                ...viewDoc,
                lines: (viewDoc.lines || []).map((l) => ({ ...l, product_name: productLabel(db.products.find((p) => p.id === l.product_id)), uom: db.products.find((p) => p.id === l.product_id)?.uom_base })),
              }} customer={db.customers.find((c) => c.id === viewDoc.customer_id)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACCOUNTING
   ============================================================ */
function Accounting({ db }) {
  const [tab, setTab] = useState("journal");
  const tb = trialBalance(db);
  const pl = profitAndLoss(db);
  const bs = balanceSheet(db);
  const totalDebit = tb.reduce((s, a) => s + a.debit, 0);
  const totalCredit = tb.reduce((s, a) => s + a.credit, 0);
  const visibleJournal = db.journal.filter((j) => !j._deleted);

  const tabs = [
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "ledger", label: "Trial Balance", icon: Calculator },
    { key: "pl", label: "Profit & Loss", icon: TrendingUp },
    { key: "bs", label: "Balance Sheet", icon: Landmark },
  ];

  return (
    <div>
      <SectionHeader title="Accounting" subtitle="Every inventory and sales event above posts here automatically — nothing is entered twice." />
      <div style={{ display: "flex", gap: 6, marginBottom: 14, borderBottom: `1px solid ${TOKENS.line}` }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: "none", border: "none", padding: "8px 4px", marginRight: 18, fontSize: 13.5, fontWeight: 600, color: tab === t.key ? TOKENS.navy : TOKENS.mute, borderBottom: tab === t.key ? `2px solid ${TOKENS.brand}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 6 }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "journal" && (
        visibleJournal.length === 0 ? <EmptyState icon={BookOpen} title="No journal entries yet" subtitle="Post a Goods Receipt or convert a Proforma to an Invoice to see double-entry postings appear here automatically." /> : (
          <div className="card" style={{ padding: 0 }}>
            {[...visibleJournal].reverse().map((j) => (
              <div key={j.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${TOKENS.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{j.description}</span>
                  <span style={{ color: TOKENS.mute }}>{fmtDate(j.date)}</span>
                </div>
                <table style={{ marginTop: 6 }}>
                  <tbody>
                    {j.lines.map((l, i) => (
                      <tr key={i}>
                        <td style={{ paddingLeft: l.debit ? 0 : 24, fontSize: 12.5 }}>{acctName(l.account)}</td>
                        <td className="mono" style={{ textAlign: "right", width: 110, fontSize: 12.5 }}>{l.debit ? fmtMoney(l.debit) : ""}</td>
                        <td className="mono" style={{ textAlign: "right", width: 110, fontSize: 12.5 }}>{l.credit ? fmtMoney(l.credit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "ledger" && (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead><tr><th>Code</th><th>Account</th><th style={{ textAlign: "right" }}>Debit</th><th style={{ textAlign: "right" }}>Credit</th></tr></thead>
            <tbody>
              {tb.map((a) => (
                <tr key={a.code}>
                  <td className="mono">{a.code}</td><td>{a.name}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{a.debit ? fmtMoney(a.debit) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{a.credit ? fmtMoney(a.credit) : "—"}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={2}>Total</td>
                <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totalDebit)}</td>
                <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === "pl" && (
        <div className="card" style={{ padding: 20, maxWidth: 460 }}>
          <Row label="Sales Revenue" value={pl.revenueNet} />
          <Row label="Cost of Goods Sold" value={-pl.cogsNet} />
          <Row label="Gross Profit" value={pl.grossProfit} bold divider />
          <Row label="Inventory Write-offs" value={-pl.writeoffNet} />
          <Row label="Operating Expenses" value={-pl.opexNet} />
          <Row label="Net Profit" value={pl.netProfit} bold divider tone={pl.netProfit >= 0 ? TOKENS.teal : TOKENS.red} />
        </div>
      )}

      {tab === "bs" && (
        <div className="balance-sheet-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 760 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Assets</div>
            <Row label="Cash & Bank" value={bs.cash} />
            <Row label="Accounts Receivable" value={bs.ar} />
            <Row label="Inventory" value={bs.inv} />
            <Row label="Total Assets" value={bs.totalAssets} bold divider />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Liabilities & Equity</div>
            <Row label="Accounts Payable" value={bs.ap} />
            <Row label="VAT Payable" value={bs.vatPayable} />
            <Row label="Total Liabilities" value={bs.totalLiabilities} bold />
            <Row label="Owner's Equity" value={bs.ownerEquity} />
            <Row label="Retained Earnings" value={bs.retainedEarnings} />
            <Row label="Total Equity" value={bs.totalEquity} bold divider />
          </div>
        </div>
      )}
    </div>
  );
}
function Row({ label, value, bold, divider, tone }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: divider ? `1px solid ${TOKENS.line}` : "none", fontWeight: bold ? 700 : 400, fontSize: 13.5 }}>
      <span>{label}</span>
      <span className="mono" style={{ color: tone || TOKENS.ink }}>NGN {fmtMoney(value)}</span>
    </div>
  );
}

/* ============================================================
   REPORTS
   ============================================================ */
function Reports({ db }) {
  const aging = arAging(db);
  const buckets = ["Current", "1-30 days", "31-60 days", "61-90 days", "90+ days"];
  const bucketTotals = buckets.map((b) => aging.filter((a) => a.bucket === b).reduce((s, a) => s + a.balance, 0));

  return (
    <div>
      <SectionHeader title="Reports" subtitle="Stock valuation and receivables aging." />
      <div className="reports-aging-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 18 }}>
        {buckets.map((b, i) => (
          <div key={b} className="card kpi">
            <div style={{ fontSize: 11.5, color: TOKENS.mute, fontWeight: 600 }}>{b}</div>
            <div className="val" style={{ fontSize: 17, marginTop: 4 }}>{fmtMoney(bucketTotals[i])}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Stock Valuation</div>
      {db.products.filter((p) => !p._deleted).length === 0 ? <EmptyState icon={Boxes} title="No products yet" subtitle="Add products to see stock valuation here." /> : (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="table-scroll">
          <table>
            <thead><tr><th>Product</th><th style={{ textAlign: "right" }}>Qty on Hand</th><th style={{ textAlign: "right" }}>Avg. Cost</th><th style={{ textAlign: "right" }}>Value</th></tr></thead>
            <tbody>
              {db.products.filter((p) => !p._deleted).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{productLabel(p)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{fmtNum(productStock(db, p.id))} {p.uom_base}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(p.avg_cost)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(productStockValue(db, p.id))}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}><td colSpan={3}>Total Stock Value</td><td className="mono" style={{ textAlign: "right" }}>{fmtMoney(totalStockValue(db))}</td></tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Accounts Receivable Aging</div>
      {aging.length === 0 ? <EmptyState icon={Receipt} title="No outstanding invoices" subtitle="Unpaid or partially paid invoices will be aged here by days overdue." /> : (
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Due Date</th><th style={{ textAlign: "right" }}>Balance</th><th>Bucket</th></tr></thead>
            <tbody>
              {aging.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.number}</td>
                  <td>{db.customers.find((c) => c.id === a.customer_id)?.name || "—"}</td>
                  <td>{fmtDate(a.due_date)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{fmtMoney(a.balance)}</td>
                  <td><Badge tone={a.bucket === "Current" ? "default" : a.daysOverdue > 60 ? "danger" : "warn"}>{a.bucket}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SETTINGS
   ============================================================ */
function Settings({ db, mutate, notify }) {
  const [f, setF] = useState(db.settings);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const isDesktop = typeof window !== "undefined" && !!window.zeemaxNative && typeof window.zeemaxNative.exportBackup === "function";
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = () => {
    const ok = mutate((db) => { db.settings = { ...f, vat_rate: Number(f.vat_rate) || 0 }; });
    if (ok) notify("Company profile saved.");
  };

  const onImageUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF((prev) => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    if (!confirm("This will permanently erase all products, customers, documents, and journal entries. Continue?")) return;
    const ok = mutate((db) => { Object.assign(db, emptyDB()); });
    if (ok) notify("All data cleared — workspace reset.");
  };

  const restoreBranding = () => {
    if (!confirm("This will reset your company name, logo, address, phone, email, website, and footer text back to the Zeemax defaults. Your products, customers, documents, and other settings (RC/TIN, bank details, VAT rate, terms) are not affected. Continue?")) return;
    const ok = mutate((db) => { restoreDefaultBranding(db); });
    if (!ok) return;
    setF((prev) => {
      const defaults = defaultSettings();
      const next = { ...prev };
      BRANDING_FIELDS.forEach((key) => { next[key] = defaults[key]; });
      return next;
    });
    notify("Branding restored to Zeemax defaults.");
  };

  const doExport = async () => {
    setBackupBusy(true);
    try {
      const result = await window.zeemaxNative.exportBackup();
      if (result.canceled) { setBackupBusy(false); return; }
      notify(`Backup saved to ${result.filePath}`);
    } catch (e) {
      notify("Backup failed: " + e.message, "error");
    }
    setBackupBusy(false);
  };

  const doImport = async () => {
    if (!confirm("This will replace your current data with the contents of the backup file you choose. Your current data is automatically saved as a safety copy first, just in case. Continue?")) return;
    setBackupBusy(true);
    try {
      const result = await window.zeemaxNative.importBackup();
      if (result.canceled) { setBackupBusy(false); return; }
      if (result.error) {
        notify(result.error, "error");
        setBackupBusy(false);
        return;
      }
      notify("Backup restored — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      notify("Restore failed: " + e.message, "error");
      setBackupBusy(false);
    }
  };

  const doMerge = async () => {
    setBackupBusy(true);
    try {
      const result = await window.zeemaxNative.pickMergeFile();
      if (result.canceled) { setBackupBusy(false); return; }
      if (result.error) {
        notify(result.error, "error");
        setBackupBusy(false);
        return;
      }
      let mergeSummary = null;
      const ok = mutate((currentDb) => {
        const { db: merged, summary } = mergeDatabases(currentDb, result.data);
        mergeSummary = summary;
        Object.assign(currentDb, merged);
      });
      if (ok) {
        const parts = MERGE_COLLECTIONS
          .map((key) => {
            const c = mergeSummary && mergeSummary[key];
            if (!c || (!c.added && !c.updated)) return null;
            const bits = [];
            if (c.added) bits.push(`${c.added} new`);
            if (c.updated) bits.push(`${c.updated} updated`);
            return `${bits.join(", ")} ${key}`;
          })
          .filter(Boolean);
        notify(parts.length ? `Merged: ${parts.join(" · ")}.` : "Merge complete — nothing new to bring in.");
      }
    } catch (e) {
      notify("Merge failed: " + e.message, "error");
    }
    setBackupBusy(false);
  };

  const doOpenFolder = () => {
    window.zeemaxNative?.openDataFolder?.();
  };

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Company profile — this appears on every Invoice, Proforma Invoice, Waybill, and Receipt."
        action={<button className="btn btn-ghost btn-sm" onClick={restoreBranding}>Restore Default Zeemax Branding</button>} />
      <div className="card" style={{ padding: 20, maxWidth: 640 }}>
        <div className="form-grid-2" style={{ marginBottom: 4 }}>
          <Field label="Company Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ width: 90, height: 60, border: "1.5px dashed #C8C4B8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {f.logo ? <img src={f.logo} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ fontSize: 10, color: "#AAA" }}>No logo</span>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => logoRef.current.click()}>Upload</button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImageUpload("logo")} />
              {f.logo && <button className="btn btn-danger btn-sm" onClick={() => setF({ ...f, logo: null })}>Remove</button>}
            </div>
          </Field>
          <Field label="Signature & Stamp">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ width: 90, height: 60, border: "1.5px dashed #C8C4B8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {f.signature ? <img src={f.signature} alt="signature and stamp" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ fontSize: 10, color: "#AAA" }}>None</span>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => signatureRef.current.click()}>Upload</button>
              <input ref={signatureRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImageUpload("signature")} />
              {f.signature && <button className="btn btn-danger btn-sm" onClick={() => setF({ ...f, signature: null })}>Remove</button>}
            </div>
          </Field>
        </div>
        <div style={{ fontSize: 11.5, color: TOKENS.mute, marginBottom: 14 }}>
          Tip: scan or photograph your company stamp with a signature over it on plain paper, crop it tight, and upload as one image — it will appear automatically at the bottom of every Proforma Invoice, Invoice, and Receipt.
        </div>
        <div className="form-grid-2">
          <Field label="Company Name"><input type="text" value={f.company_name} onChange={set("company_name")} placeholder="[Company Name]" /></Field>
          <Field label="Tagline (shown under name in sidebar)"><input type="text" value={f.tagline || ""} onChange={set("tagline")} placeholder="e.g. Solutions that Evolve, Results that Last." /></Field>
          <Field label="Phone"><input type="tel" value={f.phone} onChange={set("phone")} placeholder="[Company Phone]" /></Field>
          <Field label="Address Line 1"><input type="text" value={f.address1} onChange={set("address1")} placeholder="[Company Address Line 1]" /></Field>
          <Field label="Address Line 2"><input type="text" value={f.address2} onChange={set("address2")} placeholder="[Company Address Line 2]" /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={set("email")} placeholder="[Company Email]" /></Field>
          <Field label="Website"><input type="text" value={f.website} onChange={set("website")} placeholder="www.yourcompany.com" /></Field>
          <Field label="VAT Rate (%)"><input type="number" value={f.vat_rate} onChange={set("vat_rate")} /></Field>
          <Field label="RC Number"><input type="text" value={f.rc_no} onChange={set("rc_no")} placeholder="[RC No.]" /></Field>
          <Field label="TIN"><input type="text" value={f.tin} onChange={set("tin")} placeholder="[TIN]" /></Field>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, margin: "14px 0 8px" }}>Bank Details</div>
        <div className="form-grid-3">
          <Field label="Bank Name"><input type="text" value={f.bank_name} onChange={set("bank_name")} /></Field>
          <Field label="Account Name"><input type="text" value={f.bank_account_name} onChange={set("bank_account_name")} /></Field>
          <Field label="Account Number"><input type="text" value={f.bank_account_number} onChange={set("bank_account_number")} /></Field>
          <Field label="Bank Address (optional)"><input type="text" value={f.bank_address} onChange={set("bank_address")} /></Field>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, margin: "14px 0 8px" }}>Default Document Text</div>
        <div style={{ fontSize: 11.5, color: TOKENS.mute, marginBottom: 8 }}>One item per line — these print as bullet lists on every Proforma Invoice and Invoice. Edit or reorder anytime.</div>
        <div className="form-grid-2">
          <Field label="Payment Terms"><textarea rows={4} value={f.payment_terms} onChange={set("payment_terms")} /></Field>
          <Field label="Terms & Conditions"><textarea rows={4} value={f.terms_conditions} onChange={set("terms_conditions")} /></Field>
        </div>
        <Field label="Document Footer Text (Proforma / Invoice / Receipt)"><input type="text" value={f.footer_text || ""} onChange={set("footer_text")} placeholder="Powered by Zeemax Digital" /></Field>
        <Field label="Waybill Footer Text"><input type="text" value={f.waybill_footer_text || ""} onChange={set("waybill_footer_text")} placeholder="Goods received in good condition and order." /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn btn-primary" onClick={save}>Save Company Profile</button>
        </div>
      </div>

      {isDesktop && (
        <div className="card" style={{ padding: 20, maxWidth: 640, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Data & Backup</div>
          <div style={{ fontSize: 12.5, color: TOKENS.mute, marginBottom: 12 }}>
            All your data lives in a single file on this computer. Export a copy regularly — especially before a big change or a computer switch.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm" disabled={backupBusy} onClick={doExport}>Export Backup…</button>
            <button className="btn btn-primary btn-sm" disabled={backupBusy} onClick={doMerge}>Merge Backup…</button>
            <button className="btn btn-ghost btn-sm" disabled={backupBusy} onClick={doImport}>Import Backup…</button>
            {typeof window.zeemaxNative?.openDataFolder === "function" && (
              <button className="btn btn-ghost btn-sm" disabled={backupBusy} onClick={doOpenFolder}>Open Data Folder</button>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: TOKENS.mute, marginTop: 10, lineHeight: 1.6 }}>
            <b>Merge</b> combines a backup with what's already here — use this to bring in transactions from another device (phone, another computer) without losing anything on either side. <b>Import</b> fully replaces your current data with the backup instead — only use it to restore from a known-good copy.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20, maxWidth: 640, marginTop: 16, borderColor: "#E3B3B3" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: TOKENS.red, marginBottom: 4 }}>Danger Zone</div>
        <div style={{ fontSize: 12.5, color: TOKENS.mute, marginBottom: 10 }}>Erase every product, customer, document, and ledger entry and start from a clean workspace.</div>
        <button className="btn btn-danger btn-sm" onClick={resetAll}>Reset All Data</button>
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Beaker },
  { key: "inventory", label: "Inventory & Stock", icon: Boxes },
  { key: "customers", label: "Customers", icon: Users },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "sales", label: "Sales Documents", icon: FileCheck2 },
  { key: "accounting", label: "Accounting", icon: Calculator },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="no-print" style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 100,
      background: isError ? "#B4222A" : "#12203A", color: "#fff",
      padding: "12px 18px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8,
      maxWidth: 380,
    }}>
      {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
    </div>
  );
}

export default function ZeemaxERP() {
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const saveTimer = useRef(null);
  const dbLoadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        // Storage key was renamed from "chemflow_db" to "zeemax_db" — fall
        // back to the old key so nobody's saved data goes missing on update.
        let res = await window.storage.get("zeemax_db", false);
        if (!res) res = await window.storage.get("chemflow_db", false);
        const loaded = res ? JSON.parse(res.value) : emptyDB();
        // _brandMigrationDone is kept as a marker for any future one-time
        // branding fix that might be needed — deliberately not doing
        // anything conditional on company_name here anymore, since which
        // name is "correct" has changed hands between sessions before.
        // Forcing a specific name automatically caused more confusion than
        // it solved; the "Restore Default Zeemax Branding" button in
        // Settings is the explicit, opt-in way to reset branding now.
        let migrated = false;
        if (loaded.settings && !loaded.settings._brandMigrationDone) {
          loaded.settings._brandMigrationDone = true;
          migrated = true;
        }
        dbLoadedRef.current = true;
        setDb(loaded);
        // If the migration changed anything, persist it immediately with the
        // exact object just computed — same direct-write path as mutate()
        // below, so this can't race with anything either.
        if (migrated) persistToStorage(loaded);
      } catch {
        dbLoadedRef.current = true;
        setDb(emptyDB());
      }
    })();
  }, []);

  /** Debounced write-through to disk. Takes the exact data object to save
   *  as an argument — deliberately NOT reading React state back out via a
   *  ref or a separate effect watching `db`, because that indirection is
   *  exactly what created a real race before: a person's edit could lose
   *  to an older pending save timer if React's re-render/commit happened
   *  to land after that timer's fire time. By always passing the freshly
   *  computed value straight in, the timer callback can never hold
   *  anything other than the value it was given at the moment it was
   *  scheduled, and each new call's clearTimeout() guarantees only the
   *  most recent one ever actually fires. */
  function persistToStorage(data) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.storage.set("zeemax_db", JSON.stringify(data), false).catch(() => {});
    }, 250);
  }

  function mutate(fn) {
    const next = JSON.parse(JSON.stringify(db));
    try {
      fn(next);
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
      setTimeout(() => setToast(null), 3500);
      return false;
    }
    setDb(next);
    persistToStorage(next);
    return true;
  }

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (!db) {
    return <div className="cfe" style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.mute }}>Loading workspace…</div>;
  }

  const companyLabel = db.settings.company_name || "Zeemax Chemicals";
  const taglineLabel = db.settings.tagline || "Solutions that Evolve, Results that Last.";

  return (
    <div className="cfe" style={{ display: "flex", minHeight: 640, borderRadius: 12, overflow: "hidden", border: `1px solid ${TOKENS.line}`, position: "relative" }}>
      <GlobalStyle />

      {/* Backdrop — only rendered (and only intercepts clicks) while the
          mobile drawer is open; tapping it closes the sidebar, same as
          tapping outside any other overlay in the app. */}
      {mobileNavOpen && (
        <div className="no-print sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className={"no-print app-sidebar" + (mobileNavOpen ? " open" : "")} style={{ width: 226, background: `linear-gradient(180deg, ${TOKENS.navy}, ${TOKENS.navyDeep})`, padding: "18px 12px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 18px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${TOKENS.brand}, ${TOKENS.teal})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {db.settings.logo ? <img src={db.settings.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : <FlaskConical size={17} color="#fff" />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{companyLabel}</div>
            <div style={{ color: "#8FE0AE", fontSize: 9.5, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{taglineLabel}</div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} color="#fff" /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV.map((n) => (
            <div key={n.key} className={"navitem" + (tab === n.key ? " active" : "")} onClick={() => { setTab(n.key); setMobileNavOpen(false); }}>
              <n.icon size={15} /> {n.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 8px 0", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8 }}>
          <div style={{ fontSize: 10.5, color: "#8D97AF", lineHeight: 1.4 }}>Signed in as</div>
          <div style={{ fontSize: 12.5, color: "#E7E9EF", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{companyLabel}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#5C6B87", padding: "10px 8px 2px" }}>
          Powered by Zeemax Digital
        </div>
      </div>

      <div className="app-main" style={{ flex: 1, background: TOKENS.paper, padding: 24, overflowY: "auto", minWidth: 0 }}>
        <button className="no-print mobile-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu size={18} /> <span style={{ fontWeight: 700, fontSize: 13.5 }}>{companyLabel}</span>
        </button>
        {tab === "dashboard" && <Dashboard db={db} go={setTab} />}
        {tab === "products" && <Products db={db} mutate={mutate} go={setTab} />}
        {tab === "inventory" && <Inventory db={db} mutate={mutate} notify={notify} />}
        {tab === "customers" && <PartyList db={db} mutate={mutate} kind="customers" />}
        {tab === "suppliers" && <PartyList db={db} mutate={mutate} kind="suppliers" />}
        {tab === "sales" && <Sales db={db} mutate={mutate} notify={notify} />}
        {tab === "accounting" && <Accounting db={db} />}
        {tab === "reports" && <Reports db={db} />}
        {tab === "settings" && <Settings db={db} mutate={mutate} notify={notify} />}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
