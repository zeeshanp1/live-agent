import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState, createStore, hydrateState, pruneActions } from '../src/core/store.js';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

test('starts empty with all three servers enabled and ask-first', () => {
  const state = createDefaultState();
  assert.equal(state.memories.length, 0);
  assert.deepEqual(state.servers.map((s) => [s.id, s.enabled, s.autoRun]), [
    ['calendar', true, false],
    ['notes', true, false],
    ['expenses', true, false],
  ]);
});

test('save then reload round-trips state', () => {
  const storage = memoryStorage();
  const a = createStore({ storage, key: 'k' });
  a.state.notesMd = '- hello\n';
  a.state.servers[0].autoRun = true;
  assert.equal(a.save(), true);

  const b = createStore({ storage, key: 'k' });
  assert.equal(b.state.notesMd, '- hello\n');
  assert.equal(b.state.servers[0].autoRun, true);
});

test('corrupt JSON falls back to a clean vault', () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const store = createStore({ storage: memoryStorage({ k: '{not json' }), key: 'k' });
    assert.equal(store.state.memories.length, 0);
  } finally {
    console.error = originalError;
  }
});

test('hydrateState tolerates malformed fields', () => {
  const state = hydrateState({ memories: 'nope', servers: [{ id: 'notes', enabled: false }], stats: null });
  assert.deepEqual(state.memories, []);
  assert.equal(state.servers.find((s) => s.id === 'notes').enabled, false);
  assert.equal(state.servers.length, 3);
  assert.equal(state.stats.executedCount, 0);
});

test('save reports failure when storage throws (quota)', () => {
  const storage = memoryStorage();
  const store = createStore({ storage, key: 'k' });
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.equal(store.save(), false);
});

test('reset wipes persisted data', () => {
  const storage = memoryStorage();
  const store = createStore({ storage, key: 'k' });
  store.state.notesMd = 'secret';
  store.save();
  store.reset();
  assert.equal(storage.getItem('k'), null);
  assert.equal(store.state.notesMd, '');
});

test('pruneActions keeps all pending and only the newest resolved', () => {
  const actions = [
    { id: 1, status: 'PENDING' },
    { id: 2, status: 'APPROVED' },
    { id: 3, status: 'PENDING' },
    { id: 4, status: 'DISMISSED' },
    { id: 5, status: 'APPROVED' },
  ];
  assert.deepEqual(pruneActions(actions, 2).map((a) => a.id), [1, 2, 3, 4]);
});
