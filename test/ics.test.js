import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIcs, escapeIcsText, foldLine, formatIcsDate } from '../src/mcp/ics.js';

test('formatIcsDate emits compact UTC', () => {
  assert.equal(formatIcsDate(new Date('2026-11-24T09:05:00.000Z')), '20261124T090500Z');
});

test('escapeIcsText escapes commas, semicolons, backslashes and newlines', () => {
  assert.equal(escapeIcsText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
});

test('foldLine keeps every physical line within 75 octets', () => {
  const folded = foldLine(`DESCRIPTION:${'é'.repeat(200)}`);
  for (const line of folded.split('\r\n')) {
    assert.ok(new TextEncoder().encode(line).length <= 75);
  }
  assert.equal(folded.replace(/\r\n /g, ''), `DESCRIPTION:${'é'.repeat(200)}`);
});

test('buildIcs produces a well-formed VEVENT with CRLF endings', () => {
  const ics = buildIcs({
    id: 'abc',
    summary: 'Meet Priya, 5pm',
    description: 'Meet Priya, 5pm\nbring notes',
    start: new Date('2026-11-24T11:30:00.000Z'),
    end: new Date('2026-11-24T12:30:00.000Z'),
    now: new Date('2026-11-24T04:30:00.000Z'),
  });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('UID:pendant-abc@local\r\n'));
  assert.ok(ics.includes('DTSTART:20261124T113000Z\r\n'));
  assert.ok(ics.includes('SUMMARY:Meet Priya\\, 5pm\r\n'));
  assert.ok(ics.includes('DESCRIPTION:Meet Priya\\, 5pm\\nbring notes\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'no bare LF line endings');
});
