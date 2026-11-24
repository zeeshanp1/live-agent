/** Expense parsing and CSV serialisation. */

import { EXPENSES_CSV_HEADER } from '../config.js';

const CURRENCY_BY_TOKEN = {
  '₹': 'INR',
  rs: 'INR',
  inr: 'INR',
  rupees: 'INR',
  $: 'USD',
  usd: 'USD',
  dollars: 'USD',
  bucks: 'USD',
  '€': 'EUR',
  eur: 'EUR',
  euros: 'EUR',
  '£': 'GBP',
  gbp: 'GBP',
};

const NUMBER = '(\\d[\\d,]*(?:\\.\\d+)?)';
const PREFIX_RE = new RegExp(`(₹|rs\\.?|inr|\\$|usd|€|eur|£|gbp)\\s*${NUMBER}`, 'i');
const SUFFIX_RE = new RegExp(`${NUMBER}\\s*(rupees|rs|inr|usd|dollars|bucks|euros|eur|gbp)\\b`, 'i');
const VERB_RE = new RegExp(`\\b(?:spent|paid|cost|costs|bought\\s+for)\\s+${NUMBER}`, 'i');

const toNumber = (raw) => Number(raw.replace(/,/g, ''));
const toCurrency = (token) => CURRENCY_BY_TOKEN[token.toLowerCase().replace(/\.$/, '')] ?? null;

/**
 * Pull an amount and currency out of free text.
 * @returns {{ amount: number | null, currency: string | null }}
 */
export function parseAmount(text) {
  const str = String(text);
  let m = str.match(PREFIX_RE);
  if (m) return { amount: toNumber(m[2]), currency: toCurrency(m[1]) };
  m = str.match(SUFFIX_RE);
  if (m) return { amount: toNumber(m[1]), currency: toCurrency(m[2]) };
  m = str.match(VERB_RE);
  if (m) return { amount: toNumber(m[1]), currency: null };
  return { amount: null, currency: null };
}

/** Quote a CSV field, and neutralise spreadsheet formula injection (=, +, -, @). */
export function csvField(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvRow(fields) {
  return `${fields.map(csvField).join(',')}\n`;
}

/** Append an expense row, writing the header first when the file is empty. */
export function appendExpense(csv, { timestamp, amount, currency, entry }) {
  const base = csv || EXPENSES_CSV_HEADER;
  return base + csvRow([timestamp, amount ?? '', currency ?? '', entry]);
}
