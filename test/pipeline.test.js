import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { captureMemory } from '../src/core/pipeline.js';
import { executeAction } from '../src/mcp/executor.js';

const NOW = new Date(2026, 10, 24, 10, 0, 0);

test('ignores empty captures', () => {
  const state = createDefaultState();
  assert.equal(captureMemory(state, { text: '   ', source: 'MANUAL' }, NOW), null);
  assert.equal(state.memories.length, 0);
});

test('image-only capture gets a placeholder caption', () => {
  const state = createDefaultState();
  const { memory } = captureMemory(state, { text: '', source: 'SNAPSHOT', imageData: 'data:image/jpeg;base64,AA' }, NOW);
  assert.equal(memory.text, '[Visual Snapshot Captured]');
});

test('plain text is stored without an action', () => {
  const state = createDefaultState();
  const result = captureMemory(state, { text: 'nice weather', source: 'MANUAL' }, NOW);
  assert.equal(result.action, null);
  assert.equal(state.actions.length, 0);
});

test('an actionable capture queues a PENDING action', () => {
  const state = createDefaultState();
  const { action } = captureMemory(state, { text: 'Spent ₹250 on lunch', source: 'VOICE' }, NOW);
  assert.equal(action.serverId, 'expenses');
  assert.equal(action.status, 'PENDING');
  assert.equal(state.actions.length, 1);
});

test('a disabled server queues nothing', () => {
  const state = createDefaultState();
  state.servers.find((s) => s.id === 'expenses').enabled = false;
  const { action } = captureMemory(state, { text: 'Spent ₹250 on lunch', source: 'VOICE' }, NOW);
  assert.equal(action, null);
});

test('memory and action ids are unique even in the same millisecond', () => {
  const state = createDefaultState();
  const { memory, action } = captureMemory(state, { text: 'remember milk', source: 'MANUAL' }, NOW);
  assert.notEqual(memory.id, action.id);
});

test('approving an expense appends a CSV row and updates stats', () => {
  const state = createDefaultState();
  const { action } = captureMemory(state, { text: 'Spent ₹250 on lunch', source: 'MANUAL' }, NOW);
  const result = executeAction(state, action, NOW);

  assert.equal(result.file, null);
  assert.equal(action.status, 'APPROVED');
  assert.equal(state.stats.executedCount, 1);
  assert.equal(state.stats.expensesLogged, 1);
  assert.match(state.expensesCsv, /"2026-11-24 10:00","250","INR","Spent ₹250 on lunch"/);
});

test('approving a note appends a Markdown line', () => {
  const state = createDefaultState();
  const { action } = captureMemory(state, { text: 'remember milk', source: 'MANUAL' }, NOW);
  executeAction(state, action, NOW);
  assert.equal(state.notesMd, '- **[2026-11-24 10:00]** remember milk\n');
});

test('approving a calendar action returns an .ics file for the detected time', () => {
  const state = createDefaultState();
  const { action } = captureMemory(state, { text: 'Meet Priya tomorrow at 5pm', source: 'MANUAL' }, NOW);
  const { file } = executeAction(state, action, NOW);

  assert.match(file.filename, /^pendant_event_.+\.ics$/);
  assert.equal(file.mimeType, 'text/calendar;charset=utf-8');
  const expectedStart = new Date(2026, 10, 25, 17, 0, 0).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  assert.ok(file.content.includes(`DTSTART:${expectedStart}`));
});

test('unknown server ids are rejected', () => {
  const state = createDefaultState();
  assert.throws(() => executeAction(state, { id: 'x', serverId: 'nope', payload: {} }), /Unknown MCP server/);
});
