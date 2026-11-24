/** Small, dependency-free formatting helpers. */

const pad = (n) => String(n).padStart(2, '0');

/** Escape a value for safe interpolation into HTML text or a quoted attribute. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "14:05 • 24 NOV" in the user's locale. */
export function formatTime(timestamp) {
  const d = new Date(timestamp);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = d.toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase();
  return `${time} • ${date}`;
}

/** "Tue 25 Nov, 09:00" in the user's locale, used for calendar previews. */
export function formatDateTime(value) {
  const d = new Date(value);
  const date = d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time}`;
}

/** "2026-11-24 09:05" in local time (what a person expects to see in a notes file). */
export function formatIsoTimestamp(value) {
  const d = new Date(value);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Human-readable byte size: 512 B, 12.3 KB, 1.20 MB. */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
