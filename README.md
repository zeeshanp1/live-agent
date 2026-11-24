# Pendant MCP

**A local-first, zero-cloud wearable AI agent powered by the Model Context Protocol (MCP).**

Pendant MCP pairs a lightweight, low-power chest-mounted sensor pendant with your smartphone to observe your daily life, remember what matters, and execute real actions across your local apps—without a single byte of your personal data ever touching a third-party cloud server.

[![CI](https://github.com/zeeshanp1/live-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/zeeshanp1/live-agent/actions/workflows/ci.yml)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20ESP32--S3-black?style=flat-square)
![Protocol](https://img.shields.io/badge/Protocol-Local%20MCP%20(JSON--RPC)-blue?style=flat-square)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local--First%20%7C%20Zero%20Cloud-green?style=flat-square)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

> **Project status: early prototype.** This repository currently contains the **web companion app**, a working 4-tab prototype of the capture → intent → approve → act pipeline that runs entirely in your browser. The pendant hardware, Android service, and on-device AI models described below are the target design and are **not built yet**. See [Current Status](#4-current-status) and the [Roadmap](#7-roadmap).

---

## Table of Contents

1. [The Problem & Why Pendant MCP Exists](#1-the-problem--why-pendant-mcp-exists)
2. [Complete Feature Breakdown](#2-complete-feature-breakdown)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Current Status](#4-current-status)
5. [Getting Started](#5-getting-started)
6. [Repository Structure](#6-repository-structure)
7. [Roadmap](#7-roadmap)
8. [Contributing & License](#8-contributing--license)

---

## 1. The Problem & Why Pendant MCP Exists

Existing AI wearables (such as the Humane AI Pin, Rabbit R1, or Limitless Pendant) force users into an unacceptable trade-off:
1. **Total Surveillance Risk:** They stream continuous audio, video, and personal habits to corporate cloud servers—creating a massive target for data breaches and unauthorized training.
2. **Passive Utility:** Most wearables act as glorified voice recorders that dump raw transcripts instead of actually *doing* anything useful.
3. **Thermal & Battery Failure:** Trying to run heavy AI compute directly on a tiny wearable causes overheating and dead batteries within an hour.

### How Pendant MCP Solves This

| Dimension | Typical Cloud AI Wearables | Pendant MCP |
|---|---|---|
| **Data Storage** | Third-party cloud servers | 100% local on user's phone (SQLCipher AES-256) |
| **Action Capability** | Passive notes & summaries | Active local MCP tool execution (Calendar, Notes, Expenses, Tasks) |
| **Wearable Compute** | Heavy on-device processing (hot, poor battery) | "Thin" low-power sensor node (cool, all-day battery) |
| **Privacy Control** | Software mute button | Physical hardware kill-switch + Panic Wipe |
| **Subscription Cost** | Mandatory monthly cloud fee | Zero cloud costs, completely self-owned |

---

## 2. Complete Feature Breakdown

### A. Wearable Pendant Features (Capture Layer)
* **Event-Driven Audio Capture:** Uses Voice Activity Detection (VAD) so the microphone only streams compressed speech (Opus codec) when someone is actually talking—ignoring silence and background noise.
* **Smart Snapshot Camera:** Never records continuous battery-killing video. Captures low-resolution, VLM-ready snapshots (320×240) only on double-tap gestures, scene changes, or configurable intervals.
* **IMU Motion Intelligence:** Built-in accelerometer and gyroscope detect walking vs. sitting, prevent blurry photos during rapid movement, and enable tactile **double-tap gestures** to bookmark a moment or snap a receipt/whiteboard.
* **Ambient Light & Proximity Gating:** Automatically disables camera captures in pitch-black rooms or when the pendant slips under a jacket or shirt.
* **Discreet Haptic Feedback:** A silent coin vibration motor delivers subtle nudges instead of talking out loud in public—eliminating the "backseat driver" annoyance.
* **Hardware Privacy Kill-Switch:** A physical SPDT slide switch that mechanically cuts power to the microphone and camera, paired with a visible capture LED for bystander transparency.

### B. Everyday Real-World Capabilities
* **Zero-Effort Task & Calendar Automation:** Hears spoken commitments (*"I'll send the report by Friday"*, *"Let's meet Thursday at 4 PM"*) and automatically drafts a Calendar event or Reminder via local MCP.
* **Instant Receipt & Expense Logging:** Double-tap while looking at a bill or receipt; the local Vision model extracts the amount and vendor and appends it directly to your local Expense CSV.
* **Visual Memory Recall:** Search your local timeline for physical objects (*"Where did I leave my charger or keys?"*) or whiteboards (*"Show me the Fluid Mechanics formulas from Tuesday"*).
* **Private Social & Meeting Memory:** Quietly recalls context about people you've met before, extracts action items from lectures or client calls, and lets you query past decision history (*"Why did we choose Vendor A over Vendor B?"*).
* **Real-Time Habit & Focus Coaching:** Combines IMU, audio, and visual context to spot patterns (e.g., sitting stuck at a desk for 45 minutes, skipping meals during busy days) and sends a subtle haptic nudge.
* **On-the-Spot Learning:** Point at a circuit board, diagram, or foreign-language sign, double-tap, and ask your local agent to explain it—or generate a quick end-of-day active recall quiz on what you studied.
* **Accessibility & Safety:** Can read medicine labels aloud, confirm whether pills were taken, or use the IMU to detect a sudden hard fall and trigger an emergency local SMS/call MCP tool.

### C. Companion App Features (4-Tab Control Center)
1. **Feed (Daily Memory Stream):**
   * Live pendant hardware status pill (`Connected • Battery % • Mic/Cam State`) with one-tap Pause/Mute.
   * Universal offline RAG search bar (`"Ask your memory..."`) querying your local vector database.
   * Chronological cards for summarized conversations (with expandable transcripts) and double-tap snapshots.
2. **Actions (MCP Queue & Permissions):**
   * **Pending Approvals Inbox:** Review drafted actions (*Add Calendar Event*, *Append Note*, *Log Expense*) with `[Approve & Run]`, `[Edit]`, and `[Dismiss]` controls.
   * **MCP Server Manager:** Toggle individual local MCP servers On/Off and set granular permission modes: **Ask-First** (default) or **Auto-Run** (for low-risk tools like expense logging).
3. **Insights (Zero-Effort Dashboard):**
   * Real-time local metrics populated passively—total memories captured, MCP actions executed, expenses logged, and focus/activity trends.
   * Automated End-of-Day Digest highlighting open commitments you promised to others.
4. **Vault (Device, Storage & Privacy):**
   * Live BLE connection manager, RSSI signal monitor, haptic test button, and snapshot interval settings.
   * Real-time disk usage breakdown (Raw Media Cache vs. Encrypted Memory DB) with auto-pruning countdowns.
   * Biometric lock toggle, one-tap **AES-256 Encrypted Backup Export**, and an instant **Panic Wipe** button.

---

## 3. System Architecture & Data Flow

```text
┌──────────────────────────────────────────────────────────────────────┐
│ 1. WEARABLE PENDANT (ESP32-S3 Thin Sensor Node)                      │
│    [PDM Mic]  [OV2640 Cam]  [IMU]  [Light/Prox]  [Haptic]  [Switch]  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │  BLE (Opus Audio + Low-Res JPEG + Tap Events)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. ANDROID FOREGROUND SERVICE (Always-On, Low Power)                 │
│    - foregroundServiceType="connectedDevice"                         │
│    - Runs Silero VAD to drop silence immediately                     │
│    - Writes valid chunks to temporary encrypted cache                │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. EVENT-DRIVEN LOCAL AI PIPELINE (Batched / On-Demand)              │
│    - Audio Chunks ──► whisper.cpp (Offline Speech-to-Text)           │
│    - Snapshots    ──► Moondream2 / Qwen2-VL (Offline Vision-to-Text) │
│    - Text Output  ──► all-MiniLM-L6-v2 (Local Vector Embeddings)     │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. ENCRYPTED LOCAL VAULT (SQLCipher AES-256 + sqlite-vec)            │
│    - Stores timestamped summaries, raw transcripts & embeddings      │
│    - WorkManager auto-prunes raw audio/images after 24–48 hours      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. INTENT TRIGGER & LOCAL MCP CLIENT (llama.cpp / Ollama)            │
│    - Lightweight intent check detects actionable phrases/taps        │
│    - Loads local LLM on-demand, drafts validated JSON-RPC tool call  │
│    - Unloads LLM immediately after inference to protect Android RAM  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        [Auto-Run Permission]           [Ask-First Permission]
        Executes local MCP Server       Queues card in "Actions" tab
        immediately on device           + triggers BLE haptic buzz
```

> The diagram above is the **target** architecture. Layers 2–5 are not implemented yet; see below for what runs today.

---

## 4. Current Status

| Capability | Target design | In this repo today |
|---|---|---|
| Companion app (Feed / Actions / Insights / Vault) | Android app | ✅ Web app (`index.html` + ES modules) |
| Local storage | SQLCipher AES-256 + sqlite-vec | ✅ Browser `localStorage` (**not encrypted**) |
| Speech-to-text | whisper.cpp, offline | ⚠️ Browser Web Speech API (Chrome/Edge may use a vendor speech service) |
| Photos | VLM-ready pendant snapshots | ⚠️ Camera/file picker, downscaled to 540px JPEG |
| Intent → action | On-device LLM drafts JSON-RPC tool call | ⚠️ Rule-based intent detection (`src/mcp/intent.js`) |
| Local MCP servers | Real MCP servers (JSON-RPC) | ⚠️ In-process simulations: Calendar (`.ics`), Notes (`.md`), Expenses (`.csv`) |
| Approval flow | Ask-First / Auto-Run | ✅ Per-server toggles |
| Pendant link | BLE: Opus audio + JPEG + tap events | ⚠️ Web Bluetooth **pairing only**, no data streaming |
| Panic Wipe / export | Encrypted backup + wipe | ✅ Wipe and JSON/Markdown/CSV export (unencrypted) |
| Vector search / RAG | all-MiniLM-L6-v2 + sqlite-vec | ❌ Plain substring search |
| Pendant firmware & hardware | ESP32-S3 sensor node | ❌ Not started |

**Privacy note:** the app makes no network calls to any backend of its own and has no analytics. Be aware that (a) Chromium's Web Speech API can send audio to the browser vendor's speech service, and (b) `localStorage` is unencrypted. Both go away in the target design (offline whisper.cpp, SQLCipher).

### What the prototype understands

| You say or type | Proposed action |
|---|---|
| "Spent ₹250 on lunch" / "paid $4.50 for coffee" | Log an expense row (amount and currency parsed) |
| "Meet Priya tomorrow at 5pm" / "deadline Friday" | Create an `.ics` event at the detected time (defaults to the next full hour if none is found) |
| "Remember to renew the passport" | Append a timestamped line to `pendant_notes.md` |

Expense signals take priority over scheduling words, so *"Spent ₹250 on lunch tomorrow"* is logged as an expense. Every action waits in the **Actions** tab for approval unless that server's **Auto-Run** is on.

---

## 5. Getting Started

**Requirements:** Node.js 20+ (only for the dev server and tests; the app itself has no build step and no dependencies) and a modern browser. Chrome or Edge is recommended for Web Speech and Web Bluetooth.

```bash
git clone https://github.com/zeeshanp1/live-agent.git
cd live-agent

npm start        # serves http://127.0.0.1:8080
npm test         # runs the unit tests (Node's built-in test runner)
```

The app must be served over `http://localhost` (or HTTPS): ES modules do not load from `file://`, and the microphone, camera, and Bluetooth APIs require a secure context. Use `PORT=3000 npm start` to change the port.

> Tailwind CSS and the Inter / JetBrains Mono fonts load from CDNs, so the first load needs internet access.

---

## 6. Repository Structure

```text
live-agent/
├── index.html                # App shell and static markup
├── assets/
│   └── favicon.svg
├── src/
│   ├── main.js               # Entry point
│   ├── config.js             # Constants (storage key, limits, enums)
│   ├── tailwind.config.js    # Tailwind CDN theme
│   ├── styles/main.css
│   ├── core/
│   │   ├── store.js          # Vault state, persistence, pruning
│   │   └── pipeline.js       # capture → memory → proposed action
│   ├── mcp/
│   │   ├── intent.js         # Rule-based intent detection
│   │   ├── datetime.js       # "tomorrow at 5pm" → Date
│   │   ├── expense.js        # Amount parsing + safe CSV
│   │   ├── ics.js            # RFC 5545 calendar builder
│   │   └── executor.js       # Runs approved actions on local servers
│   ├── services/             # Browser APIs: ble.js, speech.js, snapshot.js
│   ├── lib/                  # format.js, id.js, download.js
│   └── ui/
│       ├── app.js            # View state, rendering, event routing
│       └── views/            # feed, actions, insights, vault
├── test/                     # Unit tests (node --test)
├── scripts/serve.mjs         # Zero-dependency dev server
├── docs/ARCHITECTURE.md      # How the app is put together
└── .github/workflows/ci.yml  # Tests on Node 20 and 22
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design of the prototype and how it maps to the target architecture.

---

## 7. Roadmap

**Companion app**
- [x] Capture (voice, photo, text), approval queue, local MCP servers, export, Panic Wipe
- [x] Date/time and amount extraction
- [ ] Edit an action before approving it
- [ ] Installable PWA (offline shell, manifest)
- [ ] Encrypted vault (WebCrypto + passphrase) and IndexedDB for photos
- [ ] Local semantic search

**Real MCP**
- [ ] Replace in-process servers with real MCP servers over JSON-RPC
- [ ] Local LLM intent drafting with schema-validated tool calls

**Pendant**
- [ ] BLE GATT protocol spec (audio, snapshots, tap events, haptics)
- [ ] ESP32-S3 firmware
- [ ] Hardware design, BOM, and privacy kill-switch
- [ ] Android foreground service, VAD, whisper.cpp, SQLCipher vault

---

## 8. Contributing & License

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and what makes a good pull request. For security or privacy issues, see [SECURITY.md](SECURITY.md).

Released under the [MIT License](LICENSE).
