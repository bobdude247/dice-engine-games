import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  canUseSingleDie,
  createMatch,
  createGame,
  getCurrentPlayer,
  getDiceCount,
  getMatchScoreboard,
  getScore,
  getValidMoves,
  isValidMove,
  playCurrentPlayerSelection,
  playSelection,
  rollForCurrentPlayer,
  rollDice,
  toggleCurrentPlayerTile,
  toggleSelectedTile,
} from '../src/game/rules.js';

function sequenceRng(values) {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

test('createGame initializes 1..9 open tiles and baseline state', () => {
  const game = createGame();
  assert.deepEqual(game.openTiles, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(game.status, 'awaitingRoll');
  assert.equal(game.turn, 1);
  assert.equal(game.rollTotal, null);
});

test('rollDice uses two dice initially and exposes valid moves', () => {
  const game = createGame({ rng: sequenceRng([0.0, 0.5]) }); // 1 + 4 = 5
  rollDice(game);

  assert.deepEqual(game.currentDice, [1, 4]);
  assert.equal(game.rollTotal, 5);
  assert.equal(game.status, 'awaitingMove');

  const moves = getValidMoves(game);
  assert.deepEqual(moves, [[5], [1, 4], [2, 3]]);
});

test('toggleSelectedTile tracks selected open tiles only', () => {
  const game = createGame({ rng: sequenceRng([0.0, 0.5]) });
  rollDice(game);

  toggleSelectedTile(game, 1);
  toggleSelectedTile(game, 4);
  assert.deepEqual(game.selectedTiles, [1, 4]);

  toggleSelectedTile(game, 4);
  assert.deepEqual(game.selectedTiles, [1]);

  toggleSelectedTile(game, 10);
  assert.deepEqual(game.selectedTiles, [1]);
});

test('playSelection removes tiles, advances turn, and resets to awaitingRoll', () => {
  const game = createGame({ rng: sequenceRng([0.0, 0.5]) });
  rollDice(game); // total 5

  assert.equal(isValidMove(game, [2, 3]), true);
  playSelection(game, [2, 3]);

  assert.deepEqual(game.openTiles, [1, 4, 5, 6, 7, 8, 9]);
  assert.equal(game.turn, 2);
  assert.equal(game.status, 'awaitingRoll');
  assert.equal(game.rollTotal, null);
});

test('single-die mode is activated when open tile sum is 6 or less', () => {
  const game = createGame({ rng: sequenceRng([0.2]) });
  game.openTiles = [1, 2, 3];

  assert.equal(canUseSingleDie(game), true);
  assert.equal(getDiceCount(game), 1);

  rollDice(game);
  assert.equal(game.currentDice.length, 1);
});

test('game is lost when a roll has no valid moves', () => {
  const game = createGame({ rng: sequenceRng([0.99, 0.99]) }); // two dice => 12
  game.openTiles = [1, 2, 4]; // max possible tile sum is 7

  rollDice(game);
  assert.equal(game.rollTotal, 12);
  assert.equal(game.status, 'lost');
});

test('game is won when all tiles are closed', () => {
  const game = createGame();
  game.openTiles = [2, 3];
  game.status = 'awaitingMove';
  game.rollTotal = 5;

  playSelection(game, [2, 3]);

  assert.deepEqual(game.openTiles, []);
  assert.equal(game.status, 'won');
  assert.equal(getScore(game), 0);
});

test('invalid move throws', () => {
  const game = createGame({ rng: sequenceRng([0.0, 0.5]) });
  rollDice(game); // total 5

  assert.throws(() => playSelection(game, [1, 2]), /Invalid move/);
});

test('createMatch supports 1..4 players and rejects out-of-range values', () => {
  const solo = createMatch({ playerCount: MIN_PLAYERS });
  const four = createMatch({ playerCount: MAX_PLAYERS });

  assert.equal(solo.players.length, 1);
  assert.equal(four.players.length, 4);
  assert.throws(() => createMatch({ playerCount: 0 }), /playerCount/);
  assert.throws(() => createMatch({ playerCount: 5 }), /playerCount/);
});

test('single-player match completes immediately when player loses', () => {
  const match = createMatch({ playerCount: 1, rng: sequenceRng([0.99, 0.99]) });
  const player = getCurrentPlayer(match);
  player.openTiles = [1, 2, 4];

  rollForCurrentPlayer(match);

  assert.equal(player.status, 'lost');
  assert.equal(match.status, 'completed');
  assert.deepEqual(match.winnerIndexes, [0]);
});

test('multi-player match advances to next player when current player finishes', () => {
  const match = createMatch({ playerCount: 2, rng: sequenceRng([0.99, 0.99]) });
  const first = getCurrentPlayer(match);
  first.openTiles = [1, 2, 4];

  rollForCurrentPlayer(match);

  assert.equal(first.status, 'lost');
  assert.equal(match.status, 'inProgress');
  assert.equal(match.currentPlayerIndex, 1);
  assert.equal(getCurrentPlayer(match).status, 'awaitingRoll');
});

test('match scoreboard marks current and winner players', () => {
  const match = createMatch({ playerCount: 2, rng: sequenceRng([0.0, 0.5, 0.99, 0.99]) });
  const first = getCurrentPlayer(match);
  first.openTiles = [1];

  rollForCurrentPlayer(match); // single die => 1
  toggleCurrentPlayerTile(match, 1);
  playCurrentPlayerSelection(match);

  assert.equal(first.status, 'won');
  assert.equal(match.currentPlayerIndex, 1);

  const second = getCurrentPlayer(match);
  second.openTiles = [1, 2, 4];
  rollForCurrentPlayer(match); // 6+6 = 12 -> no moves

  assert.equal(match.status, 'completed');
  assert.deepEqual(match.winnerIndexes, [0]);

  const board = getMatchScoreboard(match);
  assert.equal(board.length, 2);
  assert.equal(board[0].score, 0);
  assert.equal(board[1].score, 7);
  assert.equal(board[0].isCurrent, false);
  assert.equal(board[1].isCurrent, false);
});
