import { CAT_ASSETS } from './assets/cats.js';
import { BANKROLL_BASE, canTopOff, formatBankroll, topOff } from './game/bankroll.js';
import { createReelStrip, evaluateSpin, spinReels } from './game/reels.js';

let bankroll = BANKROLL_BASE;

const reelStrip = createReelStrip(CAT_ASSETS);

const reelsEl = document.getElementById('reels');
const betInputEl = document.getElementById('bet');
const spinButtonEl = document.getElementById('spinButton');
const topOffButtonEl = document.getElementById('topOffButton');
const resultEl = document.getElementById('result');
const bankrollEl = document.getElementById('bankroll');

const REEL_COUNT = 3;
const SPIN_FRAMES_PER_REEL = [12, 16, 20];
const FRAME_DURATION_MS = 70;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function emojiFallback(symbol) {
  return symbol.type === 'faceCloseUp' ? '😺' : '🐈';
}

function renderSymbols(symbols, options = {}) {
  const { spinning = false, settlingReel = null } = options;
  reelsEl.innerHTML = '';
  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i];
    const card = document.createElement('article');
    card.className = 'symbol-card';
    if (spinning) {
      card.classList.add('is-spinning');
    }
    if (settlingReel === i) {
      card.classList.add('is-settling');
    }

    const img = document.createElement('img');
    img.src = symbol.image;
    img.alt = symbol.label;
    img.loading = 'lazy';
    img.onerror = () => {
      img.style.display = 'none';
      fallback.style.display = 'grid';
    };

    const fallback = document.createElement('div');
    fallback.className = 'fallback';
    fallback.style.display = 'none';
    fallback.textContent = `${emojiFallback(symbol)} ${symbol.label}`;

    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = symbol.label;

    card.append(img, fallback, caption);
    reelsEl.appendChild(card);
  }
}

function updateBankroll() {
  bankrollEl.textContent = formatBankroll(bankroll);
  topOffButtonEl.disabled = !canTopOff(bankroll);
}

function topOffBankroll() {
  if (!canTopOff(bankroll)) {
    resultEl.textContent = 'Top Off is available only when bankroll is 0 or below.';
    return;
  }

  bankroll = topOff(bankroll);
  resultEl.textContent = `Bankroll topped off to $${BANKROLL_BASE.toLocaleString()}.`;
  updateBankroll();
}

async function animateSpin(finalSymbols) {
  const display = spinReels(reelStrip, REEL_COUNT);

  for (let frame = 0; frame < Math.max(...SPIN_FRAMES_PER_REEL); frame += 1) {
    for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex += 1) {
      if (frame < SPIN_FRAMES_PER_REEL[reelIndex]) {
        display[reelIndex] = spinReels(reelStrip, 1)[0];
      }
      if (frame === SPIN_FRAMES_PER_REEL[reelIndex]) {
        display[reelIndex] = finalSymbols[reelIndex];
      }
    }

    const settlingReel = SPIN_FRAMES_PER_REEL.findIndex((stopFrame) => stopFrame === frame);
    renderSymbols(display, { spinning: true, settlingReel: settlingReel === -1 ? null : settlingReel });
    await sleep(FRAME_DURATION_MS);
  }

  renderSymbols(finalSymbols);
}

async function spin() {
  if (canTopOff(bankroll)) {
    resultEl.textContent = 'Bankroll is empty. Use Top Off to reset to $10,000.';
    return;
  }

  const bet = Math.max(1, Number.parseInt(betInputEl.value, 10) || 1);
  if (bet > bankroll) {
    resultEl.textContent = 'Not enough bankroll for that bet.';
    return;
  }

  spinButtonEl.disabled = true;
  spinButtonEl.textContent = 'Spinning...';
  resultEl.textContent = 'Reels spinning...';

  bankroll -= bet;
  updateBankroll();

  const symbols = spinReels(reelStrip, REEL_COUNT);
  await animateSpin(symbols);

  const outcome = evaluateSpin(symbols, bet);
  bankroll += outcome.payout;

  resultEl.textContent = `${outcome.reason} | Multiplier x${outcome.multiplier} | Payout $${outcome.payout.toLocaleString()}`;
  updateBankroll();

  spinButtonEl.disabled = false;
  spinButtonEl.textContent = 'Spin';
}

spinButtonEl.addEventListener('click', spin);
topOffButtonEl.addEventListener('click', topOffBankroll);
updateBankroll();
renderSymbols(spinReels(reelStrip, REEL_COUNT));
