import { CATEGORIES, getLeaderboard, getScoreTotals, getTurnSummary } from '../games/five-of-a-kind/rules.js';

function formatDice(dice, held) {
  return dice
    .map((value, index) => {
      const holdTag = held[index] ? 'H' : ' ';
      return `[${index + 1}:${value}|${holdTag}]`;
    })
    .join(' ');
}

function formatScorecard(scorecard) {
  return CATEGORIES.map((category) => `${category}: ${scorecard[category] ?? '-'}`).join('\n');
}

export function renderFiveOfAKindTurn(game) {
  const summary = getTurnSummary(game);
  const player = game.players[summary.currentPlayer];
  const totals = getScoreTotals(player.scorecard);

  return [
    `Five of a Kind — Round ${summary.round}`,
    `Player ${summary.currentPlayer + 1} turn`,
    `Rolls left: ${summary.rollsLeft}`,
    `Dice: ${formatDice(summary.dice, summary.held)}`,
    `Open categories: ${summary.available.join(', ')}`,
    '--- Scorecard ---',
    formatScorecard(player.scorecard),
    '--- Totals ---',
    `Upper: ${totals.upperSubtotal}  Bonus: ${totals.upperBonus}  Lower: ${totals.lowerTotal}  Total: ${totals.total}`,
  ].join('\n');
}

export function renderFiveOfAKindResults(game) {
  const board = getLeaderboard(game);

  const lines = ['Five of a Kind — Final Results'];
  for (const entry of board) {
    lines.push(
      `Player ${entry.playerIndex + 1}: total=${entry.total} (upper=${entry.upperSubtotal}, bonus=${entry.upperBonus}, lower=${entry.lowerTotal})`,
    );
  }

  return lines.join('\n');
}

