import { rollDie } from './roll.js';

export const DEFAULT_TILE_COUNT = 9;

function assertPositiveInt(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function normalizeSelection(selection) {
  if (!Array.isArray(selection) || selection.length === 0) {
    throw new Error('selection must be a non-empty array.');
  }

  const unique = [...new Set(selection)].sort((a, b) => a - b);
  if (unique.length !== selection.length) {
    throw new Error('selection cannot contain duplicate tiles.');
  }

  for (const tile of unique) {
    assertPositiveInt(tile, 'tile');
  }

  return unique;
}

function getOpenTilesSet(openTiles) {
  return new Set(openTiles);
}

function combinations(values, target, start = 0, partial = [], result = []) {
  const current = sum(partial);
  if (current === target) {
    result.push([...partial]);
    return result;
  }

  if (current > target) {
    return result;
  }

  for (let index = start; index < values.length; index += 1) {
    partial.push(values[index]);
    combinations(values, target, index + 1, partial, result);
    partial.pop();
  }

  return result;
}

export function createGame({ tileCount = DEFAULT_TILE_COUNT, rng = Math.random } = {}) {
  assertPositiveInt(tileCount, 'tileCount');

  return {
    tileCount,
    openTiles: Array.from({ length: tileCount }, (_, index) => index + 1),
    selectedTiles: [],
    currentDice: [],
    rollTotal: null,
    turn: 1,
    status: 'awaitingRoll',
    rng,
    history: [],
  };
}

export function canUseSingleDie(game) {
  return sum(game.openTiles) <= 6;
}

export function getDiceCount(game) {
  return canUseSingleDie(game) ? 1 : 2;
}

export function rollDice(game) {
  if (game.status !== 'awaitingRoll') {
    throw new Error('You can only roll when the game is awaiting a roll.');
  }

  const diceCount = getDiceCount(game);
  const dice = Array.from({ length: diceCount }, () => rollDie(6, game.rng));

  game.currentDice = dice;
  game.rollTotal = sum(dice);
  game.selectedTiles = [];

  const validMoves = getValidMoves(game);
  if (validMoves.length === 0) {
    game.status = 'lost';
    game.history.push({
      type: 'roll',
      turn: game.turn,
      dice: [...game.currentDice],
      total: game.rollTotal,
      result: 'noMoves',
    });
    return game;
  }

  game.status = 'awaitingMove';
  game.history.push({
    type: 'roll',
    turn: game.turn,
    dice: [...game.currentDice],
    total: game.rollTotal,
    result: 'ok',
  });

  return game;
}

export function getValidMoves(game) {
  if (game.rollTotal === null) {
    return [];
  }

  const moves = combinations([...game.openTiles].sort((a, b) => a - b), game.rollTotal);
  return moves.sort((a, b) => a.length - b.length || sum(a) - sum(b));
}

export function isValidMove(game, selection) {
  const normalized = normalizeSelection(selection);
  const open = getOpenTilesSet(game.openTiles);

  if (!normalized.every((tile) => open.has(tile))) {
    return false;
  }

  if (game.rollTotal === null) {
    return false;
  }

  return sum(normalized) === game.rollTotal;
}

export function toggleSelectedTile(game, tile) {
  assertPositiveInt(tile, 'tile');

  if (game.status !== 'awaitingMove') {
    return game;
  }

  if (!game.openTiles.includes(tile)) {
    return game;
  }

  if (game.selectedTiles.includes(tile)) {
    game.selectedTiles = game.selectedTiles.filter((value) => value !== tile);
  } else {
    game.selectedTiles = [...game.selectedTiles, tile].sort((a, b) => a - b);
  }

  return game;
}

export function playSelection(game, selection = game.selectedTiles) {
  if (game.status !== 'awaitingMove') {
    throw new Error('You can only play a move after rolling.');
  }

  const normalized = normalizeSelection(selection);

  if (!isValidMove(game, normalized)) {
    throw new Error('Invalid move: selected tiles must be open and sum to the roll total.');
  }

  const selectedSet = new Set(normalized);
  game.openTiles = game.openTiles.filter((tile) => !selectedSet.has(tile));
  game.selectedTiles = [];

  game.history.push({
    type: 'move',
    turn: game.turn,
    played: normalized,
    remaining: [...game.openTiles],
  });

  if (game.openTiles.length === 0) {
    game.status = 'won';
    return game;
  }

  game.turn += 1;
  game.currentDice = [];
  game.rollTotal = null;
  game.status = 'awaitingRoll';

  return game;
}

export function getScore(game) {
  return sum(game.openTiles);
}

export function getRuleHint(game) {
  return canUseSingleDie(game)
    ? 'Single-die mode (sum of open tiles is 6 or less).'
    : 'Two-dice mode.';
}

