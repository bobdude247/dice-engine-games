import { CAT_ASSETS } from './assets/cats.js';
import { createReelStrip, evaluateSpin, spinReels } from './game/reels.js';

let bankroll = 100;

const reelStrip = createReelStrip(CAT_ASSETS);

const reelsEl = document.getElementById('reels');
const betInputEl = document.getElementById('bet');
const spinButtonEl = document.getElementById('spinButton');
const resultEl = document.getElementById('result');
const bankrollEl = document.getElementById('bankroll');

function emojiFallback(symbol) {
  return symbol.type === 'faceCloseUp' ? '😺' : '🐈';
}

function renderSymbols(symbols) {
  reelsEl.innerHTML = '';
  for (const symbol of symbols) {
    const card = document.createElement('article');
    card.className = 'symbol-card';

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
  bankrollEl.textContent = `Bankroll: ${bankroll}`;
}

function spin() {
  const bet = Math.max(1, Number.parseInt(betInputEl.value, 10) || 1);
  if (bet > bankroll) {
    resultEl.textContent = 'Not enough bankroll for that bet.';
    return;
  }

  bankroll -= bet;

  const symbols = spinReels(reelStrip, 3);
  renderSymbols(symbols);

  const outcome = evaluateSpin(symbols, bet);
  bankroll += outcome.payout;

  resultEl.textContent = `${outcome.reason} | Multiplier x${outcome.multiplier} | Payout ${outcome.payout}`;
  updateBankroll();
}

spinButtonEl.addEventListener('click', spin);
updateBankroll();
renderSymbols(spinReels(reelStrip, 3));

