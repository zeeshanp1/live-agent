import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatBytes, formatIsoTimestamp } from '../src/lib/format.js';

test('escapeHtml neutralises markup and quotes', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;');
});

test('escapeHtml tolerates null and undefined', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('formatIsoTimestamp uses local time, zero padded', () => {
  assert.equal(formatIsoTimestamp(new Date(2026, 0, 5, 9, 7)), '2026-01-05 09:07');
});

test('formatBytes picks a sensible unit', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(3 * 1024 * 1024), '3.00 MB');
});
