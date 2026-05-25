import initSqlJs, { Database, SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export type DbRow = Record<string, SqlValue>;

export interface DatabaseAdapter {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T extends DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  runTransaction(fn: () => Promise<void>): Promise<void>;
}

class SqlJsAdapter implements DatabaseAdapter {
  private isInTransaction = false;

  constructor(private db: Database) {}

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    this.db.run(sql, params as SqlValue[]);
    if (!this.isInTransaction) {
      persistSqlJsDatabase(this.db);
    }
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
    this.db.run('BEGIN');
    this.isInTransaction = true;
    try {
      await fn();
      this.db.run('COMMIT');
      persistSqlJsDatabase(this.db);
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    } finally {
      this.isInTransaction = false;
    }
  }
}

let cachedDb: DatabaseAdapter | null = null;
const SQLJS_STORAGE_KEY = 'impostor:sqljs-db';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function persistSqlJsDatabase(db: Database): void {
  localStorage.setItem(SQLJS_STORAGE_KEY, bytesToBase64(db.export()));
}

async function createWebDatabase(): Promise<DatabaseAdapter> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const savedDb = localStorage.getItem(SQLJS_STORAGE_KEY);
  const db = savedDb ? new SQL.Database(base64ToBytes(savedDb)) : new SQL.Database();
  return new SqlJsAdapter(db);
}

export async function getDB(): Promise<DatabaseAdapter> {
  if (cachedDb) {
    return cachedDb;
  }

  cachedDb = await createWebDatabase();
  return cachedDb;
}
