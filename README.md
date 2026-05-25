# El Impostor

**El Impostor** — social deduction party game for in-person groups. Configure players & categories, deal secret cards, reveal the impostor.

Pass one phone around the table: most players see the same secret word, but one or more **impostors** only get a vague hint. Players give clues out loud; the group tries to spot who does not really know the word.

This project works as a **web app** (browser or static hosting such as Apache) and as a **mobile app** (Android/iOS via Capacitor) from the same codebase.

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Building for production](#building-for-production)
- [Deployment](#deployment)
  - [Web (Apache / static hosting)](#web-apache--static-hosting)
  - [Mobile (Capacitor)](#mobile-capacitor)
- [Data & persistence](#data--persistence)
- [Word database](#word-database)
- [Development notes](#development-notes)
- [Documentation](#documentation)
- [License](#license)

---

## Features

- **Single-screen setup** — players, categories, and impostor count on the home screen
- **1,000 words** across 20 categories (SQLite, seeded on first launch)
- **Hold-to-reveal cards** — private word/hint view per player; hidden again on release
- **Multiple impostors** — optional; max scales with group size (1 impostor per 6 players)
- **Resume game** — in-progress rounds stored in `localStorage`
- **Remember setup** — last players, categories, and impostor count restored on next visit
- **Flat game UI** — playful colors, Fredoka + Nunito fonts, mobile-first layout
- **Spanish UI** — all player-facing text; code and identifiers in English

---

## How it works

1. **Home** — Add players (minimum 3), select categories (minimum 1), optionally adjust impostor count, tap **Empezar**.
2. **Deal** — Each player holds the card to reveal their role (word or impostor + hint), then passes the phone.
3. **First to start** — A random player is chosen to open the discussion.
4. **End** — After debating, reveal impostor(s), secret word, and category; close to return home.

No online multiplayer, voting, or accounts — one device shared by the group.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| UI | [React](https://react.dev/) 18 + [Ionic](https://ionicframework.com/) 8 |
| Build | [Vite](https://vitejs.dev/) 6 + TypeScript |
| Routing | `@ionic/react-router` / React Router 5 |
| Local DB | [sql.js](https://sql.js.org/) (web) · [@capacitor-community/sqlite](https://github.com/capacitor-community/sqlite) (native) |
| Native shell | [Capacitor](https://capacitorjs.com/) 6 |
| Persistence | `localStorage` (setup + active game) |

---

## Project structure

```
impostor/
├── src/
│   ├── pages/           # Home, Deal, FirstToStart, EndGame
│   ├── components/      # PlayerCard, modals (players, categories, impostors)
│   ├── db/              # Schema, seed, connection, words repository
│   ├── state/           # GameContext, types
│   ├── utils/           # colors, storage, impostor rules
│   ├── data/            # words.json (1000 entries, bundled at build)
│   └── theme/           # CSS variables + global game styles
├── el_impostor_1000_words.json   # Source word list (reference / backup)
├── spec.md              # Product specification (Spanish)
├── tasks.md             # Implementation task list
├── capacitor.config.ts
├── index.html
└── package.json
```

---

## Requirements

- **Node.js** 18+ (22 LTS recommended)
- **npm** 9+
- For **Android/iOS builds**: Capacitor tooling (Android Studio / Xcode on macOS for iOS)

---

## Getting started

### Install dependencies

```bash
npm install
```

If you hit TLS/certificate errors on some networks:

```bash
npm install --strict-ssl=false
```

### Development server

```bash
npm run dev
```

Open the URL shown in the terminal (default: `http://localhost:5173`).

On first load, the app seeds the in-browser SQLite database from `src/data/words.json` (may take a few seconds).

### Production preview (local)

```bash
npm run build
npm run preview
```

---

## Building for production

```bash
npm run build
```

Output is written to **`dist/`** — static HTML, JS, CSS, and the sql.js WASM asset. This folder is what you deploy for web or sync into Capacitor.

---

## Deployment

### Web (Apache / static hosting)

The app is a **single-page application (SPA)**. After `npm run build`:

1. Copy the contents of **`dist/`** to your web root (e.g. Apache `DocumentRoot` or a subdirectory).
2. Configure the server so unknown routes fall back to **`index.html`** (required for client-side routing).

**Apache example** (`.htaccess` in the deploy folder):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

3. Ensure **MIME types** for `.wasm` are correct if sql.js WASM is served from your server (many Apache setups already handle `application/wasm`).

No server-side runtime is required — only static files. HTTPS is recommended for mobile browsers.

### Mobile (Capacitor)

The same `dist/` output is used as `webDir` in `capacitor.config.ts`.

```bash
npm run build
npx cap add android    # once
npx cap sync
npx cap run android
```

For iOS (macOS only):

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

Native builds use `@capacitor-community/sqlite` instead of sql.js for the word database.

---

## Data & persistence

### SQLite (`words` table)

| Column | Description |
|--------|-------------|
| `category` | Category slug (e.g. `famosos`, `comida`) |
| `word` | Secret word (Spanish) |
| `hint` | Impostor clue (Spanish) |
| `played_at` | Unix timestamp when last used; reset per category when exhausted |

### localStorage keys

| Key | Purpose |
|-----|---------|
| `impostor:partida_actual` | Active game state (resume deal flow) |
| `impostor:ultimos_jugadores` | Last player names from setup |
| `impostor:ultimas_categorias` | Last selected categories |
| `impostor:ultimo_num_impostores` | Last impostor count |

### Impostor limit

Maximum impostors: **`1 + floor((players - 1) / 6)`**

| Players | Max impostors |
|---------|----------------|
| 3–6 | 1 |
| 7–12 | 2 |
| 13–18 | 3 |

Default is **1** impostor.

---

## Word database

- **Bundled seed:** `src/data/words.json` (1000 words, 20 categories)
- **Reference file:** `el_impostor_1000_words.json` at repo root
- Words are marked as played in SQLite to avoid repeats until a category pool is exhausted, then that category resets

Categories include: `famosos`, `objetos`, `comida`, `lugares`, `animales`, `profesiones`, `deportes`, `peliculas`, `anime`, `videojuegos`, and others.

---

## Development notes

### Language conventions

- **Code** — English: file names, variables, routes, DB columns, comments
- **UI & game data** — Spanish: buttons, labels, words, hints

### Routes

| Path | Screen |
|------|--------|
| `/` | Home (setup) |
| `/game/deal` | Card deal |
| `/game/first` | First player to speak |
| `/game/end` | Reveal & close |

Legacy paths `/setup/players` and `/setup/categories` redirect to `/`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |

---

## Documentation

- [`spec.md`](./spec.md) — Full product specification (Spanish)
- [`tasks.md`](./tasks.md) — Implementation checklist and phases

---

## License

No license file is included yet. Add one before public distribution if you plan to open-source or share the project.
