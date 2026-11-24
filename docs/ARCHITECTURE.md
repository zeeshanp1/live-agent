# Architecture

This document describes how the **web companion prototype** is built and how each piece maps to the target design in the [README](../README.md#3-system-architecture--data-flow).

## Design principles

1. **Local-only.** No backend. State lives in `localStorage`; files are produced client-side.
2. **Human in the loop.** Detected intents become *proposals*. Nothing runs until approved, unless the user turns on Auto-Run for that specific server.
3. **Logic apart from the DOM.** `core/` and `mcp/` have no browser dependencies and are unit-tested in Node. Only `services/` and `ui/` touch browser APIs.
4. **No build step.** Native ES modules plus the Tailwind CDN. `npm start` serves the folder.

## Data flow

```text
 mic / camera / text input
          │
          ▼
   services/*  (speech.js, snapshot.js)       ← browser APIs
          │  { text, source, imageData }
          ▼
   core/pipeline.js  captureMemory()
          │  1. store a Memory
          │  2. mcp/intent.js detectIntent()
          │  3. if the matching server is enabled → queue a PENDING Action
          ▼
   ui/app.js
          ├─ server.autoRun?  ──yes──► mcp/executor.js executeAction()
          └─ no → shown in the Actions tab ─ user taps "Approve & Run" ─►┘
                                                                         │
                         mutates notesMd / expensesCsv, or returns an .ics file
                                                                         ▼
                                                    core/store.js save() → localStorage
```

## Modules

| Module | Responsibility |
|---|---|
| `src/config.js` | Constants and enums. No side effects. |
| `src/core/store.js` | Default state, hydration of persisted data (tolerates corruption), pruning of old resolved actions, quota-safe `save()`, `reset()`. |
| `src/core/pipeline.js` | Turns a raw capture into a Memory and, when applicable, a pending Action. Pure state transformation. |
| `src/mcp/intent.js` | Rule-based classification: expense, then calendar, then note. |
| `src/mcp/datetime.js` | Extracts day/time from phrases such as "tomorrow at 5pm" or "on Friday". |
| `src/mcp/expense.js` | Amount and currency extraction; CSV serialisation with formula-injection protection. |
| `src/mcp/ics.js` | RFC 5545 builder: text escaping, 75-octet line folding, CRLF endings. |
| `src/mcp/executor.js` | One handler per local "MCP server". Returns `{ message, file }`; never touches the DOM. |
| `src/services/*` | Thin wrappers over Web Speech, Web Bluetooth, and canvas image compression. |
| `src/ui/app.js` | View state, tab rendering, event delegation, toasts, modal. |
| `src/ui/views/*` | Pure functions that return HTML strings from state. |

## Data model

```js
Memory  = { id, timestamp, source: 'VOICE'|'SNAPSHOT'|'MANUAL', text, imageData|null }
Action  = { id, timestamp, serverId: 'calendar'|'notes'|'expenses', title,
            payload, status: 'PENDING'|'APPROVED'|'DISMISSED' }
Server  = { id, name, description, enabled, autoRun }
```

Action payloads by server:

- `calendar`: `{ summary, description, start (ISO), end (ISO), timeDetected }`
- `expenses`: `{ entry, amount|null, currency|null }`
- `notes`: `{ note }`

Persistence key: `pendant_mcp_vault_v2` (see `STORAGE_KEY`). Bump the suffix when the schema changes incompatibly.

## Security notes

- All user text is passed through `escapeHtml` before being placed in HTML, including attributes.
- CSV fields are quoted, and values starting with `=`, `+`, `-`, `@` are prefixed with `'` so spreadsheets do not execute them as formulas.
- ICS text is escaped per RFC 5545.
- `scripts/serve.mjs` only serves `index.html`, `src/`, and `assets/`, and normalises paths to block traversal.
- `localStorage` is **not encrypted**. Do not treat the prototype as a secure vault.

## Mapping to the target architecture

| Target layer | Prototype stand-in | Path to the real thing |
|---|---|---|
| Pendant sensor node (ESP32-S3) | Manual input, phone camera, mic | BLE GATT protocol + firmware |
| Android foreground service + VAD | Browser tab | Native service |
| whisper.cpp / VLM / embeddings | Web Speech API, file picker | On-device models |
| SQLCipher vault | `localStorage` | Encrypted store |
| Local LLM + MCP client | `detectIntent()` rules | Same `{ serverId, title, payload }` contract, produced by an LLM |
| Local MCP servers (JSON-RPC) | `executor.js` handlers | Real MCP servers; `executeAction` becomes an MCP client call |

The contract between layers (`detectIntent` output, `executeAction` input and output) is deliberately the seam where the real components will plug in.
