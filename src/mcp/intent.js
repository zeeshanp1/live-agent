/**
 * Rule-based intent detection: maps captured text to a proposed MCP action.
 *
 * Priority (first match wins): expense, then calendar, then note. Money signals
 * outrank scheduling words so "Spent ₹250 on lunch tomorrow" is logged as an
 * expense instead of becoming a calendar event.
 *
 * In the full architecture this layer is replaced by an on-device LLM that drafts
 * a validated JSON-RPC tool call. The return shape stays the same.
 */

import { parseAmount } from './expense.js';
import { nextFullHour, parseWhen } from './datetime.js';

const CALENDAR_RE = /\b(meet|meeting|deadline|due|submit|tomorrow|schedule|appointment|call at)\b/i;
const EXPENSE_RE = /\b(spent|paid|bought|cost|costs|bill|receipt)\b/i;
const NOTE_RE = /\b(note|remember|idea|todo|remind)\b/i;

const EVENT_DURATION_MS = 60 * 60 * 1000;
const SUMMARY_MAX = 64;

/**
 * @param {string} text
 * @param {Date} [now]
 * @returns {{ serverId: 'calendar'|'expenses'|'notes', title: string, payload: object } | null}
 */
export function detectIntent(text, now = new Date()) {
  const amount = parseAmount(text);

  if (amount.amount !== null || EXPENSE_RE.test(text)) {
    return {
      serverId: 'expenses',
      title: 'Log Expense to CSV',
      payload: { entry: text, amount: amount.amount, currency: amount.currency },
    };
  }

  if (CALENDAR_RE.test(text)) {
    const detected = parseWhen(text, now);
    const start = detected ?? nextFullHour(now);
    const end = new Date(start.getTime() + EVENT_DURATION_MS);
    return {
      serverId: 'calendar',
      title: 'Create Calendar Event (.ics)',
      payload: {
        summary: text.slice(0, SUMMARY_MAX),
        description: text,
        start: start.toISOString(),
        end: end.toISOString(),
        timeDetected: detected !== null,
      },
    };
  }

  if (NOTE_RE.test(text)) {
    return {
      serverId: 'notes',
      title: 'Append to Markdown Notes',
      payload: { note: text },
    };
  }

  return null;
}
