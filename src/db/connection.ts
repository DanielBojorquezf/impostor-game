import { Capacitor } from '@capacitor/core';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export type DbRow = Record<string, SqlValue>;

export interface DatabaseAdapter {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T extends DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  runTransaction(fn: () => Promise<void>): Promise<void>;
}

class SqlJsAdapter implements DatabaseAdapter {
  constructor(private db: Database) {}

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    this.db.run(sql, params as SqlValue[]);
  }

  async query<T extends DbRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const statement = this.db.prepare(sql);
    statement.bind(params as SqlValue[]);
    const rows: T[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
    statement.free();
    return rows;
  }

  async runTransaction(fn: () => Promise<void>): Promise<void> {
    await this.execute('BEGIN');
    try {
      await fn();
      await this.execute('COMMIT');
    } catch (error) {
      await this.execute('ROLLBACK');
      throw error;
    }
  }
}

class CapacitorSqliteAdapter implements DatabaseAdapter {
  constructor(
    private sqlite: import('@capacitor-community/sqlite').SQLiteDBConnection,
  ) {}

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.sqlite.run(sql, params as never[]);
  }

  async query<T extends DbRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.sqlite.query(sql, params as never[]);
    return (result.values ?? []) as T[];
  }

  async runTransaction(fn: () => Promise<void>): Promise<void> {
    await this.sqlite.beginTransaction();
    try {
      await fn();
      await this.sqlite.commitTransaction();
    } catch (error) {
      await this.sqlite.rollbackTransaction();
      throw error;
    }
  }
}

let cachedDb: DatabaseAdapter | null = null;

async function createWebDatabase(): Promise<DatabaseAdapter> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const db = new SQL.Database();
  return new SqlJsAdapter(db);
}

async function createNativeDatabase(): Promise<DatabaseAdapter> {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const dbName = 'impostor';
  const connection = await sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
  await connection.open();
  return new CapacitorSqliteAdapter(connection);
}

export async function getDB(): Promise<DatabaseAdapter> {
  if (cachedDb) {
    return cachedDb;
  }

  const platform = Capacitor.getPlatform();
  cachedDb = platform === 'web' ? await createWebDatabase() : await createNativeDatabase();
  return cachedDb;
}
