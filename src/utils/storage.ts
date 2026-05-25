import { GameState } from '../state/types';

const CURRENT_GAME_KEY = 'impostor:partida_actual';
const LAST_CATEGORIES_KEY = 'impostor:ultimas_categorias';
const LAST_PLAYERS_KEY = 'impostor:ultimos_jugadores';
const LAST_IMPOSTOR_COUNT_KEY = 'impostor:ultimo_num_impostores';

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

type LegacyGameState = GameState & { impostorIndex?: number };

function normalizeGameState(raw: LegacyGameState | null): GameState | null {
  if (!raw?.players?.length) {
    return null;
  }

  const impostorIndices =
    raw.impostorIndices ??
    (raw.impostorIndex !== undefined ? [raw.impostorIndex] : [0]);

  return {
    players: raw.players,
    dealOrder: raw.dealOrder ?? raw.players.map((_, index) => index),
    currentIndex: raw.currentIndex ?? 0,
    impostorIndices,
    word: raw.word,
    hint: raw.hint,
    category: raw.category,
    firstToStart: raw.firstToStart ?? '',
  };
}

export function saveCurrentGame(state: GameState): void {
  writeJson(CURRENT_GAME_KEY, state);
}

export function loadCurrentGame(): GameState | null {
  return normalizeGameState(readJson<LegacyGameState>(CURRENT_GAME_KEY));
}

export function clearCurrentGame(): void {
  localStorage.removeItem(CURRENT_GAME_KEY);
}

export function saveLastPlayers(players: string[]): void {
  writeJson(LAST_PLAYERS_KEY, players);
}

export function loadLastPlayers(): string[] {
  const players = readJson<string[]>(LAST_PLAYERS_KEY);
  return Array.isArray(players) ? players : [];
}

export function saveLastCategories(categories: string[]): void {
  writeJson(LAST_CATEGORIES_KEY, categories);
}

export function loadLastCategories(): string[] {
  const categories = readJson<string[]>(LAST_CATEGORIES_KEY);
  return Array.isArray(categories) ? categories : [];
}

export function saveLastImpostorCount(count: number): void {
  writeJson(LAST_IMPOSTOR_COUNT_KEY, count);
}

export function loadLastImpostorCount(): number {
  return readJson<number>(LAST_IMPOSTOR_COUNT_KEY) ?? 1;
}
