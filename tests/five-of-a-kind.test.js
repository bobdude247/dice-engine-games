import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyScore,
  availableCategories,
  createGame,
  getLeaderboard,
  getScoreTotals,
  getWinners,
  rollTurn,
  scoreCategory,
  toggleHeldDie,
} from '../src/games/five-of-a-kind/rules.js';

function sequenceRng(values) {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

test('scoreCategory computes upper and lower section values', () => {
  assert.equal(scoreCategory([1, 1, 1, 1, 1], 'ones'), 5);
  assert.equal(scoreCategory([2, 2, 2, 4, 5], 'twos'), 6);
  assert.equal(scoreCategory([2, 2, 5, 5, 6], 'twoPairs'), 20);
  assert.equal(scoreCategory([2, 2, 2, 5, 6], 'twoPairs'), 0);
  assert.equal(scoreCategory([4, 4, 4, 2, 1], 'threeOfAKind'), 15);
  assert.equal(scoreCategory([6, 6, 6, 6, 2], 'fourOfAKind'), 26);
  assert.equal(scoreCategory([2, 2, 3, 3, 3], 'fullHouse'), 25);
  assert.equal(scoreCategory([1, 2, 3, 4, 6], 'smallStraight'), 30);
  assert.equal(scoreCategory([2, 3, 4, 5, 6], 'largeStraight'), 40);
  assert.equal(scoreCategory([5, 5, 5, 5, 5], 'fiveOfAKind'), 50);
  assert.equal(scoreCategory([1, 2, 3, 4, 5], 'chance'), 15);
});

test('getScoreTotals applies upper bonus at 63+', () => {
  const scorecard = {
    ones: 3,
    twos: 6,
    threes: 9,
    fours: 12,
    fives: 15,
    sixes: 18,
    threeOfAKind: 0,
    fourOfAKind: 0,
    fullHouse: 25,
    smallStraight: 30,
    largeStraight: 40,
    chance: 20,
    fiveOfAKind: 50,
  };

  const totals = getScoreTotals(scorecard);
  assert.equal(totals.upperSubtotal, 63);
  assert.equal(totals.upperBonus, 35);
  assert.equal(totals.lowerTotal, 165);
  assert.equal(totals.total, 263);
});

test('turn flow supports holding, rerolling, and player rotation', () => {
  const game = createGame({
    playerCount: 2,
    rng: sequenceRng([
      0, 0, 0, 0, 0, // p1 roll 1 => all ones
      0.9, 0.9, 0.9, 0.9, // p1 roll 2 with one die held => four sixes
      0, 0, 0, 0, 0, // p2 roll 1 => all ones
    ]),
  });

  assert.throws(() => applyScore(game, 'chance'), /Roll at least once/);

  rollTurn(game);
  assert.deepEqual(game.dice, [1, 1, 1, 1, 1]);
  assert.equal(game.rollsLeft, 2);

  toggleHeldDie(game, 0);
  rollTurn(game);
  assert.deepEqual(game.dice, [1, 6, 6, 6, 6]);
  assert.equal(game.rollsLeft, 1);

  applyScore(game, 'ones');
  assert.equal(game.players[0].scorecard.ones, 1);
  assert.equal(game.currentPlayer, 1);
  assert.equal(game.round, 1);

  rollTurn(game);
  applyScore(game, 'fiveOfAKind');
  assert.equal(game.players[1].scorecard.fiveOfAKind, 50);
  assert.equal(game.currentPlayer, 0);
  assert.equal(game.round, 2);

  const p1Open = availableCategories(game.players[0].scorecard);
  assert.equal(p1Open.includes('ones'), false);
});

test('leaderboard and winners are derived from totals', () => {
  const game = createGame({ playerCount: 2 });

  game.players[0].scorecard.chance = 10;
  game.players[1].scorecard.chance = 20;

  const board = getLeaderboard(game);
  assert.equal(board[0].playerIndex, 1);
  assert.equal(board[0].total, 20);

  const winners = getWinners(game);
  assert.equal(winners.length, 1);
  assert.equal(winners[0].playerIndex, 1);
});
