import { createClient, type Client, type InArgs, type InValue } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";

/**
 * Database access (libSQL / SQLite dialect).
 *  - Local development: a SQLite file at ./data/amazon.db.
 *  - Production with TURSO_DATABASE_URL: hosted Turso database (preferred).
 *  - Production without Turso but with BLOB_READ_WRITE_TOKEN: the SQLite file lives in /tmp and is mirrored to a
 *    Vercel Blob after every write, and refreshed from it when another instance has written since. Last writer wins,
 *    which is fine for a demo store and keeps accounts, carts and orders alive across serverless instances.
 */
type Row = Record<string, unknown>;
type Args = InValue[];
const MUTATING = /^\s*(insert|update|delete|replace)/i;

class Statement {
  constructor(private db: Db, private sql: string) {}
  async get<T = Row>(...args: Args): Promise<T | undefined> { const r = await this.db.client.execute({ sql: this.sql, args: args as InArgs }); return r.rows[0] as T | undefined; }
  async all<T = Row>(...args: Args): Promise<T[]> { const r = await this.db.client.execute({ sql: this.sql, args: args as InArgs }); return r.rows as unknown as T[]; }
  async run(...args: Args): Promise<{ changes: number }> {
    const r = await this.db.client.execute({ sql: this.sql, args: args as InArgs });
    if (MUTATING.test(this.sql)) await this.db.persist();
    return { changes: r.rowsAffected };
  }
}

export class Db {
  client: Client;
  constructor(client: Client, private mirror: BlobMirror | null) { this.client = client; }
  prepare(sql: string) { return new Statement(this, sql); }
  exec(sql: string) { return this.client.executeMultiple(sql); }
  async persist() { if (this.mirror) await this.mirror.upload(); }
  async refresh() { if (this.mirror && (await this.mirror.pullIfNewer())) { this.client.close(); this.client = await fileClient(this.mirror.file); } }
}

/**
 * Mirrors the SQLite file to one Vercel Blob (db/amazon.db). Discovery uses head() on that fixed pathname (the listing
 * API is only eventually consistent), and downloads add a cache-busting query so the edge cache never serves a stale
 * copy after an overwrite. Last writer wins, which is fine for a demo store.
 */
const POINTER = "db/amazon.db";
class BlobMirror {
  private lastSeen = 0; private lastCheck = 0; private uploading: Promise<void> | null = null; private dirty = false;
  constructor(public file: string) {}
  private async sdk() { return import("@vercel/blob"); }
  /** head() with retries: an overwrite in progress can 404 for a moment. */
  private async pointer(): Promise<{ url: string; uploadedAt: Date } | null> {
    const { head, list } = await this.sdk();
    for (let i = 0; i < 4; i++) {
      try { return await head(POINTER); } catch { await new Promise((r) => setTimeout(r, 200 * (i + 1))); }
    }
    try { const { blobs } = await list({ prefix: POINTER, limit: 1 }); return blobs[0] ?? null; } catch { return null; }
  }
  async pullIfNewer(force = false): Promise<boolean> {
    const now = Date.now();
    if (!force && now - this.lastCheck < 400) return false;
    this.lastCheck = now;
    try {
      const h = await this.pointer();
      if (!h) { if (force) console.log("[db] no mirrored database yet"); return false; }
      const at = new Date(h.uploadedAt).getTime();
      if (at <= this.lastSeen) return false;
      const buf = await download(`${h.url}?v=${at}`);
      fs.writeFileSync(this.file, buf);
      this.lastSeen = at;
      console.log(`[db] pulled mirror from ${new Date(at).toISOString()} (${buf.length} bytes)`);
      return true;
    } catch (e) { console.error("[db] blob pull failed", (e as Error).message, (e as { cause?: Error }).cause?.message); return false; }
  }
  async upload() {
    this.dirty = true;
    if (this.uploading) return this.uploading;
    this.uploading = (async () => {
      while (this.dirty) {
        this.dirty = false;
        try {
          const { put } = await this.sdk();
          await put(POINTER, fs.readFileSync(this.file), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/octet-stream" });
          const h = await this.pointer();
          this.lastSeen = h ? new Date(h.uploadedAt).getTime() : Date.now() + 2000;
          console.log(`[db] mirrored ${fs.statSync(this.file).size} bytes to blob`);
        } catch (e) { console.error("[db] blob upload failed", (e as Error).message); }
      }
      this.uploading = null;
    })();
    return this.uploading;
  }
}

/** Plain HTTPS download (Next.js patches global fetch on the server, which has failed for blob URLs). */
function download(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { family: 4, headers: { "cache-control": "no-cache" }, timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`blob download ${res.statusCode}`)); return; }
      const chunks: Buffer[] = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve(Buffer.concat(chunks))); res.on("error", reject);
    }).on("error", reject);
  });
}

/** File-backed client with the rollback journal (no WAL) so the .db file alone always holds every committed write. */
async function fileClient(file: string): Promise<Client> {
  const c = createClient({ url: "file:" + file });
  await c.execute("PRAGMA journal_mode=DELETE");
  await c.execute("PRAGMA synchronous=FULL");
  return c;
}

let _db: Db | null = null;
let _ready: Promise<void> | null = null;

async function open(): Promise<Db> {
  if (process.env.TURSO_DATABASE_URL) return new Db(createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }), null);
  const dir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "amazon.db");
  let mirror: BlobMirror | null = null;
  if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) { mirror = new BlobMirror(file); await mirror.pullIfNewer(true); }
  else if (process.env.VERCEL) console.warn("[db] no TURSO_DATABASE_URL or BLOB_READ_WRITE_TOKEN: using an ephemeral /tmp database.");
  return new Db(await fileClient(file), mirror);
}

export async function db(): Promise<Db> {
  if (!_ready) _ready = (async () => { _db = await open(); await migrate(_db); })();
  await _ready;
  await _db!.refresh();
  return _db!;
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
  CREATE TABLE IF NOT EXISTS carts (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, updated_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS cart_items (cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, qty INTEGER NOT NULL DEFAULT 1, saved INTEGER DEFAULT 0, added_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (cart_id, product_id));
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
