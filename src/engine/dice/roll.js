export function rollDie(sides = 6, rng = Math.random) {
  return 1 + Math.floor(rng() * sides);
}

export function rollDice(count = 5, sides = 6, rng = Math.random) {
  return Array.from({ length: count }, () => rollDie(sides, rng));
}
