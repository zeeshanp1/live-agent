import { ACTION_STATUS } from '../../config.js';
import { escapeHtml, formatDateTime, formatTime } from '../../lib/format.js';

function describe(action) {
  const { payload } = action;
  if (action.serverId === 'calendar') {
    const when = `${formatDateTime(payload.start)}${payload.timeDetected ? '' : ' (default, no time detected)'}`;
    return `${payload.description}\nStarts: ${when}`;
  }
  if (action.serverId === 'expenses') {
    const amount = payload.amount === null ? '' : `\nAmount: ${payload.currency ?? ''} ${payload.amount}`.replace('  ', ' ');
    return `${payload.entry}${amount}`;
  }
  return payload.note ?? '';
}

function renderPending(action) {
  return `
    <div class="bg-surface border border-hairline rounded-lg p-3.5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-chassis border border-hairline text-ink">MCP // ${escapeHtml(action.serverId)}</span>
        <span class="font-mono text-[10px] text-muted">${formatTime(action.timestamp)}</span>
      </div>
      <div>
        <p class="text-sm font-semibold text-ink">${escapeHtml(action.title)}</p>
        <p class="text-xs text-muted mt-1 break-words whitespace-pre-line">${escapeHtml(describe(action))}</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" data-action="approve" data-id="${escapeHtml(action.id)}" class="py-2 px-3 rounded-md bg-ink text-chassis font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-white transition-colors">Approve &amp; Run</button>
        <button type="button" data-action="dismiss" data-id="${escapeHtml(action.id)}" class="py-2 px-3 rounded-md border border-hairline bg-chassis text-muted hover:text-ink font-mono text-[11px] uppercase tracking-wider transition-colors">Dismiss</button>
      </div>
    </div>`;
}

function renderServer(server) {
  const download =
    server.id === 'notes'
      ? '<button type="button" data-action="dl-notes" class="font-mono text-[10px] uppercase text-ink underline underline-offset-4 hover:text-white">Download .md</button>'
      : server.id === 'expenses'
        ? '<button type="button" data-action="dl-expenses" class="font-mono text-[10px] uppercase text-ink underline underline-offset-4 hover:text-white">Download .csv</button>'
        : '';

  return `
    <div class="bg-surface border border-hairline rounded-lg p-3.5 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-ink">${escapeHtml(server.name)}</p>
          <p class="text-xs text-muted mt-0.5">${escapeHtml(server.description)}</p>
        </div>
        <button type="button" data-action="toggle-server" data-id="${escapeHtml(server.id)}" aria-pressed="${server.enabled}" class="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border transition-colors ${server.enabled ? 'bg-ink text-chassis border-ink' : 'bg-chassis text-muted border-hairline'}">
          ${server.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-hairline">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" data-autorun="${escapeHtml(server.id)}" ${server.autoRun ? 'checked' : ''} class="accent-white w-3.5 h-3.5 rounded" />
          <span class="font-mono text-[11px] text-muted">Auto-Run without asking</span>
        </label>
        ${download}
      </div>
    </div>`;
}

export function renderActionsTab({ actions, servers }) {
  const pending = actions.filter((a) => a.status === ACTION_STATUS.PENDING);

  const pendingHtml =
    pending.length === 0
      ? `<div class="border border-dashed border-hairline rounded-lg p-6 text-center">
           <p class="font-mono text-xs uppercase text-muted">No Pending Approvals</p>
           <p class="text-xs text-muted/80 mt-1">Phrases like "meet tomorrow at 5pm", "spent ₹250", or "remember to..." trigger MCP proposals.</p>
         </div>`
      : pending.map(renderPending).join('');

  return `
    <section class="space-y-2.5">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Pending MCP Approvals (${pending.length})</h2>
      ${pendingHtml}
    </section>
    <section class="space-y-2.5 pt-2">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Local MCP Servers</h2>
      ${servers.map(renderServer).join('')}
    </section>`;
}
