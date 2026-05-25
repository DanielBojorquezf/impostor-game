import { getDB } from './connection';

export type Word = {
  id: number;
  category: string;
  word: string;
  hint: string;
};

function buildPlaceholders(count: number): string {
  return Array(count).fill('?').join(', ');
}

export async function getCategories(): Promise<string[]> {
  const db = await getDB();
  const rows = await db.query<{ category: string }>(
    'SELECT DISTINCT category FROM words ORDER BY category',
  );
  return rows.map((row) => row.category);
}

export async function getRandomWord(categories: string[]): Promise<Word> {
  if (categories.length === 0) {
    throw new Error('At least one category is required');
  }

  const db = await getDB();
  const placeholders = buildPlaceholders(categories.length);

  const findWord = async (): Promise<Word | null> => {
    const rows = await db.query<Word>(
      `SELECT id, category, word, hint
       FROM words
       WHERE category IN (${placeholders}) AND played_at IS NULL
       ORDER BY RANDOM()
       LIMIT 1`,
      categories,
    );
    return rows[0] ?? null;
  };

  let word = await findWord();
  if (!word) {
    await db.execute(
      `UPDATE words SET played_at = NULL WHERE category IN (${placeholders})`,
      categories,
    );
    word = await findWord();
  }

  if (!word) {
    throw new Error('No words available for selected categories');
  }

  await db.execute(
    "UPDATE words SET played_at = strftime('%s', 'now') WHERE id = ?",
    [word.id],
  );

  return word;
}
