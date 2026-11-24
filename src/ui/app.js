/**
 * UI controller: owns view state, renders the active tab, and routes events.
 * Business logic lives in core/ and mcp/; this file only wires them to the DOM.
 */

import {
  ACTION_STATUS,
  CAPTURE_SOURCES,
  EMPTY_NOTES_MD,
  EXPENSES_CSV_HEADER,
  TOAST_DURATION_MS,
} from '../config.js';
import { createStore } from '../core/store.js';
import { captureMemory } from '../core/pipeline.js';
import { executeAction } from '../mcp/executor.js';
import { downloadFile } from '../lib/download.js';
import { isBleSupported, pairDevice } from '../services/ble.js';
import { createRecognizer, isSpeechSupported } from '../services/speech.js';
import { compressImage } from '../services/snapshot.js';
import { renderFeedTab, renderTimeline } from './views/feed.js';
import { renderActionsTab } from './views/actions.js';
import { renderInsightsTab } from './views/insights.js';
import { renderVaultTab } from './views/vault.js';

const ACTIVE_NAV = 'text-ink bg-chassis border border-hairline';
const IDLE_NAV = 'text-muted hover:text-ink border border-transparent';
const NAV_BASE = 'nav-btn relative flex flex-col items-center justify-center py-2 rounded-lg transition-colors';

export function startApp() {
  const store = createStore();
  const $ = (id) => document.getElementById(id);

  const ui = {
    tab: 'feed',
    query: '',
    ble: { status: 'idle', name: null }, // idle | scanning | paired
    isRecording: false,
    recognizer: null,
    toastTimer: null,
  };

  // ---------------------------------------------------------------- helpers
  function toast(message) {
    const el = $('toast');
    $('toast-text').textContent = message;
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-2');
      el.classList.remove('opacity-100', 'translate-y-0');
    }, TOAST_DURATION_MS);
  }

  function persist() {
    if (!store.save()) toast('Storage quota exceeded. Delete old snapshots to free space.');
  }

  function bleLabel() {
    if (ui.ble.status === 'scanning') return 'Scanning...';
    if (ui.ble.status === 'paired') return `Paired: ${ui.ble.name}`;
    return 'Not paired';
  }

  // ---------------------------------------------------------------- render
  function renderTab() {
    const { state } = store;
    switch (ui.tab) {
      case 'actions':
        return renderActionsTab(state);
      case 'insights':
        return renderInsightsTab(state);
      case 'vault':
        return renderVaultTab({ usageBytes: store.usageBytes() });
      default:
        return renderFeedTab({
          memories: state.memories,
          query: ui.query,
          bleLabel: bleLabel(),
          isRecording: ui.isRecording,
        });
    }
  }

  function updateChrome() {
    const led = $('status-led');
    led.className = `w-2 h-2 rounded-full ${
      ui.isRecording ? 'bg-alert rec-dot' : ui.ble.status === 'paired' ? 'bg-ink' : 'bg-muted'
    }`;

    const pending = store.state.actions.filter((a) => a.status === ACTION_STATUS.PENDING).length;
    const badge = $('nav-action-badge');
    badge.textContent = pending;
    badge.classList.toggle('hidden', pending === 0);

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      const selected = btn.dataset.tab === ui.tab;
      btn.className = `${NAV_BASE} ${selected ? ACTIVE_NAV : IDLE_NAV}`;
      if (selected) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }

  function render() {
    $('main-content').innerHTML = renderTab();
    updateChrome();
  }

  // ---------------------------------------------------------------- capture
  function runAction(action) {
    const { message, file } = executeAction(store.state, action);
    if (file) downloadFile(file.filename, file.content, file.mimeType);
    toast(message);
  }

  function ingest(capture) {
    const result = captureMemory(store.state, capture);
    if (!result) return;

    const { action, server } = result;
    if (action && server.autoRun) {
      runAction(action);
    } else if (action) {
      toast(`Queued MCP Action: ${server.name}`);
    } else {
      toast(`Saved ${capture.source} capture to local vault`);
    }
    persist();
    render();
  }

  // ---------------------------------------------------------------- hardware
  async function scanBle() {
    if (!isBleSupported()) {
      toast('Web Bluetooth is not supported here. Use Chrome or Edge.');
      return;
    }
    ui.ble = { status: 'scanning', name: null };
    render();
    try {
      const device = await pairDevice(() => {
        ui.ble = { status: 'idle', name: null };
        toast('Pendant BLE disconnected');
        render();
      });
      if (device) {
        ui.ble = { status: 'paired', name: device.name };
        toast(`Paired with ${device.name}`);
      } else {
        ui.ble = { status: 'idle', name: null };
      }
    } catch (err) {
      ui.ble = { status: 'idle', name: null };
      toast(`BLE error: ${err.message}`);
    }
    render();
  }

  function toggleMic() {
    if (!isSpeechSupported()) {
      toast('Web Speech API is not supported in this browser.');
      return;
    }
    if (ui.isRecording && ui.recognizer) {
      ui.recognizer.stop();
      return;
    }

    ui.recognizer = createRecognizer({
      onStart: () => {
        ui.isRecording = true;
        toast('Listening... speak clearly');
        render();
      },
      onResult: (text) => ingest({ text, source: CAPTURE_SOURCES.VOICE }),
      onError: (code) => toast(`Mic error: ${code}`),
      onEnd: () => {
        ui.isRecording = false;
        ui.recognizer = null;
        render();
      },
    });

    try {
      ui.recognizer.start();
    } catch {
      ui.isRecording = false;
      ui.recognizer = null;
      toast('Could not start the microphone.');
      render();
    }
  }

  async function handleSnapshot(file) {
    try {
      const imageData = await compressImage(file);
      const input = $('manual-input');
      const caption = input ? input.value.trim() : '';
      if (input) input.value = '';
      ingest({
        text: caption || `Snapshot: ${file.name}`,
        source: CAPTURE_SOURCES.SNAPSHOT,
        imageData,
      });
    } catch (err) {
      toast(err.message);
    }
  }

  // ---------------------------------------------------------------- actions
  const findById = (list, id) => list.find((item) => item.id === id);

  const handlers = {
    'ble-scan': scanBle,
    mic: toggleMic,
    snap: () => $('snap-file-input').click(),

    'delete-memory': ({ id }) => {
      store.state.memories = store.state.memories.filter((m) => m.id !== id);
      persist();
      toast('Memory deleted');
      render();
    },

    approve: ({ id }) => {
      const action = findById(store.state.actions, id);
      if (!action || action.status !== ACTION_STATUS.PENDING) return;
      runAction(action);
      persist();
      render();
    },

    dismiss: ({ id }) => {
      const action = findById(store.state.actions, id);
      if (!action) return;
      action.status = ACTION_STATUS.DISMISSED;
      persist();
      toast('Action dismissed');
      render();
    },

    'toggle-server': ({ id }) => {
      const server = findById(store.state.servers, id);
      if (!server) return;
      server.enabled = !server.enabled;
      persist();
      toast(`${server.name} ${server.enabled ? 'enabled' : 'disabled'}`);
      render();
    },

    'dl-notes': () => {
      downloadFile('pendant_notes.md', store.state.notesMd || EMPTY_NOTES_MD, 'text/markdown;charset=utf-8');
      toast('Downloaded pendant_notes.md');
    },

    'dl-expenses': () => {
      downloadFile('pendant_expenses.csv', store.state.expensesCsv || EXPENSES_CSV_HEADER, 'text/csv;charset=utf-8');
      toast('Downloaded pendant_expenses.csv');
    },

    'export-json': () => {
      downloadFile(
        `pendant_vault_backup_${Date.now()}.json`,
        JSON.stringify(store.state, null, 2),
        'application/json',
      );
      toast('Exported full JSON vault backup');
    },

    'wipe-open': () => {
      $('wipe-modal').classList.remove('hidden');
      $('cancel-wipe-btn').focus();
    },
  };

  // ---------------------------------------------------------------- wiring
  const main = $('main-content');

  main.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    handlers[el.dataset.action]?.({ id: el.dataset.id });
  });

  main.addEventListener('change', (event) => {
    const id = event.target.dataset?.autorun;
    if (!id) return;
    const server = findById(store.state.servers, id);
    if (!server) return;
    server.autoRun = event.target.checked;
    persist();
    toast(`Auto-Run ${server.autoRun ? 'ON' : 'OFF'} for ${server.name}`);
  });

  main.addEventListener('input', (event) => {
    if (event.target.id !== 'search-input') return;
    ui.query = event.target.value;
    $('timeline').innerHTML = renderTimeline(store.state.memories, ui.query);
  });

  main.addEventListener('submit', (event) => {
    if (event.target.id !== 'manual-form') return;
    event.preventDefault();
    const input = $('manual-input');
    if (input.value.trim()) ingest({ text: input.value, source: CAPTURE_SOURCES.MANUAL });
  });

  $('snap-file-input').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) handleSnapshot(file);
  });

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.tab = btn.dataset.tab;
      render();
    });
  });

  const closeWipeModal = () => $('wipe-modal').classList.add('hidden');
  $('cancel-wipe-btn').addEventListener('click', closeWipeModal);
  $('confirm-wipe-btn').addEventListener('click', () => {
    store.reset();
    ui.query = '';
    closeWipeModal();
    toast('All local data permanently wiped');
    render();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWipeModal();
  });

  render();
}
