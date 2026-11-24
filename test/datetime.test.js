import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextFullHour, parseWhen } from '../src/mcp/datetime.js';

// Tuesday 24 Nov 2026, 10:00 local time
const NOW = new Date(2026, 10, 24, 10, 0, 0);

test('returns null when no day or time is mentioned', () => {
  assert.equal(parseWhen('buy milk', NOW), null);
});

test('"tomorrow" with no time defaults to 09:00', () => {
  const d = parseWhen('submit report tomorrow', NOW);
  assert.deepEqual([d.getDate(), d.getHours(), d.getMinutes()], [25, 9, 0]);
});

test('parses "5pm" and "5:30 pm"', () => {
  assert.equal(parseWhen('meet tomorrow at 5pm', NOW).getHours(), 17);
  const d = parseWhen('call tomorrow 5:30 pm', NOW);
  assert.deepEqual([d.getHours(), d.getMinutes()], [17, 30]);
});

test('handles 12am and 12pm', () => {
  assert.equal(parseWhen('tomorrow 12am', NOW).getHours(), 0);
  assert.equal(parseWhen('tomorrow 12pm', NOW).getHours(), 12);
});

test('"at 4" is read as 4 PM, "at 17:30" as 24h', () => {
  assert.equal(parseWhen('call at 4', NOW).getHours(), 16);
  const d = parseWhen('meet at 17:30', NOW);
  assert.deepEqual([d.getHours(), d.getMinutes()], [17, 30]);
});

test('weekday resolves to the next occurrence, never today', () => {
  const friday = parseWhen('meet on friday', NOW);
  assert.equal(friday.getDay(), 5);
  assert.equal(friday.getDate(), 27);

  const tuesday = parseWhen('meeting tuesday at 3pm', NOW); // NOW is a Tuesday
  assert.equal(tuesday.getDate(), 1); // Dec 1
});

test('a bare time already past today rolls to tomorrow', () => {
  const d = parseWhen('call at 9am', NOW);
  assert.equal(d.getDate(), 25);
  assert.equal(d.getHours(), 9);
});

test('an amount after "at" is not mistaken for a time', () => {
  assert.equal(parseWhen('bought lunch at 250 rupees', NOW), null);
});

test('nextFullHour rounds up to the next hour', () => {
  const d = nextFullHour(new Date(2026, 10, 24, 23, 49));
  assert.deepEqual([d.getDate(), d.getHours(), d.getMinutes()], [25, 0, 0]);
});
