import wordsJson from '../data/words.json';

export type SeedWord = {
  category: string;
  word: string;
  hint: string;
};

type RawWord = {
  categoria: string;
  palabra: string;
  pista: string;
};

export function parseSeed(): SeedWord[] {
  return (wordsJson as RawWord[]).map((row) => ({
    category: row.categoria,
    word: row.palabra,
    hint: row.pista,
  }));
}

export function buildSeedInsertSQL(rows: SeedWord[]): { sql: string; params: unknown[][] } {
  const params = rows.map((row) => [row.category, row.word, row.hint]);
  const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
  const sql = `INSERT INTO words (category, word, hint) VALUES ${placeholders}`;
  return { sql, params };
}
