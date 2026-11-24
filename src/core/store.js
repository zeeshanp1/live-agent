/**
 * Vault state and persistence. Everything lives in the browser's localStorage;
 * nothing leaves the device.
 */

import { ACTION_STATUS, MAX_RESOLVED_ACTIONS, STORAGE_KEY } from '../config.js';

const SCHEMA_VERSION = 2;

export function createDefaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    /** { id, timestamp, source, text, imageData } */
    memories: [],
    /** { id, timestamp, serverId, title, payload, status } */
    actions: [],
    notesMd: '',
    expensesCsv: '',
    stats: { executedCount: 0, notesLogged: 0, expensesLogged: 0 },
    servers: [
      {
        id: 'calendar',
        name: 'Local Calendar MCP',
        description: 'Generates & downloads .ics calendar events on approval',
        enabled: true,
        autoRun: false,
      },
      {
        id: 'notes',
        name: 'Local Markdown Notes MCP',
        description: 'Appends timestamped entries to pendant_notes.md',
        enabled: true,
        autoRun: false,
      },
      {
        id: 'expenses',
        name: 'Local Expense CSV MCP',
        description: 'Logs spending records to pendant_expenses.csv',
        enabled: true,
        autoRun: false,
      },
    ],
  };
}

/** Merge persisted data over the defaults, tolerating missing or malformed fields. */
export function hydrateState(saved) {
  const base = createDefaultState();
  if (!saved || typeof saved !== 'object') return base;

  const savedServers = Array.isArray(saved.servers) ? saved.servers : [];
  return {
    ...base,
    memories: Array.isArray(saved.memories) ? saved.memories : [],
    actions: Array.isArray(saved.actions) ? saved.actions : [],
    notesMd: typeof saved.notesMd === 'string' ? saved.notesMd : '',
    expensesCsv: typeof saved.expensesCsv === 'string' ? saved.expensesCsv : '',
    stats: { ...base.stats, ...(saved.stats && typeof saved.stats === 'object' ? saved.stats : {}) },
    servers: base.servers.map((server) => {
      const match = savedServers.find((s) => s && s.id === server.id);
      return match
        ? { ...server, enabled: Boolean(match.enabled), autoRun: Boolean(match.autoRun) }
        : server;
    }),
  };
}

/** Keep every pending action, but only the newest N resolved ones. */
export function pruneActions(actions, max = MAX_RESOLVED_ACTIONS) {
  let resolvedSeen = 0;
  return actions.filter((action) => {
    if (action.status === ACTION_STATUS.PENDING) return true;
    resolvedSeen += 1;
    return resolvedSeen <= max;
  });
}

/** localStorage can throw on access (private mode, blocked cookies); fall back to memory. */
function resolveStorage(preferred) {
  try {
    const storage = preferred ?? globalThis.localStorage;
    const probe = '__pendant_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    const map = new Map();
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
}

/**
 * @param {{ storage?: Storage, key?: string }} [options]
 */
export function createStore({ storage, key = STORAGE_KEY } = {}) {
  const backend = resolveStorage(storage);

  function load() {
    try {
      const raw = backend.getItem(key);
      return hydrateState(raw ? JSON.parse(raw) : null);
    } catch (err) {
      console.error('Failed to load local vault, starting fresh:', err);
      return createDefaultState();
    }
  }

  const store = {
    state: load(),

    /** @returns {boolean} false when the browser refused the write (quota exceeded). */
    save() {
      store.state.actions = pruneActions(store.state.actions);
      try {
        backend.setItem(key, JSON.stringify(store.state));
        return true;
      } catch {
        return false;
      }
    },

    /** Erase everything and return to a clean vault. */
    reset() {
      backend.removeItem(key);
      store.state = createDefaultState();
    },

    /** Approximate bytes used by this origin's storage (UTF-16, as browsers count it). */
    usageBytes() {
      let total = 0;
      for (let i = 0; i < backend.length; i += 1) {
        const k = backend.key(i);
        total += (k.length + (backend.getItem(k) ?? '').length) * 2;
      }
      return total;
    },
  };

  return store;
}
