import * as SQLite from 'expo-sqlite';
import type { Client } from '../hooks/useClients';
import type { CloudSubscription } from '../hooks/useCloud';

const DB_NAME = 'ezviz-offline.db';
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

export function initDb(): void {
  const d = getDb();
  d.execSync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      synced_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cloud_subscriptions (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      synced_at INTEGER NOT NULL
    );
  `);
}

export async function saveClients(clients: Client[]): Promise<void> {
  const d = getDb();
  const now = Date.now();
  await d.runAsync('DELETE FROM clients');
  for (const client of clients) {
    await d.runAsync(
      'INSERT OR REPLACE INTO clients (id, data, synced_at) VALUES (?, ?, ?)',
      [client.id, JSON.stringify(client), now],
    );
  }
}

export async function getCachedClients(): Promise<Client[]> {
  const d = getDb();
  const rows = await d.getAllAsync<{ data: string }>(
    'SELECT data FROM clients ORDER BY synced_at DESC',
  );
  return rows.map((r) => JSON.parse(r.data) as Client);
}

export async function saveSubscriptions(subs: CloudSubscription[]): Promise<void> {
  const d = getDb();
  const now = Date.now();
  await d.runAsync('DELETE FROM cloud_subscriptions');
  for (const sub of subs) {
    await d.runAsync(
      'INSERT OR REPLACE INTO cloud_subscriptions (id, data, synced_at) VALUES (?, ?, ?)',
      [sub.id, JSON.stringify(sub), now],
    );
  }
}

export async function getCachedSubscriptions(): Promise<CloudSubscription[]> {
  const d = getDb();
  const rows = await d.getAllAsync<{ data: string }>(
    'SELECT data FROM cloud_subscriptions ORDER BY synced_at DESC',
  );
  return rows.map((r) => JSON.parse(r.data) as CloudSubscription);
}
