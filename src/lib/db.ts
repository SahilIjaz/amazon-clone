import { createClient, type Client, type InArgs, type InValue } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";

/**
 * Database access (libSQL). Locally a SQLite file (./data/amazon.db); in production point TURSO_DATABASE_URL
 * (+ TURSO_AUTH_TOKEN) at a hosted Turso database. Without it on Vercel an ephemeral /tmp database is used.
 */
type Row = Record<string, unknown>;
type Args = InValue[];

class Statement {
  constructor(private c: Client, private sql: string) {}
  async get<T = Row>(...args: Args): Promise<T | undefined> { const r = await this.c.execute({ sql: this.sql, args: args as InArgs }); return r.rows[0] as T | undefined; }
  async all<T = Row>(...args: Args): Promise<T[]> { const r = await this.c.execute({ sql: this.sql, args: args as InArgs }); return r.rows as unknown as T[]; }
  async run(...args: Args): Promise<{ changes: number }> { const r = await this.c.execute({ sql: this.sql, args: args as InArgs }); return { changes: r.rowsAffected }; }
}

export class Db {
  constructor(private c: Client) {}
  prepare(sql: string) { return new Statement(this.c, sql); }
  exec(sql: string) { return this.c.executeMultiple(sql); }
}

let _db: Db | null = null;
let _ready: Promise<void> | null = null;

function client(): Client {
  if (process.env.TURSO_DATABASE_URL) return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const dir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.VERCEL) console.warn("[db] TURSO_DATABASE_URL is not set: using an ephemeral /tmp database.");
  return createClient({ url: "file:" + path.join(dir, "amazon.db") });
}

export async function db(): Promise<Db> {
  if (!_db) _db = new Db(client());
  if (!_ready) _ready = migrate(_db);
  await _ready;
  return _db;
}

export const uid = () => crypto.randomUUID();

async function migrate(d: Db) {
  await d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email_verified INTEGER DEFAULT 0,
    prime INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS verification_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code TEXT NOT NULL, purpose TEXT NOT NULL, used INTEGER DEFAULT 0, expires_at TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, to_email TEXT NOT NULL, subject TEXT NOT NULL, text TEXT NOT NULL, html TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL, phone TEXT, line1 TEXT NOT NULL, line2 TEXT, city TEXT NOT NULL, state TEXT NOT NULL, zip TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'United States',
    is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL, last4 TEXT NOT NULL, name_on_card TEXT NOT NULL, exp_month INTEGER NOT NULL, exp_year INTEGER NOT NULL, is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    saved INTEGER DEFAULT 0,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (cart_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ordered',
    subtotal_cents INTEGER NOT NULL, shipping_cents INTEGER NOT NULL DEFAULT 0, tax_cents INTEGER NOT NULL DEFAULT 0, total_cents INTEGER NOT NULL,
    address_json TEXT NOT NULL, payment_json TEXT NOT NULL, delivery_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, title TEXT NOT NULL, price_cents INTEGER NOT NULL, qty INTEGER NOT NULL, thumb TEXT);
  CREATE TABLE IF NOT EXISTS lists (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS list_items (list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, added_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (list_id, product_id));
  CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, rating INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS browsing_history (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, viewed_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (user_id, product_id));
  `);
}
