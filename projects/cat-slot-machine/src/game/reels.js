export const SYMBOL_TYPES = Object.freeze({
  FULL_BODY: 'fullBody',
  FACE_CLOSE_UP: 'faceCloseUp',
});

export const DEFAULT_REEL_COUNT = 3;

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

export function createReelStrip(catAssets, repeatsPerSymbol = 2) {
  if (!Array.isArray(catAssets) || catAssets.length === 0) {
    throw new Error('catAssets must be a non-empty array');
  }

  const strip = [];
  for (const cat of catAssets) {
    if (!cat.id) throw new Error('Each cat asset must include id');
    if (!cat.fullBody || !cat.faceCloseUp) {
      throw new Error(`Cat asset "${cat.id}" requires both fullBody and faceCloseUp image paths`);
    }

    for (let i = 0; i < repeatsPerSymbol; i += 1) {
      strip.push({ catId: cat.id, type: SYMBOL_TYPES.FULL_BODY, image: cat.fullBody, label: `${cat.name} (Full)` });
      strip.push({ catId: cat.id, type: SYMBOL_TYPES.FACE_CLOSE_UP, image: cat.faceCloseUp, label: `${cat.name} (Face)` });
    }
  }

  return strip;
}

export function spinReels(reelStrip, reelCount = DEFAULT_REEL_COUNT, rng = Math.random) {
  if (!Array.isArray(reelStrip) || reelStrip.length === 0) {
    throw new Error('reelStrip must be a non-empty array');
  }
  if (!Number.isInteger(reelCount) || reelCount <= 0) {
    throw new Error('reelCount must be a positive integer');
  }

  return Array.from({ length: reelCount }, () => {
    const index = Math.floor(rng() * reelStrip.length);
    return reelStrip[index];
  });
}

export function evaluateSpin(symbols, bet = 1) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('symbols must be a non-empty array');
  }

  const byCat = new Map();
  for (const symbol of symbols) {
    byCat.set(symbol.catId, (byCat.get(symbol.catId) ?? 0) + 1);
  }

  const counts = [...byCat.values()].sort((a, b) => b - a);
  const top = counts[0] ?? 0;
  const second = counts[1] ?? 0;

  let multiplier = 0;
  let reason = 'No match';

  if (top === symbols.length) {
    multiplier = 12;
    reason = `${symbols.length} of a kind`;
  } else if (top === symbols.length - 1) {
    multiplier = 4;
    reason = `${symbols.length - 1} of a kind`;
  } else if (top === 2 && second === 2) {
    multiplier = 2;
    reason = 'Two pairs';
  } else if (top === 2) {
    multiplier = 1;
    reason = 'One pair';
  }

  const payout = bet * multiplier;
  return { multiplier, payout, reason };
}

