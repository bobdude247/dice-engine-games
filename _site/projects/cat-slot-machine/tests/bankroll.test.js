import test from 'node:test';
import assert from 'node:assert/strict';

import { BANKROLL_BASE, canTopOff, formatBankroll, topOff } from '../src/game/bankroll.js';

test('canTopOff only when bankroll is zero or negative', () => {
  assert.equal(canTopOff(10), false);
  assert.equal(canTopOff(0), true);
  assert.equal(canTopOff(-5), true);
});

test('topOff resets bankroll to base when empty', () => {
  assert.equal(topOff(0), BANKROLL_BASE);
  assert.equal(topOff(-250), BANKROLL_BASE);
});

test('topOff keeps bankroll when still positive', () => {
  assert.equal(topOff(25), 25);
});

test('formatBankroll uses dollar sign and separators', () => {
  assert.equal(formatBankroll(10000), 'Bankroll: $10,000');
});

