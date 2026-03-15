import {
  createGame,
  getRuleHint,
  getScore,
  getValidMoves,
  playSelection,
  rollDice,
  toggleSelectedTile,
} from './game/rules.js';

const elements = {
  tiles: document.getElementById('tiles'),
  rollBtn: document.getElementById('roll-btn'),
  playBtn: document.getElementById('play-btn'),
  newBtn: document.getElementById('new-btn'),
  statusText: document.getElementById('status-text'),
  diceText: document.getElementById('dice-text'),
  rollText: document.getElementById('roll-text'),
  scoreText: document.getElementById('score-text'),
  turnText: document.getElementById('turn-text'),
  ruleText: document.getElementById('rule-text'),
  movesList: document.getElementById('moves-list'),
};

let game = createGame();

function statusLabel(status) {
  if (status === 'awaitingRoll') return 'Awaiting roll';
  if (status === 'awaitingMove') return 'Awaiting move';
  if (status === 'won') return 'Won 🎉';
  if (status === 'lost') return 'Lost';
  return status;
}

function selectedTotal() {
  return game.selectedTiles.reduce((total, value) => total + value, 0);
}

function renderTiles() {
  elements.tiles.innerHTML = '';

  for (let tile = 1; tile <= game.tileCount; tile += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.textContent = String(tile);

    const isOpen = game.openTiles.includes(tile);
    const isSelected = game.selectedTiles.includes(tile);

    if (!isOpen) {
      button.classList.add('closed');
      button.disabled = true;
    }

    if (isSelected) {
      button.classList.add('selected');
    }

    button.addEventListener('click', () => {
      toggleSelectedTile(game, tile);
      render();
    });

    elements.tiles.appendChild(button);
  }
}

function renderMoves() {
  const validMoves = getValidMoves(game);
  elements.movesList.innerHTML = '';

  if (validMoves.length === 0) {
    const li = document.createElement('li');
    li.textContent = game.rollTotal === null ? 'Roll to see available moves.' : 'No valid moves.';
    elements.movesList.appendChild(li);
    return;
  }

  for (const move of validMoves) {
    const li = document.createElement('li');
    li.textContent = `${move.join(' + ')} = ${game.rollTotal}`;
    elements.movesList.appendChild(li);
  }
}

function renderMeta() {
  const diceText = game.currentDice.length > 0 ? game.currentDice.join(', ') : '-';
  const rollText = game.rollTotal ?? '-';

  elements.statusText.textContent = statusLabel(game.status);
  elements.diceText.textContent = diceText;
  elements.rollText.textContent =
    game.status === 'awaitingMove'
      ? `${rollText} (selected: ${selectedTotal()})`
      : String(rollText);
  elements.scoreText.textContent = String(getScore(game));
  elements.turnText.textContent = String(game.turn);
  elements.ruleText.textContent = getRuleHint(game);

  const isActive = game.status === 'awaitingRoll' || game.status === 'awaitingMove';
  elements.rollBtn.disabled = game.status !== 'awaitingRoll';
  elements.playBtn.disabled = game.status !== 'awaitingMove';
  elements.newBtn.disabled = false;

  if (!isActive) {
    elements.playBtn.disabled = true;
  }
}

function render() {
  renderTiles();
  renderMoves();
  renderMeta();
}

elements.rollBtn.addEventListener('click', () => {
  try {
    rollDice(game);
    render();
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(error.message);
  }
});

elements.playBtn.addEventListener('click', () => {
  try {
    playSelection(game);
    render();
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(error.message);
  }
});

elements.newBtn.addEventListener('click', () => {
  game = createGame();
  render();
});

render();

