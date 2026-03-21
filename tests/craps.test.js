import test from 'node:test';
import assert from 'node:assert/strict';

import { canPlaceBet, createGame, getTableLimits, placeBet, playRoll } from '../src/games/craps/rules.js';

function sequenceRng(values) {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

test('natural on come-out wins and resets to come-out phase', () => {
  const game = createGame({
    startingBankroll: 100,
    tableMin: 5,
    tableMax: 50,
    rng: sequenceRng([0.9, 0]), // 6 + 1 = 7
  });

  placeBet(game, 10);
  playRoll(game);

  assert.equal(game.bankroll, 110);
  assert.equal(game.phase, 'comeOut');
  assert.equal(game.activeBet, 0);
  assert.equal(game.round, 2);
  assert.equal(game.lastOutcome, 'win');
  assert.equal(game.stats.wins, 1);
  assert.equal(game.history.length, 1);
  assert.match(game.history[0].label, /Natural/);
});

test('point phase supports no-decision rolls and resolving by making the point', () => {
  const game = createGame({
    startingBankroll: 100,
    tableMin: 5,
    tableMax: 50,
    rng: sequenceRng([
      0.2,
      0.34, // 2 + 3 = 5 => point set
      0,
      0.34, // 1 + 3 = 4 => no decision
      0.5,
      0, // 4 + 1 = 5 => make point
    ]),
  });

  placeBet(game, 10);
  playRoll(game);
  assert.equal(game.phase, 'point');
  assert.equal(game.point, 5);
  assert.equal(game.activeBet, 10);

  playRoll(game);
  assert.equal(game.phase, 'point');
  assert.equal(game.activeBet, 10);
  assert.equal(game.lastOutcome, 'noDecision');

  playRoll(game);
  assert.equal(game.phase, 'comeOut');
  assert.equal(game.point, null);
  assert.equal(game.activeBet, 0);
  assert.equal(game.lastOutcome, 'win');
  assert.equal(game.bankroll, 110);
});

test('craps on come-out loses the pass line bet', () => {
  const game = createGame({
    startingBankroll: 50,
    tableMin: 5,
    tableMax: 25,
    rng: sequenceRng([0, 0]), // 1 + 1 = 2
  });

  placeBet(game, 5);
  playRoll(game);

  assert.equal(game.lastOutcome, 'loss');
  assert.equal(game.bankroll, 45);
  assert.equal(game.phase, 'comeOut');
  assert.equal(game.activeBet, 0);
});

test('seven-out from point loses and advances round', () => {
  const game = createGame({
    startingBankroll: 80,
    tableMin: 5,
    tableMax: 40,
    rng: sequenceRng([
      0.34,
      0.34, // 3 + 3 = 6 => point 6
      0.9,
      0, // 6 + 1 = 7 => seven-out
    ]),
  });

  placeBet(game, 10);
  playRoll(game);
  playRoll(game);

  assert.equal(game.lastOutcome, 'loss');
  assert.equal(game.phase, 'comeOut');
  assert.equal(game.activeBet, 0);
  assert.equal(game.bankroll, 70);
  assert.equal(game.round, 2);
  assert.match(game.message, /LOSS/);
});

test('session becomes busted when bankroll drops below table minimum', () => {
  const game = createGame({
    startingBankroll: 5,
    tableMin: 5,
    tableMax: 25,
    rng: sequenceRng([0, 0]), // craps 2
  });

  placeBet(game, 5);
  playRoll(game);

  assert.equal(game.bankroll, 0);
  assert.equal(game.status, 'busted');
  assert.match(game.message, /Session over/);
  assert.throws(() => placeBet(game, 5), /Bet must be an integer/);
});

test('table limits and bet validation respect bankroll and state', () => {
  const game = createGame({ startingBankroll: 12, tableMin: 5, tableMax: 100 });

  const limits = getTableLimits(game);
  assert.equal(limits.min, 5);
  assert.equal(limits.max, 12);

  assert.equal(canPlaceBet(game, 4), false);
  assert.equal(canPlaceBet(game, 13), false);
  assert.equal(canPlaceBet(game, 10), true);

  placeBet(game, 10);
  assert.equal(canPlaceBet(game, 5), false);
});

