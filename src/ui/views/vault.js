import { formatBytes } from '../../lib/format.js';

/** Browsers typically allow about 5 MB of localStorage per origin. */
const APPROX_QUOTA_BYTES = 5 * 1024 * 1024;

export function renderVaultTab({ usageBytes }) {
  const percent = Math.min(100, Math.round((usageBytes / APPROX_QUOTA_BYTES) * 100));

  return `
    <section class="space-y-2.5">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Local Storage &amp; Telemetry</h2>
      <div class="bg-surface border border-hairline rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted">On-Device Vault Footprint</p>
            <p class="font-mono text-[10px] text-muted/70 mt-0.5">Stored strictly in browser localStorage</p>
          </div>
          <span class="font-mono text-base font-bold text-ink">${formatBytes(usageBytes)}</span>
        </div>
        <div class="w-full h-1.5 bg-chassis rounded-full overflow-hidden border border-hairline" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Storage used">
          <div class="h-full ${percent >= 80 ? 'bg-alert' : 'bg-ink'}" style="width: ${percent}%"></div>
        </div>
        <p class="font-mono text-[10px] text-muted/70">${percent}% of ~5 MB browser quota. Photos use the most space.</p>
      </div>
    </section>

    <section class="space-y-2.5">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Data Portability</h2>
      <button type="button" data-action="export-json" class="w-full py-3 px-4 rounded-lg bg-ink text-chassis font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors">
        Export Full Backup (.json)
      </button>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" data-action="dl-notes" class="py-2.5 px-3 rounded-lg border border-hairline bg-surface hover:bg-surfaceHover font-mono text-[11px] uppercase tracking-wider text-ink transition-colors">
          Export Notes (.md)
        </button>
        <button type="button" data-action="dl-expenses" class="py-2.5 px-3 rounded-lg border border-hairline bg-surface hover:bg-surfaceHover font-mono text-[11px] uppercase tracking-wider text-ink transition-colors">
          Export Expenses (.csv)
        </button>
      </div>
    </section>

    <section class="space-y-2.5 pt-4 border-t border-hairline">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-alert">Danger Zone</h2>
      <button type="button" data-action="wipe-open" class="w-full py-3 px-4 rounded-lg border border-alert/60 bg-alert/10 hover:bg-alert hover:text-white text-alert font-mono text-xs font-bold uppercase tracking-wider transition-colors">
        Panic Wipe All Local Data
      </button>
    </section>`;
}
