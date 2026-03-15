export function rollDie(sides = 6, rng = Math.random) {
  if (!Number.isInteger(sides) || sides < 2) {
    throw new Error('sides must be an integer >= 2.');
  }

  const value = rng();
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value >= 1) {
    throw new Error('rng must return a number in [0, 1).');
  }

  return Math.floor(value * sides) + 1;
}

