/**
 * Tiny natural-language date/time extractor for spoken or typed commitments.
 *
 * Understands: "today", "tonight", "tomorrow", full weekday names (optionally
 * prefixed with "next"/"on"), "5pm", "5:30 pm", "noon", and "at 17:30".
 * A bare "at 4" is read as 4 PM (hours 1 to 7 are assumed to be afternoon).
 *
 * This is intentionally small and predictable. It is not a full NLP parser.
 */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_RE = new RegExp(`\\b(?:next\\s+|on\\s+)?(${WEEKDAYS.join('|')})\\b`);
const DEFAULT_HOUR = 9;

function extractDayOffset(lower, now) {
  if (/\btomorrow\b/.test(lower)) return 1;
  if (/\b(today|tonight)\b/.test(lower)) return 0;
  const match = lower.match(WEEKDAY_RE);
  if (match) {
    const diff = (WEEKDAYS.indexOf(match[1]) - now.getDay() + 7) % 7;
    return diff === 0 ? 7 : diff; // "Friday" said on a Friday means next Friday
  }
  return null;
}

function extractTime(lower) {
  let m = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (m) {
    let hours = Number(m[1]);
    const minutes = Number(m[2] ?? 0);
    if (hours >= 1 && hours <= 12 && minutes < 60) {
      if (m[3] === 'pm' && hours < 12) hours += 12;
      if (m[3] === 'am' && hours === 12) hours = 0;
      return { hours, minutes };
    }
  }

  if (/\bnoon\b/.test(lower)) return { hours: 12, minutes: 0 };

  // "at 17:30", "at 4": skip amounts such as "at 250 rupees".
  m = lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b(?!\s*(?:rs|inr|usd|rupees|dollars|%))/);
  if (m) {
    let hours = Number(m[1]);
    const minutes = Number(m[2] ?? 0);
    if (hours <= 23 && minutes < 60) {
      if (!m[2] && hours >= 1 && hours <= 7) hours += 12;
      return { hours, minutes };
    }
  }
  return null;
}

/**
 * @param {string} text
 * @param {Date} [now]
 * @returns {Date | null} The detected moment, or null when the text names no day or time.
 */
export function parseWhen(text, now = new Date()) {
  const lower = String(text).toLowerCase();
  const dayOffset = extractDayOffset(lower, now);
  const time = extractTime(lower);
  if (dayOffset === null && time === null) return null;

  const result = new Date(now);
  if (dayOffset !== null) result.setDate(result.getDate() + dayOffset);
  result.setHours(time?.hours ?? DEFAULT_HOUR, time?.minutes ?? 0, 0, 0);

  // A bare time that already passed today ("at 9am" said at 11pm) means tomorrow.
  if (dayOffset === null && result <= now) result.setDate(result.getDate() + 1);
  return result;
}

/** Top of the next hour, used when the text does not say when. */
export function nextFullHour(now = new Date()) {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}
