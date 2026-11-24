/** RFC 5545 (iCalendar) builder for the local calendar server. */

const CRLF = '\r\n';

/** 2026-11-24T09:00:00.000Z -> 20261124T090000Z */
export function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Escape TEXT values: backslash, semicolon, comma and newlines (RFC 5545, 3.3.11). */
export function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Fold a content line so no physical line exceeds 75 octets (RFC 5545, 3.1). */
export function foldLine(line) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = char;
      bytes = size;
      limit = 74; // continuation lines start with a single space
    } else {
      current += char;
      bytes += size;
    }
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/**
 * @param {{ id: string, summary: string, description?: string, start: Date, end: Date, now?: Date }} event
 */
export function buildIcs({ id, summary, description = '', start, end, now = new Date() }) {
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pendant MCP//Local Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:pendant-${id}@local`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(foldLine)
      .join(CRLF) + CRLF
  );
}
