/**
 * Executes an approved action against the matching local "MCP server".
 *
 * These servers are in-process functions that mutate the vault state. They have
 * no DOM access: file downloads are returned as data so the UI layer can decide
 * how to deliver them (and so this module is unit-testable in Node).
 */

import { ACTION_STATUS } from '../config.js';
import { formatIsoTimestamp } from '../lib/format.js';
import { buildIcs } from './ics.js';
import { appendExpense } from './expense.js';

/**
 * @typedef {{ filename: string, content: string, mimeType: string }} OutputFile
 * @typedef {{ message: string, file: OutputFile | null }} ExecutionResult
 */

const handlers = {
  calendar(state, action, now) {
    const { summary, description, start, end } = action.payload;
    const content = buildIcs({
      id: action.id,
      summary,
      description,
      start: new Date(start),
      end: new Date(end),
      now,
    });
    return {
      message: 'Calendar MCP: Downloaded .ics event',
      file: {
        filename: `pendant_event_${String(action.id).slice(0, 8)}.ics`,
        content,
        mimeType: 'text/calendar;charset=utf-8',
      },
    };
  },

  notes(state, action, now) {
    state.notesMd += `- **[${formatIsoTimestamp(now)}]** ${action.payload.note}\n`;
    state.stats.notesLogged += 1;
    return { message: 'Notes MCP: Appended to pendant_notes.md', file: null };
  },

  expenses(state, action, now) {
    const { entry, amount, currency } = action.payload;
    state.expensesCsv = appendExpense(state.expensesCsv, {
      timestamp: formatIsoTimestamp(now),
      amount,
      currency,
      entry,
    });
    state.stats.expensesLogged += 1;
    return { message: 'Expense MCP: Logged to pendant_expenses.csv', file: null };
  },
};

/**
 * @param {object} state Vault state (mutated).
 * @param {object} action A PENDING action.
 * @param {Date} [now]
 * @returns {ExecutionResult}
 */
export function executeAction(state, action, now = new Date()) {
  const handler = handlers[action.serverId];
  if (!handler) throw new Error(`Unknown MCP server: ${action.serverId}`);

  const result = handler(state, action, now);
  state.stats.executedCount += 1;
  action.status = ACTION_STATUS.APPROVED;
  return result;
}
