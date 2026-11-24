import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectIntent } from '../src/mcp/intent.js';

const NOW = new Date(2026, 10, 24, 10, 0, 0);

test('returns null for plain chatter', () => {
  assert.equal(detectIntent('what a lovely day', NOW), null);
});

test('calendar intent carries a parsed start/end', () => {
  const intent = detectIntent('Meet Priya tomorrow at 5pm', NOW);
  assert.equal(intent.serverId, 'calendar');
  assert.equal(intent.payload.timeDetected, true);
  const start = new Date(intent.payload.start);
  const end = new Date(intent.payload.end);
  assert.equal(start.getHours(), 17);
  assert.equal(end - start, 60 * 60 * 1000);
});

test('calendar falls back to the next full hour when no time is given', () => {
  const intent = detectIntent('schedule the review', NOW);
  assert.equal(intent.serverId, 'calendar');
  assert.equal(intent.payload.timeDetected, false);
  assert.equal(new Date(intent.payload.start).getHours(), 11);
});

test('expense outranks calendar when both signals are present', () => {
  const intent = detectIntent('Spent ₹250 on lunch tomorrow', NOW);
  assert.equal(intent.serverId, 'expenses');
  assert.equal(intent.payload.amount, 250);
  assert.equal(intent.payload.currency, 'INR');
});

test('note intent', () => {
  const intent = detectIntent('remember to water the plants', NOW);
  assert.equal(intent.serverId, 'notes');
  assert.equal(intent.payload.note, 'remember to water the plants');
});
