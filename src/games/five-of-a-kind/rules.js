export function isFiveOfAKind(roll) {
  return roll.length > 0 && roll.every((v) => v === roll[0]);
}
