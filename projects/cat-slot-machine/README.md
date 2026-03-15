# cat-slot-machine

Standalone slot machine project themed around your cat-fight characters.

## Separation strategy (from cat-fight game)

- Keep this game in its own folder: `projects/cat-slot-machine`.
- Do **not** import logic from the existing dice games under `src/games`.
- Share only art assets (full body + face close-up) by exporting/copying images into `src/assets/art`.
- Maintain a single manifest at `src/assets/cats.js` so character additions do not require game-engine changes.

## Project structure

- `index.html`: standalone browser entrypoint
- `src/main.js`: UI orchestration and bankroll state
- `src/game/reels.js`: reel construction, spin logic, payout evaluation
- `src/assets/cats.js`: cat symbol manifest (full-body/face-close-up pairs)
- `src/ui/styles.css`: game styles
- `tests/reels.test.js`: engine tests

## Local run

From this folder:

```bash
npm install
npm run start
```

Open `http://localhost:4173`.

## Tests

```bash
npm test
```

## Add your real cat-fight images

1. Create files under `src/assets/art/`:
   - `<cat>-full.png`
   - `<cat>-face.png`
2. Update `src/assets/cats.js` paths to those files.
3. Add additional cats by appending objects to `CAT_ASSETS`.

## Create and publish new GitHub repository

From workspace root (`/home/kali/dice-engine-games`):

```bash
git checkout -b feat/cat-slot-machine
git add projects/cat-slot-machine
git commit -m "Add standalone cat slot machine prototype"
```

Create a new repository on GitHub (for example `cat-slot-machine`) and then push only this branch to that remote:

```bash
git remote add cat-slot-machine <YOUR_NEW_REPO_URL>
git push -u cat-slot-machine feat/cat-slot-machine:main
```

If you want this as a fully separate local git history, copy `projects/cat-slot-machine` into a new directory and run:

```bash
cd /path/to/cat-slot-machine
git init
git add .
git commit -m "Initial commit"
git remote add origin <YOUR_NEW_REPO_URL>
git push -u origin main
```

