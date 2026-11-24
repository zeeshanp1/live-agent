import { ACTION_STATUS, CAPTURE_SOURCES } from '../../config.js';

const metricRow = (label, value) => `
  <div class="bg-surface border border-hairline rounded-lg px-4 py-3 flex items-center justify-between">
    <span class="text-xs text-muted">${label}</span>
    <span class="font-mono text-sm font-bold text-ink">${value}</span>
  </div>`;

const barRow = (label, count, percent) => `
  <div class="space-y-1.5">
    <div class="flex justify-between font-mono text-[11px]">
      <span class="text-muted">${label}</span>
      <span class="text-ink">${count} (${percent}%)</span>
    </div>
    <div class="w-full h-1.5 bg-chassis rounded-full overflow-hidden border border-hairline">
      <div class="h-full bg-ink transition-all duration-300" style="width: ${percent}%"></div>
    </div>
  </div>`;

export function renderInsightsTab({ memories, actions, stats }) {
  const total = memories.length;
  const countBy = (source) => memories.filter((m) => m.source === source).length;
  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));
  const pending = actions.filter((a) => a.status === ACTION_STATUS.PENDING).length;

  const voice = countBy(CAPTURE_SOURCES.VOICE);
  const snap = countBy(CAPTURE_SOURCES.SNAPSHOT);
  const manual = countBy(CAPTURE_SOURCES.MANUAL);

  return `
    <section class="space-y-2">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Real-Time Local Metrics</h2>
      ${metricRow('Total Captured Memories', total)}
      ${metricRow('MCP Actions Executed', stats.executedCount)}
      ${metricRow('Pending Approvals', pending)}
      ${metricRow('Markdown Notes Logged', stats.notesLogged)}
      ${metricRow('Expenses Logged (CSV)', stats.expensesLogged)}
    </section>
    <section class="bg-surface border border-hairline rounded-lg p-4 space-y-3.5">
      <h2 class="font-mono text-[10px] uppercase tracking-widest text-muted">Capture Source Breakdown</h2>
      ${barRow('VOICE (Web Speech)', voice, pct(voice))}
      ${barRow('SNAPSHOT (Camera)', snap, pct(snap))}
      ${barRow('MANUAL (Text)', manual, pct(manual))}
    </section>`;
}
