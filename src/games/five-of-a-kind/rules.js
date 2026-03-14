import { rollDie } from '../../engine/dice/roll.js';

export const CATEGORIES = Object.freeze([
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'twoPairs',
  'threeOfAKind',
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'chance',
  'fiveOfAKind',
]);

const UPPER_CATEGORIES = new Set(['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']);
const SCORECARD_SIZE = CATEGORIES.length;

function createEmptyScorecard() {
  return Object.fromEntries(CATEGORIES.map((category) => [category, null]));
}

function assertValidDice(dice) {
  if (!Array.isArray(dice) || dice.length !== 5) {
    throw new Error('A roll must contain exactly 5 dice.');
  }

  for (const value of dice) {
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      throw new Error('Dice values must be integers from 1 to 6.');
    }
  }
}

function assertValidCategory(category) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
}

export function sumDice(dice) {
  assertValidDice(dice);
  return dice.reduce((total, value) => total + value, 0);
}

export function getCounts(dice) {
  assertValidDice(dice);
  const counts = new Map();

  for (const value of dice) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

export function isFiveOfAKind(roll) {
  return Array.isArray(roll) && roll.length === 5 && roll.every((v) => v === roll[0]);
}

function hasNOfAKind(dice, n) {
  for (const count of getCounts(dice).values()) {
    if (count >= n) return true;
  }
  return false;
}

function isFullHouse(dice) {
  const values = [...getCounts(dice).values()].sort((a, b) => a - b);
  return values.length === 2 && values[0] === 2 && values[1] === 3;
}

function hasTwoPairs(dice) {
  const pairCount = [...getCounts(dice).values()].filter((count) => count >= 2).length;
  return pairCount >= 2;
}

function isSmallStraight(dice) {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  const key = unique.join('');

  return key.includes('1234') || key.includes('2345') || key.includes('3456');
}

function isLargeStraight(dice) {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  if (unique.length !== 5) return false;

  const key = unique.join('');
  return key === '12345' || key === '23456';
}

export function scoreCategory(dice, category) {
  assertValidDice(dice);
  assertValidCategory(category);

  switch (category) {
    case 'ones':
      return dice.filter((value) => value === 1).length;
    case 'twos':
      return dice.filter((value) => value === 2).length * 2;
    case 'threes':
      return dice.filter((value) => value === 3).length * 3;
    case 'fours':
      return dice.filter((value) => value === 4).length * 4;
    case 'fives':
      return dice.filter((value) => value === 5).length * 5;
    case 'sixes':
      return dice.filter((value) => value === 6).length * 6;
    case 'twoPairs':
      return hasTwoPairs(dice) ? sumDice(dice) : 0;
    case 'threeOfAKind':
      return hasNOfAKind(dice, 3) ? sumDice(dice) : 0;
    case 'fourOfAKind':
      return hasNOfAKind(dice, 4) ? sumDice(dice) : 0;
    case 'fullHouse':
      return isFullHouse(dice) ? 25 : 0;
    case 'smallStraight':
      return isSmallStraight(dice) ? 30 : 0;
    case 'largeStraight':
      return isLargeStraight(dice) ? 40 : 0;
    case 'chance':
      return sumDice(dice);
    case 'fiveOfAKind':
      return isFiveOfAKind(dice) ? 50 : 0;
    default:
      return 0;
  }
}

export function getScoreTotals(scorecard) {
  const upperSubtotal = CATEGORIES.filter((category) => UPPER_CATEGORIES.has(category)).reduce(
    (total, category) => total + (scorecard[category] ?? 0),
    0,
  );

  const upperBonus = upperSubtotal >= 63 ? 35 : 0;

  const lowerTotal = CATEGORIES.filter((category) => !UPPER_CATEGORIES.has(category)).reduce(
    (total, category) => total + (scorecard[category] ?? 0),
    0,
  );

  return {
    upperSubtotal,
    upperBonus,
    lowerTotal,
    total: upperSubtotal + upperBonus + lowerTotal,
  };
}

export function createGame({ playerCount = 1, rng = Math.random } = {}) {
  if (!Number.isInteger(playerCount) || playerCount < 1 || playerCount > 4) {
    throw new Error('playerCount must be an integer between 1 and 4.');
  }

  return {
    playerCount,
    currentPlayer: 0,
    round: 1,
    rollsLeft: 3,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    hasRolled: false,
    status: 'inProgress',
    rng,
    players: Array.from({ length: playerCount }, () => ({
      scorecard: createEmptyScorecard(),
    })),
  };
}

export function availableCategories(scorecard) {
  return CATEGORIES.filter((category) => scorecard[category] === null);
}

export function setHeldDie(game, dieIndex, held) {
  if (dieIndex < 0 || dieIndex > 4) {
    throw new Error('dieIndex must be between 0 and 4.');
  }

  game.held[dieIndex] = Boolean(held);
  return game;
}

export function toggleHeldDie(game, dieIndex) {
  return setHeldDie(game, dieIndex, !game.held[dieIndex]);
}

export function rollTurn(game) {
  if (game.status !== 'inProgress') {
    throw new Error('Game is already finished.');
  }

  if (game.rollsLeft <= 0) {
    throw new Error('No rolls left in this turn.');
  }

  game.dice = game.dice.map((value, index) => (game.held[index] ? value : rollDie(6, game.rng)));
  game.rollsLeft -= 1;
  game.hasRolled = true;

  return game;
}

function isScorecardComplete(scorecard) {
  return availableCategories(scorecard).length === 0;
}

function isGameComplete(players) {
  return players.every((player) => isScorecardComplete(player.scorecard));
}

export function applyScore(game, category) {
  if (game.status !== 'inProgress') {
    throw new Error('Game is already finished.');
  }

  if (!game.hasRolled) {
    throw new Error('Roll at least once before scoring.');
  }

  assertValidCategory(category);

  const player = game.players[game.currentPlayer];
  if (player.scorecard[category] !== null) {
    throw new Error(`Category already scored: ${category}`);
  }

  player.scorecard[category] = scoreCategory(game.dice, category);

  game.held = [false, false, false, false, false];
  game.rollsLeft = 3;
  game.hasRolled = false;

  if (isGameComplete(game.players)) {
    game.status = 'finished';
    return game;
  }

  if (game.currentPlayer === game.playerCount - 1) {
    game.currentPlayer = 0;
    game.round += 1;
  } else {
    game.currentPlayer += 1;
  }

  return game;
}

export function getLeaderboard(game) {
  return game.players
    .map((player, index) => ({
      playerIndex: index,
      ...getScoreTotals(player.scorecard),
    }))
    .sort((a, b) => b.total - a.total);
}

export function getWinners(game) {
  const board = getLeaderboard(game);
  if (board.length === 0) return [];

  const top = board[0].total;
  return board.filter((entry) => entry.total === top);
}

export function getTurnSummary(game) {
  const player = game.players[game.currentPlayer];
  return {
    currentPlayer: game.currentPlayer,
    round: game.round,
    rollsLeft: game.rollsLeft,
    dice: [...game.dice],
    held: [...game.held],
    available: availableCategories(player.scorecard),
  };
}

export function getMaxRounds() {
  return SCORECARD_SIZE;
}
