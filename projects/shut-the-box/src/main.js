import {
  createMatch,
  getCurrentPlayer,
  getMatchScoreboard,
  getRuleHint,
  getScore,
  getValidMoves,
  playCurrentPlayerSelection,
  rollForCurrentPlayer,
  toggleCurrentPlayerTile,
} from './game/rules.js';

const elements = {
  tiles: document.getElementById('tiles'),
  diceTray: document.getElementById('dice-tray'),
  rollBtn: document.getElementById('roll-btn'),
  playBtn: document.getElementById('play-btn'),
  newBtn: document.getElementById('new-btn'),
  playerCount: document.getElementById('player-count'),
  tileCount: document.getElementById('tile-count'),
  applySetupBtn: document.getElementById('apply-setup-btn'),
  statusText: document.getElementById('status-text'),
  matchText: document.getElementById('match-text'),
  playerText: document.getElementById('player-text'),
  diceText: document.getElementById('dice-text'),
  rollText: document.getElementById('roll-text'),
  scoreText: document.getElementById('score-text'),
  turnText: document.getElementById('turn-text'),
  ruleText: document.getElementById('rule-text'),
  playersList: document.getElementById('players-list'),
  movesList: document.getElementById('moves-list'),
};

let match = createMatch({ playerCount: 1 });

function getSetupOptions() {
  const playerCount = Number.parseInt(elements.playerCount.value, 10) || 1;
  const tileCount = Number.parseInt(elements.tileCount.value, 10) || 9;
  return { playerCount, tileCount };
}

function currentPlayer() {
  return getCurrentPlayer(match);
}

function statusLabel(status) {
  if (status === 'awaitingRoll') return 'Awaiting roll';
  if (status === 'awaitingMove') return 'Awaiting move';
  if (status === 'won') return 'Won 🎉';
  if (status === 'lost') return 'Lost';
  return status;
}

function selectedTotal() {
  const player = currentPlayer();
  return player.selectedTiles.reduce((total, value) => total + value, 0);
}

function pipLayout(value) {
  const maps = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  return maps[value] ?? [];
}

function renderDiceTray() {
  const player = currentPlayer();
  elements.diceTray.innerHTML = '';

  if (player.currentDice.length === 0) {
    const placeholder = document.createElement('span');
    placeholder.className = 'dice-placeholder';
    placeholder.textContent = 'Roll to throw the dice.';
    elements.diceTray.appendChild(placeholder);
    return;
  }

  for (const value of player.currentDice) {
    const die = document.createElement('div');
    die.className = 'die';
    die.setAttribute('aria-label', `Die ${value}`);

    const pips = pipLayout(value);
    for (let cell = 1; cell <= 9; cell += 1) {
      const pip = document.createElement('span');
      pip.className = pips.includes(cell) ? 'pip on' : 'pip off';
      die.appendChild(pip);
    }

    elements.diceTray.appendChild(die);
  }
}

function renderTiles() {
  const player = currentPlayer();
  elements.tiles.innerHTML = '';

  for (let tile = 1; tile <= player.tileCount; tile += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.textContent = String(tile);

    const isOpen = player.openTiles.includes(tile);
    const isSelected = player.selectedTiles.includes(tile);

    if (!isOpen) {
      button.classList.add('closed');
      button.disabled = true;
    }

    if (isSelected) {
      button.classList.add('selected');
    }

    button.addEventListener('click', () => {
      toggleCurrentPlayerTile(match, tile);
      render();
    });

    elements.tiles.appendChild(button);
  }
}

function renderMoves() {
  const player = currentPlayer();
  const validMoves = getValidMoves(player);
  elements.movesList.innerHTML = '';

  if (validMoves.length === 0) {
    const li = document.createElement('li');
    li.textContent = player.rollTotal === null ? 'Roll to see available moves.' : 'No valid moves.';
    elements.movesList.appendChild(li);
    return;
  }

  for (const move of validMoves) {
    const li = document.createElement('li');
    li.textContent = `${move.join(' + ')} = ${player.rollTotal}`;
    elements.movesList.appendChild(li);
  }
}

function renderPlayers() {
  const scoreboard = getMatchScoreboard(match);
  elements.playersList.innerHTML = '';

  for (const entry of scoreboard) {
    const li = document.createElement('li');
    li.className = 'player-row';
    if (entry.isCurrent) {
      li.classList.add('current');
    }
    if (match.winnerIndexes.includes(entry.playerIndex)) {
      li.classList.add('winner');
    }

    const marker = match.winnerIndexes.includes(entry.playerIndex)
      ? '🏆 '
      : entry.isCurrent
        ? '▶ '
        : '';
    li.textContent = `${marker}Player ${entry.playerIndex + 1} — ${statusLabel(entry.status)} — score ${entry.score}`;
    elements.playersList.appendChild(li);
  }
}

function renderMeta() {
  const player = currentPlayer();
  const diceText = player.currentDice.length > 0 ? player.currentDice.join(', ') : '-';
  const rollText = player.rollTotal ?? '-';
  const inProgress = match.status === 'inProgress';

  elements.matchText.textContent = inProgress
    ? `In progress (${match.currentPlayerIndex + 1}/${match.playerCount})`
    : 'Completed';
  elements.playerText.textContent = `Player ${match.currentPlayerIndex + 1}`;
  elements.statusText.textContent = statusLabel(player.status);
  elements.diceText.textContent = diceText;
  elements.rollText.textContent =
    player.status === 'awaitingMove'
      ? `${rollText} (selected: ${selectedTotal()})`
      : String(rollText);
  elements.scoreText.textContent = String(getScore(player));
  elements.turnText.textContent = String(player.turn);
  elements.ruleText.textContent = inProgress ? getRuleHint(player) : 'Match complete.';

  elements.rollBtn.disabled = !inProgress || player.status !== 'awaitingRoll';
  elements.playBtn.disabled = !inProgress || player.status !== 'awaitingMove';
  elements.newBtn.disabled = false;
}

function render() {
  renderTiles();
  renderDiceTray();
  renderMoves();
  renderPlayers();
  renderMeta();
}

elements.rollBtn.addEventListener('click', () => {
  try {
    rollForCurrentPlayer(match);
    render();
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(error.message);
  }
});

elements.playBtn.addEventListener('click', () => {
  try {
    playCurrentPlayerSelection(match);
    render();
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(error.message);
  }
});

elements.newBtn.addEventListener('click', () => {
  match = createMatch(getSetupOptions());
  render();
});

elements.applySetupBtn.addEventListener('click', () => {
  match = createMatch(getSetupOptions());
  render();
});

render();
