import test from 'node:test';
import assert from 'node:assert/strict';

import { createReelStrip, evaluateSpin, spinReels } from '../src/game/reels.js';

const cats = [
  { id: 'luna', name: 'Luna', fullBody: 'luna-full.png', faceCloseUp: 'luna-face.png' },
  { id: 'milo', name: 'Milo', fullBody: 'milo-full.png', faceCloseUp: 'milo-face.png' },
];

test('createReelStrip includes both symbol types for every cat', () => {
  const strip = createReelStrip(cats, 1);
  assert.equal(strip.length, 4);
  assert.deepEqual(
    strip.map((s) => [s.catId, s.type]),
    [
      ['luna', 'fullBody'],
      ['luna', 'faceCloseUp'],
      ['milo', 'fullBody'],
      ['milo', 'faceCloseUp'],
    ],
  );
});

test('spinReels returns requested number of symbols', () => {
  const strip = createReelStrip(cats, 1);
  const result = spinReels(strip, 3, () => 0);
  assert.equal(result.length, 3);
  assert.equal(result[0].catId, 'luna');
});

test('evaluateSpin scores one pair', () => {
  const symbols = [
    { catId: 'luna' },
    { catId: 'luna' },
    { catId: 'milo' },
  ];
  const outcome = evaluateSpin(symbols, 5);
  assert.equal(outcome.multiplier, 4);
  assert.equal(outcome.payout, 20);
});

test('evaluateSpin scores 3 of a kind', () => {
  const symbols = [{ catId: 'luna' }, { catId: 'luna' }, { catId: 'luna' }];
  const outcome = evaluateSpin(symbols, 2);
  assert.equal(outcome.multiplier, 12);
  assert.equal(outcome.payout, 24);
});
