/** Collision-safe unique id (the prototype used Date.now(), which can repeat within a millisecond). */
export function createId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
