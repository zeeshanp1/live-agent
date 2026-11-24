/**
 * Central application constants. Nothing in here has side effects.
 */

/** localStorage key for the persisted vault. Bump the suffix on breaking schema changes. */
export const STORAGE_KEY = 'pendant_mcp_vault_v2';

/** Where a captured memory came from. */
export const CAPTURE_SOURCES = Object.freeze({
  VOICE: 'VOICE',
  SNAPSHOT: 'SNAPSHOT',
  MANUAL: 'MANUAL',
});

/** Lifecycle of a proposed MCP action. */
export const ACTION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DISMISSED: 'DISMISSED',
});

/** Snapshot compression, keeps localStorage small and fast. */
export const SNAPSHOT = Object.freeze({
  maxWidth: 540,
  jpegQuality: 0.72,
});

/** Web Speech API recognition language. */
export const SPEECH_LANG = 'en-US';

/** Optional GATT service the pendant firmware is expected to expose. */
export const BLE = Object.freeze({
  serviceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
});

/** How many approved/dismissed actions are kept for history (pending ones are never pruned). */
export const MAX_RESOLVED_ACTIONS = 100;

export const TOAST_DURATION_MS = 3000;

export const EXPENSES_CSV_HEADER = 'timestamp,amount,currency,entry\n';
export const EMPTY_NOTES_MD = '# Pendant Local Notes\n\nNo notes logged yet.\n';
