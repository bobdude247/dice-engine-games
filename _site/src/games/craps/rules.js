import { rollDie } from '../../engine/dice/roll.js';

const COME_OUT_NATURALS = new Set([7, 11]);
const COME_OUT_CRAPS = new Set([2, 3, 12]);

function assertValidPair(dice) {
  if (!Array.isArray(dice) || dice.length !== 2) {
    throw new Error('Craps rolls must contain exactly 2 dice.');
  }

  for (const die of dice) {
    if (!Number.isInteger(die) || die < 1 || die > 6) {
      throw new Error('Dice values must be integers from 1 to 6.');
    }
  }
}

function assertBankrollConfig({ startingBankroll, tableMin, tableMax }) {
  if (!Number.isInteger(startingBankroll) || startingBankroll <= 0) {
    throw new Error('startingBankroll must be a positive integer.');
  }

  if (!Number.isInteger(tableMin) || tableMin <= 0) {
    throw new Error('tableMin must be a positive integer.');
  }

  if (!Number.isInteger(tableMax) || tableMax < tableMin) {
    throw new Error('tableMax must be an integer greater than or equal to tableMin.');
  }

  if (startingBankroll < tableMin) {
    throw new Error('startingBankroll must be at least tableMin.');
  }
}

function createStats() {
  return {
    wins: 0,
    losses: 0,
    rolls: 0,
    biggestBet: 0,
    biggestWin: 0,
  };
}

export function sumDice(dice) {
  assertValidPair(dice);
  return dice[0] + dice[1];
}

export function createGame({ startingBankroll = 500, tableMin = 5, tableMax = 200, rng = Math.random } = {}) {
  assertBankrollConfig({ startingBankroll, tableMin, tableMax });

  return {
    startingBankroll,
    bankroll: startingBankroll,
    tableMin,
    tableMax,
    status: 'inProgress',
    phase: 'comeOut',
    point: null,
    activeBet: 0,
    round: 1,
    lastRoll: null,
    lastOutcome: null,
    message: 'Place a Pass Line bet to start.',
    history: [],
    stats: createStats(),
    rng,
  };
}

export function getTableLimits(game) {
  return {
    min: game.tableMin,
    max: Math.min(game.tableMax, game.bankroll),
  };
}

export function canPlaceBet(game, amount) {
  if (game.status !== 'inProgress') return false;
  if (game.activeBet > 0) return false;
  if (!Number.isInteger(amount)) return false;
  if (amount < game.tableMin || amount > game.tableMax) return false;
  return amount <= game.bankroll;
}

export function placeBet(game, amount) {
  if (!canPlaceBet(game, amount)) {
    throw new Error('Bet must be an integer within table limits and available bankroll.');
  }

  game.activeBet = amount;
  game.bankroll -= amount;
  game.stats.biggestBet = Math.max(game.stats.biggestBet, amount);
  game.message = game.phase === 'comeOut' ? 'Bet accepted. Roll the come-out.' : `Point is ${game.point}. Roll again.`;

  return game;
}

export function rollDicePair(rng = Math.random) {
  return [rollDie(6, rng), rollDie(6, rng)];
}

function pushHistory(game, entry) {
  game.history.unshift(entry);
  if (game.history.length > 12) {
    game.history.length = 12;
  }
}

function settleWin(game, label) {
  const payout = game.activeBet * 2;
  const profit = game.activeBet;

  game.bankroll += payout;
  game.stats.wins += 1;
  game.stats.biggestWin = Math.max(game.stats.biggestWin, profit);
  game.lastOutcome = 'win';

  pushHistory(game, {
    round: game.round,
    outcome: 'win',
    label,
    point: game.point,
    total: game.lastRoll.total,
    bet: game.activeBet,
    bankroll: game.bankroll,
  });

  game.phase = 'comeOut';
  game.point = null;
  game.activeBet = 0;
  game.round += 1;

  if (game.bankroll < game.tableMin) {
    game.status = 'busted';
    game.message = 'You won the round, but bankroll is below table minimum. Session over.';
  } else {
    game.message = `Pass Line WIN (${label}). Place your next bet.`;
  }
}

function settleLoss(game, label) {
  game.stats.losses += 1;
  game.lastOutcome = 'loss';

  pushHistory(game, {
    round: game.round,
    outcome: 'loss',
    label,
    point: game.point,
    total: game.lastRoll.total,
    bet: game.activeBet,
    bankroll: game.bankroll,
  });

  game.phase = 'comeOut';
  game.point = null;
  game.activeBet = 0;
  game.round += 1;

  if (game.bankroll < game.tableMin) {
    game.status = 'busted';
    game.message = 'Seven-out / craps. Bankroll is below table minimum. Session over.';
  } else {
    game.message = `Pass Line LOSS (${label}). Place your next bet.`;
  }
}

export function playRoll(game) {
  if (game.status !== 'inProgress') {
    throw new Error('Session is over. Start a new game.');
  }

  if (game.activeBet <= 0) {
    throw new Error('Place a bet before rolling.');
  }

  const dice = rollDicePair(game.rng);
  const total = sumDice(dice);
  const phaseBefore = game.phase;

  game.lastRoll = {
    dice,
    total,
    phase: phaseBefore,
  };
  game.stats.rolls += 1;

  if (phaseBefore === 'comeOut') {
    if (COME_OUT_NATURALS.has(total)) {
      settleWin(game, total === 7 ? 'Natural 7' : 'Natural 11');
      return game;
    }

    if (COME_OUT_CRAPS.has(total)) {
      settleLoss(game, `Craps ${total}`);
      return game;
    }

    game.phase = 'point';
    game.point = total;
    game.lastOutcome = 'pointSet';
    game.message = `Point is ${total}. Keep rolling for ${total} before a 7.`;
    return game;
  }

  if (total === game.point) {
    settleWin(game, `Made the point ${total}`);
    return game;
  }

  if (total === 7) {
    settleLoss(game, 'Seven-out');
    return game;
  }

  game.lastOutcome = 'noDecision';
  game.message = `No decision (${total}). Point remains ${game.point}. Roll again.`;
  return game;
}
