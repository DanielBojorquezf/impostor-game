import { getDB } from './connection';
import { CREATE_INDEXES, CREATE_WORDS_TABLE } from './schema';
import { parseSeed } from './seed';

export async function initDB(): Promise<void> {
  const db = await getDB();
  await db.execute(CREATE_WORDS_TABLE);
  for (const indexSql of CREATE_INDEXES) {
    await db.execute(indexSql);
  }

  const [{ count }] = await db.query<{ count: number }>('SELECT COUNT(*) AS count FROM words');
  if (Number(count) === 0) {
    const rows = parseSeed();
    await db.runTransaction(async () => {
      for (const row of rows) {
        await db.execute(
          'INSERT INTO words (category, word, hint) VALUES (?, ?, ?)',
          [row.category, row.word, row.hint],
        );
      }
    });
  }
}
