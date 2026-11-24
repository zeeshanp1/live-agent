import { escapeHtml, formatTime } from '../../lib/format.js';

const CAMERA_ICON =
  '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';

export function matchesQuery(memory, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return memory.text.toLowerCase().includes(q) || memory.source.toLowerCase().includes(q);
}

/** The timeline list on its own, so search can refresh it without losing input focus. */
export function renderTimeline(memories, query) {
  const filtered = memories.filter((m) => matchesQuery(m, query));
  const heading = `Captured Timeline (${filtered.length})`;

  const body =
    filtered.length === 0
      ? `<div class="border border-dashed border-hairline rounded-lg p-8 text-center space-y-1.5">
           <p class="font-mono text-xs uppercase tracking-wider text-muted">${query.trim() ? 'No Matches' : 'Vault Empty'}</p>
           <p class="text-xs text-muted/80">${
             query.trim()
               ? 'Nothing in the local vault matches that search.'
               : 'Capture voice, snap a photo, or log a note above to run the local MCP pipeline.'
           }</p>
         </div>`
      : filtered
          .map(
            (m) => `
          <article class="bg-surface border border-hairline rounded-lg p-3.5 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-chassis border border-hairline text-ink">${escapeHtml(m.source)}</span>
                <span class="font-mono text-[10px] text-muted">${formatTime(m.timestamp)}</span>
              </div>
              <button type="button" data-action="delete-memory" data-id="${escapeHtml(m.id)}" title="Delete entry" aria-label="Delete entry" class="text-muted hover:text-alert transition-colors p-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            ${m.imageData ? `<img src="${escapeHtml(m.imageData)}" alt="Captured snapshot" class="w-full max-h-52 object-cover rounded border border-hairline" />` : ''}
            <p class="text-sm text-ink leading-relaxed break-words">${escapeHtml(m.text)}</p>
          </article>`,
          )
          .join('');

  return `
    <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">${heading}</h2>
    ${body}`;
}

/**
 * @param {{ memories: object[], query: string, bleLabel: string, isRecording: boolean }} ctx
 */
export function renderFeedTab({ memories, query, bleLabel, isRecording }) {
  return `
    <section class="bg-surface border border-hairline rounded-lg p-3.5 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-widest text-muted">Hardware Link</p>
          <p class="text-xs font-semibold text-ink mt-0.5">${escapeHtml(bleLabel)}</p>
        </div>
        <button type="button" data-action="ble-scan" class="px-3 py-1.5 rounded-md border border-hairline bg-chassis hover:bg-surfaceHover font-mono text-[11px] uppercase tracking-wider text-ink transition-colors">
          Scan BLE
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-3 border-t border-hairline">
        <button type="button" data-action="mic" aria-pressed="${isRecording}" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border ${isRecording ? 'border-alert bg-alert/10 text-alert' : 'border-hairline bg-chassis text-ink hover:bg-surfaceHover'} font-mono text-xs uppercase tracking-wider transition-colors">
          <span class="w-2 h-2 rounded-full ${isRecording ? 'bg-alert rec-dot' : 'bg-muted'}"></span>
          ${isRecording ? 'Stop Mic' : 'Mic Capture'}
        </button>
        <button type="button" data-action="snap" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border border-hairline bg-chassis hover:bg-surfaceHover font-mono text-xs uppercase tracking-wider text-ink transition-colors">
          ${CAMERA_ICON}
          Snap Photo
        </button>
      </div>
    </section>

    <input id="search-input" type="text" value="${escapeHtml(query)}" placeholder="Search local vault..." aria-label="Search local vault" autocomplete="off" class="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink transition-colors" />

    <form id="manual-form" class="flex gap-2">
      <input id="manual-input" type="text" placeholder="Type note (e.g. 'Spent ₹250 on lunch')" aria-label="Type a note" autocomplete="off" class="flex-1 min-w-0 bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink transition-colors" />
      <button type="submit" class="px-4 py-2.5 rounded-lg bg-ink text-chassis font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors shrink-0">Save</button>
    </form>

    <section id="timeline" class="space-y-2.5">${renderTimeline(memories, query)}</section>
  `;
}
