import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendExpense, csvField, parseAmount } from '../src/mcp/expense.js';

test('parses prefix currency symbols and codes', () => {
  assert.deepEqual(parseAmount('Spent ₹250 on lunch'), { amount: 250, currency: 'INR' });
  assert.deepEqual(parseAmount('coffee $4.50'), { amount: 4.5, currency: 'USD' });
  assert.deepEqual(parseAmount('paid Rs. 1,200 for cab'), { amount: 1200, currency: 'INR' });
});

test('parses suffix currency words', () => {
  assert.deepEqual(parseAmount('taxi was 300 rupees'), { amount: 300, currency: 'INR' });
});

test('parses a bare amount after a spending verb', () => {
  assert.deepEqual(parseAmount('spent 80 on snacks'), { amount: 80, currency: null });
});

test('returns nulls when there is no amount', () => {
  assert.deepEqual(parseAmount('I paid the bill'), { amount: null, currency: null });
});

test('csvField quotes and escapes embedded quotes', () => {
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
});

test('csvField neutralises spreadsheet formulas', () => {
  assert.equal(csvField('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvField('+1'), `"'+1"`);
});

test('appendExpense writes the header once', () => {
  const row = { timestamp: '2026-11-24 10:00', amount: 250, currency: 'INR', entry: 'lunch' };
  const once = appendExpense('', row);
  const twice = appendExpense(once, row);
  assert.equal(once.split('\n')[0], 'timestamp,amount,currency,entry');
  assert.equal(twice.split('\n').filter((l) => l.startsWith('timestamp,')).length, 1);
  assert.equal(twice.trim().split('\n').length, 3);
});
