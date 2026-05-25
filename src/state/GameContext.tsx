import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getRandomWord } from '../db/wordsRepo';
import { GameState } from './types';
import { pickImpostorIndices } from '../utils/impostors';
import {
  clearCurrentGame,
  loadCurrentGame,
  saveCurrentGame,
  saveLastCategories,
  saveLastImpostorCount,
  saveLastPlayers,
} from '../utils/storage';

type GameContextValue = {
  state: GameState | null;
  startGame: (
    players: string[],
    categories: string[],
    impostorCount: number,
  ) => Promise<void>;
  nextPlayer: () => void;
  pickFirstToStart: () => string;
  endGame: () => void;
  hasSavedGame: boolean;
};

const GameContext = createContext<GameContextValue | null>(null);

function createDealOrder(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(() => loadCurrentGame());

  useEffect(() => {
    if (state) {
      saveCurrentGame(state);
    }
  }, [state]);

  const startGame = useCallback(
    async (players: string[], categories: string[], impostorCount: number) => {
      const word = await getRandomWord(categories);
      const impostorIndices = pickImpostorIndices(players.length, impostorCount);
      const nextState: GameState = {
        players,
        dealOrder: createDealOrder(players.length),
        currentIndex: 0,
        impostorIndices,
        word: word.word,
        hint: word.hint,
        category: word.category,
        firstToStart: '',
      };
      saveLastPlayers(players);
      saveLastCategories(categories);
      saveLastImpostorCount(impostorCount);
      setState(nextState);
    },
    [],
  );

  const nextPlayer = useCallback(() => {
    setState((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        currentIndex: current.currentIndex + 1,
      };
    });
  }, []);

  const pickFirstToStart = useCallback((): string => {
    let selected = '';
    setState((current) => {
      if (!current) {
        return current;
      }
      selected = current.players[Math.floor(Math.random() * current.players.length)];
      return {
        ...current,
        firstToStart: selected,
      };
    });
    return selected;
  }, []);

  const endGame = useCallback(() => {
    clearCurrentGame();
    setState(null);
  }, []);

  const value = useMemo(
    () => ({
      state,
      startGame,
      nextPlayer,
      pickFirstToStart,
      endGame,
      hasSavedGame: state !== null,
    }),
    [state, startGame, nextPlayer, pickFirstToStart, endGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
