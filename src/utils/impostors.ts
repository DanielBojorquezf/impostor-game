export function getMaxImpostors(playerCount: number): number {
  if (playerCount < 3) {
    return 1;
  }
  return Math.floor((playerCount - 1) / 6) + 1;
}

export function pickImpostorIndices(playerCount: number, impostorCount: number): number[] {
  const indices = Array.from({ length: playerCount }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, impostorCount).sort((a, b) => a - b);
}

export function formatImpostorLabel(count: number): string {
  return count === 1 ? '1 impostor' : `${count} impostores`;
}
