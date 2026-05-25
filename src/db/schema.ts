export const CREATE_WORDS_TABLE = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  word TEXT NOT NULL,
  hint TEXT NOT NULL,
  played_at INTEGER DEFAULT NULL
);
`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_words_category ON words(category)',
  'CREATE INDEX IF NOT EXISTS idx_words_played_at ON words(played_at)',
];