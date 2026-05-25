export type GameState = {
  players: string[];
  dealOrder: number[];
  currentIndex: number;
  impostorIndices: number[];
  word: string;
  hint: string;
  category: string;
  firstToStart: string;
};
