# Tasks: Impostor App

Ordered task list to build the app described in `spec.md`. All code, identifiers, file names, comments and commit messages **in English**. User-facing copy stays in Spanish (the game is for Spanish-speaking players).

Estimated total: ~12–16 hours of focused work.

---

## Phase 0 — Project setup

### T0.1 — Initialize Ionic React project
- Install Ionic CLI globally if missing: `npm install -g @ionic/cli`.
- Create project: `ionic start impostor-app blank --type=react`.
- Pick TypeScript when prompted (recommended) or stay with JS — keep one choice consistent across the repo.
- Run `ionic serve` and confirm the blank app loads.

### T0.2 — Set up folder structure
Create the following directories under `src/`:
```
src/
  pages/
  components/
  db/
  state/
  utils/
  data/
```

### T0.3 — Install dependencies
- `npm install @ionic/react-router react-router react-router-dom`
- `npm install @capacitor-community/sqlite` (for native SQLite on mobile builds).
- `npm install sql.js` (for web fallback, optional but recommended for `ionic serve` testing).
- `npm install jeep-sqlite` (web component used by `@capacitor-community/sqlite` in browser).

### T0.4 — Configure routing
- In `App.tsx` (or `App.jsx`), set up `IonReactRouter` with placeholder routes:
  - `/` → `Home`
  - `/setup/players` → `SetupPlayers`
  - `/setup/categories` → `SetupCategories`
  - `/game/deal` → `Deal`
  - `/game/first` → `FirstToStart`
  - `/game/end` → `EndGame`
- Each page can be a stub `<IonPage><IonContent>{name}</IonContent></IonPage>` for now.

---

## Phase 1 — Database layer

### T1.1 — Define schema
Create `src/db/schema.ts`:
- Export `CREATE_WORDS_TABLE` SQL string with the table from spec (`id`, `category`, `word`, `hint`, `played_at`).
- Export `CREATE_INDEXES` SQL string with the two indexes (on `category` and `played_at`).

**Note:** rename Spanish column names from the spec to English (`categoria` → `category`, `palabra` → `word`, `pista` → `hint`). The data values stay in Spanish.

### T1.2 — Create seed file
Create `src/data/words.md` (this is your big list of 1000 words). Format inside the file is up to you; suggest a simple `category | word | hint` per line, e.g.:
```
objects | calculadora | número
food    | pizza       | italiana
```

Then create `src/db/seed.ts`:
- Parse `words.md` at build time (use Vite's `?raw` import: `import wordsRaw from '../data/words.md?raw'`).
- Export a `parseSeed(raw: string)` function returning `Array<{ category, word, hint }>`.
- Export a `buildSeedInsertSQL(rows)` function that returns parameterized inserts.

### T1.3 — Implement SQLite connection
Create `src/db/connection.ts`:
- Export an async `getDB()` that returns a SQLite connection.
- On web: use `sql.js` loading the `.wasm` from a CDN or `node_modules`.
- On native: use `@capacitor-community/sqlite`.
- Use Capacitor's platform detection (`Capacitor.getPlatform()`) to branch.
- Cache the connection in module scope so it's opened only once.

### T1.4 — Initialize database on first run
Create `src/db/init.ts`:
- Export `initDB()` which:
  1. Gets the connection.
  2. Runs `CREATE_WORDS_TABLE` and `CREATE_INDEXES`.
  3. Runs `SELECT COUNT(*) AS count FROM words`.
  4. If `count === 0`, parses `words.md` and runs the inserts in a transaction.
- Call `initDB()` from `App.tsx` inside a `useEffect`, gated behind a `dbReady` state so the rest of the app waits.

### T1.5 — Implement words repository
Create `src/db/wordsRepo.ts` with these functions:
- `getCategories(): Promise<string[]>` → `SELECT DISTINCT category FROM words ORDER BY category`.
- `getRandomWord(categories: string[]): Promise<Word>`:
  1. Run the `WHERE category IN (...) AND played_at IS NULL ORDER BY RANDOM() LIMIT 1` query.
  2. If no row returned, run `UPDATE words SET played_at = NULL WHERE category IN (...)`, then retry.
  3. After getting a row, run `UPDATE words SET played_at = strftime('%s','now') WHERE id = ?`.
  4. Return the word.
- All functions accept the DB connection or use the cached one from `getDB()`.

### T1.6 — Smoke-test the DB layer
- Add a temporary button on `Home` that calls `getRandomWord(['objects'])` and logs the result.
- Verify the same word isn't returned twice in a row.
- Verify the reset works by clicking enough times to exhaust a category.
- Remove the button before moving on.

---

## Phase 2 — Game state

### T2.1 — Define game state shape
Create `src/state/types.ts`:
```ts
export type GameState = {
  players: string[];
  dealOrder: number[];      // permutation of indices; for v1 same as [0..n-1]
  currentIndex: number;
  impostorIndex: number;
  word: string;
  hint: string;
  category: string;
  firstToStart: string;     // name picked at the end
};
```

### T2.2 — Create GameContext
Create `src/state/GameContext.tsx`:
- React context exposing `state: GameState | null` and setters.
- Provider wraps the app in `App.tsx`.
- Methods: `startGame(players, categories)`, `nextPlayer()`, `pickFirstToStart()`, `endGame()`.
- `startGame` calls `getRandomWord`, picks impostor index randomly, sets `currentIndex = 0`.
- `pickFirstToStart` picks any player at random (impostor not excluded) and stores it.

### T2.3 — Wire persistence to localStorage
Create `src/utils/storage.ts`:
- `saveCurrentGame(state)`, `loadCurrentGame()`, `clearCurrentGame()`.
- `saveLastPlayers(players)`, `loadLastPlayers()`.
- `saveLastCategories(cats)`, `loadLastCategories()`.

In `GameContext`:
- After every state change, persist to localStorage via `saveCurrentGame`.
- On provider mount, hydrate from `loadCurrentGame` if present.
- `endGame()` calls `clearCurrentGame()`.

---

## Phase 3 — UI utilities and shared components

### T3.1 — Card color palette
Create `src/utils/colors.ts`:
- Export `CARD_COLORS: string[]` (10 hex values from the spec).
- Export `getColorForIndex(i: number): string` → `CARD_COLORS[i % CARD_COLORS.length]`.

### T3.2 — Build PlayerCard component
Create `src/components/PlayerCard.tsx`:
- Props: `playerName`, `colorHex`, `isImpostor`, `word`, `hint`.
- State: `revealed: boolean`.
- Handlers: `onPointerDown` → set true; `onPointerUp`, `onPointerLeave`, `onPointerCancel` → set false.
- Also bind `onTouchStart` / `onTouchEnd` for iOS Safari compatibility.
- Apply CSS: `user-select: none`, `-webkit-touch-callout: none`, `-webkit-user-select: none`.
- Use `e.preventDefault()` on `pointerdown` to suppress text selection.
- Hidden state: shows player name + "Mantén presionado para revelar".
- Revealed + not impostor: "Palabra secreta:" / `word`.
- Revealed + impostor: "Eres el impostor" / "Pista: `hint`".
- Style: rounded corners (24px), shadow, fills ~70% width × ~55% height, background = `colorHex`.
- Add a subtle scale transform (`scale(0.97)`) while pressed.

### T3.3 — Create reusable styled list item
Create `src/components/PlayerListItem.tsx` for the players list in setup:
- Shows name + delete button.

### T3.4 — Create category toggle
Create `src/components/CategoryToggle.tsx`:
- Wraps `IonItem` + `IonToggle` for selecting a category.

---

## Phase 4 — Screens

### T4.1 — Home page
File: `src/pages/Home.tsx`.
- Big title "El Impostor".
- Primary button "Nueva partida" → navigates to `/setup/players`.
- If `loadCurrentGame()` returns a non-null state, also show "Continuar partida" → navigates to `/game/deal`.

### T4.2 — SetupPlayers page
File: `src/pages/SetupPlayers.tsx`.
- `IonInput` for name + "Agregar" button.
- Pressing Enter on the input also adds.
- List of added players using `PlayerListItem`.
- "Siguiente" button at the bottom, disabled when `players.length < 3`.
- On "Siguiente": store names in context (not yet starting game) and navigate to `/setup/categories`.
- Optionally pre-fill the list from `loadLastPlayers()` on mount.

### T4.3 — SetupCategories page
File: `src/pages/SetupCategories.tsx`.
- On mount, call `wordsRepo.getCategories()` to populate the toggle list.
- Each category is a `CategoryToggle`.
- "Empezar" button, disabled when zero selected.
- On "Empezar":
  1. Call `startGame(players, selectedCategories)` on context.
  2. Save last categories to localStorage.
  3. Navigate to `/game/deal`.

### T4.4 — Deal page
File: `src/pages/Deal.tsx`.
- Reads `state` from `GameContext`.
- Renders one `PlayerCard` for `players[state.currentIndex]` with its color from `getColorForIndex`.
- Below the card:
  - If `currentIndex < players.length - 1`: button "Siguiente jugador" → `nextPlayer()`.
  - If `currentIndex === players.length - 1`: button "Empezar" → `pickFirstToStart()` then navigate to `/game/first`.
- Button is always enabled regardless of reveal state.

### T4.5 — FirstToStart page
File: `src/pages/FirstToStart.tsx`.
- Big text: "El primero en empezar es:".
- Big name: `state.firstToStart`.
- Button "Continuar" → navigates to `/game/end`.

### T4.6 — EndGame page
File: `src/pages/EndGame.tsx`.
- Neutral header: "Cuando terminen de discutir…".
- Two buttons:
  - "Mostrar impostor" → toggles a hidden panel showing impostor name, the word, and the category.
  - "Cerrar" → calls `endGame()` and navigates to `/`.

---

## Phase 5 — Polish

### T5.1 — Prevent native long-press menus on mobile
- Add global CSS rule for `.player-card`:
  ```css
  .player-card {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  ```

### T5.2 — Prevent accidental back-navigation mid-deal
- On the Deal page, intercept the hardware back button (Ionic `useIonViewWillLeave` + `App.addListener('backButton', ...)`) and show a confirmation dialog "¿Salir de la partida?".

### T5.3 — Add transitions
- Subtle fade between players on `nextPlayer()`.
- Use Ionic's built-in route transitions for page navigations (default works fine).

### T5.4 — Loading state
- While `initDB()` is running, show an `IonLoading` with "Cargando…" so the home page doesn't render with empty data.

### T5.5 — Empty / error states
- If `getCategories()` returns an empty array (shouldn't happen but defensive), show "No hay palabras disponibles. Reinstala la app." on SetupCategories.
- Wrap DB calls in try/catch and log to console; show an `IonToast` with "Algo salió mal" on failure.

---

## Phase 6 — Build & deploy

### T6.1 — Add Capacitor platforms
- `npx cap add android`
- `npx cap add ios` (if on macOS)
- `ionic build && npx cap sync`.

### T6.2 — Configure SQLite on native
- Follow `@capacitor-community/sqlite` setup for Android (add `<application android:usesCleartextTraffic="false" ...>` is not needed; just register the plugin).
- For iOS, add the plugin to `Podfile` (handled by `cap sync`).
- Make sure `jeep-sqlite` web component is registered for web builds.

### T6.3 — Test on real device
- Run on Android: `npx cap run android`.
- Verify:
  - DB seeds on first launch.
  - Words don't repeat across plays until reset.
  - Hold-to-reveal works smoothly without long-press menus.
  - Closing the app mid-deal allows "Continuar partida" from Home.

### T6.4 — Build release artifacts
- Android: `cd android && ./gradlew assembleRelease`.
- iOS: archive via Xcode.

---

## Suggested commit milestones

1. Project scaffolding + routing skeleton (after Phase 0).
2. Database layer working with seed (after Phase 1).
3. Game state with persistence (after Phase 2).
4. Functional gameplay loop, ugly UI (after Phase 4).
5. Polished UI, mobile-ready (after Phase 5).
6. First device build (after Phase 6).