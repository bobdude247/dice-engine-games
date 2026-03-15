export const BANKROLL_BASE = 10_000;

export function canTopOff(bankroll) {
  return bankroll <= 0;
}

export function topOff(bankroll, base = BANKROLL_BASE) {
  return canTopOff(bankroll) ? base : bankroll;
}

export function formatBankroll(bankroll) {
  return `Bankroll: $${bankroll.toLocaleString()}`;
}

