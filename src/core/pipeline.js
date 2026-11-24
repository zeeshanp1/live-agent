/**
 * Capture pipeline: raw capture -> memory -> (optional) proposed MCP action.
 * Pure state transformation, no DOM, so it can be unit-tested directly.
 */

import { ACTION_STATUS } from '../config.js';
import { createId } from '../lib/id.js';
import { detectIntent } from '../mcp/intent.js';

const SNAPSHOT_PLACEHOLDER = '[Visual Snapshot Captured]';

/**
 * Store a capture and queue the action it implies, if any and if the matching
 * server is enabled. The caller decides whether to auto-run it.
 *
 * @returns {{ memory: object, action: object | null, server: object | null } | null}
 *   null when there was nothing to capture.
 */
export function captureMemory(state, { text, source, imageData = null }, now = new Date()) {
  const cleanText = String(text ?? '').trim();
  if (!cleanText && !imageData) return null;

  const memory = {
    id: createId(),
    timestamp: now.getTime(),
    source,
    text: cleanText || SNAPSHOT_PLACEHOLDER,
    imageData,
  };
  state.memories.unshift(memory);

  const intent = detectIntent(memory.text, now);
  const server = intent ? state.servers.find((s) => s.id === intent.serverId) : null;
  if (!intent || !server || !server.enabled) return { memory, action: null, server: null };

  const action = {
    id: createId(),
    timestamp: now.getTime(),
    serverId: intent.serverId,
    title: intent.title,
    payload: intent.payload,
    status: ACTION_STATUS.PENDING,
  };
  state.actions.unshift(action);
  return { memory, action, server };
}
