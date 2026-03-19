# shut-the-box

Standalone browser implementation of **Shut the Box** inside the dice-engine workspace.

## Organization strategy

- Kept fully isolated under `projects/shut-the-box`.
- Game logic is separated from UI:
  - `src/game/roll.js`: RNG + die helper
  - `src/game/rules.js`: pure game + match state engine (single and 1–4 player)
  - `src/main.js`: DOM wiring, setup controls, player scoreboard, and interactions
  - `src/ui/styles.css`: mobile-first green table styling
  - `tests/rules.test.js`: rules and multiplayer match test coverage
- No imports from root `src/games/*`, so this project can be split out later with minimal effort.

## Rules implemented

- Per-player game rules:
  - Tiles start open from 1 to 9.
  - Roll two dice by default.
  - If the sum of open tiles is 6 or less, switch to one die.
  - Player must close one or more open tiles summing to the current roll.
  - If no valid move exists after a roll: player loses.
  - If all tiles are closed: player wins with score 0.
  - Score is the sum of remaining open tiles.
- Match rules (1–4 players):
  - Players take turns sequentially.
  - Each player plays their own board until they win or lose.
  - After all players finish, lowest score wins.
  - Ties are supported and all tied winners are shown.

## UI updates

- Mobile-first layout for controls, board, status, and player list.
- Player count setup supports 1, 2, 3, or 4 players.
- Solid green casino/felt visual theme similar to the Five of a Kind style direction.
- Dedicated player scoreboard panel shows active player, status, score, and winner markers.

## Run locally

From `projects/shut-the-box`:

```bash
python3 -m http.server 4174
```

Open `http://localhost:4174`.

## Tests

From `projects/shut-the-box`:

```bash
node --test
```

Current test suite includes multiplayer match flow coverage in addition to single-player behavior.
