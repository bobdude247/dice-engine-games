# shut-the-box

Standalone browser implementation of **Shut the Box** inside the dice-engine workspace.

## Organization strategy

- Kept fully isolated under `projects/shut-the-box`.
- Game logic is separated from UI:
  - `src/game/roll.js`: RNG + die helper
  - `src/game/rules.js`: pure game state and rules engine
  - `src/main.js`: DOM wiring and user interactions
  - `src/ui/styles.css`: styling
  - `tests/rules.test.js`: rules-focused test coverage
- No imports from root `src/games/*`, so this project can be split out later with minimal effort.

## Rules implemented

- Tiles start open from 1 to 9.
- Roll two dice by default.
- If the sum of open tiles is 6 or less, switch to one die.
- Player must close one or more open tiles summing to the current roll.
- If no valid move exists after a roll: game is lost.
- If all tiles are closed: game is won.
- Score is the sum of remaining open tiles.

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

