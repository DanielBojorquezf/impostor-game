export const CARD_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6BCB77',
  '#A66CFF',
  '#FF9F45',
  '#4D96FF',
  '#F45B69',
  '#2EC4B6',
  '#E71D36',
];

export function getColorForIndex(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length];
}
