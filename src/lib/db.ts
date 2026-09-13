import { createClient, type Client, type InArgs, type InValue } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import { cookies } from "next/headers";

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
  async persist() {
    if (!this.mirror) return;
    const v = await this.mirror.upload();
    try { (await cookies()).set(VERSION_COOKIE, String(v), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 }); } catch { /* not in a route handler: the version still propagates through listing */ }
  }
  async refresh() {
    if (!this.mirror) return;
    let want = 0;
    try { want = Number((await cookies()).get(VERSION_COOKIE)?.value || 0); } catch { /* no request scope */ }
    if (await this.mirror.ensure(want)) { this.client.close(); this.client = await fileClient(this.mirror.file); }
  }
}

/**
 * Mirrors the SQLite file to Vercel Blob so serverless instances share state without a hosted database.
 * Every upload gets an immutable pathname db/amazon-<version>.db (version = ms timestamp), so downloads are never
 * served stale from the edge cache and never depend on the eventually-consistent listing/head APIs. The version a
 * browser last wrote or read travels in the `az_v` cookie: an instance that is behind that version fetches exactly that
 * file before answering, which keeps each shopper's own flow consistent across instances. Instances also converge on
 * the newest listed version in the background. Last writer wins; fine for a demo store.
 */
export const VERSION_COOKIE = "az_v";
const PREFIX = "db/amazon-";
const versionOf = (pathname: string) => Number(pathname.slice(PREFIX.length).replace(/\.db$/, "")) || 0;
class BlobMirror {
  version = 0; private lastList = 0; private uploading: Promise<void> | null = null; private dirty = false;
  constructor(public file: string) {}
  private async sdk() { return import("@vercel/blob"); }
  private async newestListed(): Promise<{ v: number; url: string } | null> {
    try {
      const { list } = await this.sdk();
      const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
      const best = blobs.map((b) => ({ v: versionOf(b.pathname), url: b.url })).sort((a, b) => b.v - a.v)[0];
      return best ?? null;
    } catch (e) { console.error("[db] blob list failed", (e as Error).message); return null; }
  }
  /** Bring the local file up to at least `want` (a version seen in a cookie), or to the newest listed version. */
  async ensure(want: number, force = false): Promise<boolean> {
    let target: { v: number; url: string } | null = null;
    if (want > this.version) target = { v: want, url: `${this.base()}${PREFIX}${want}.db` };
    else if (force || Date.now() - this.lastList > 5000) { this.lastList = Date.now(); const n = await this.newestListed(); if (n && n.v > this.version) target = n; }
    if (!target) return false;
    for (let i = 0; i < 3; i++) {
      try { const buf = await download(target.url); fs.writeFileSync(this.file, buf); this.version = target.v; console.log(`[db] pulled version ${target.v} (${buf.length} bytes)`); return true; }
      catch (e) { if (i === 2) console.error("[db] blob pull failed", (e as Error).message); else await new Promise((r) => setTimeout(r, 250)); }
    }
    return false;
  }
  /** Public host of the store, derived from the token (vercel_blob_rw_<storeId>_…) so cold instances can fetch by version. */
  private base() {
    if (process.env.BLOB_BASE_URL) return process.env.BLOB_BASE_URL;
    const m = (process.env.BLOB_READ_WRITE_TOKEN || "").match(/^vercel_blob_rw_([A-Za-z0-9]+)_/);
    return m ? `https://${m[1]!.toLowerCase()}.public.blob.vercel-storage.com/` : "";
  }
  async upload(): Promise<number> {
    this.dirty = true;
    if (this.uploading) { await this.uploading; return this.version; }
    this.uploading = (async () => {
      while (this.dirty) {
        this.dirty = false;
        const v = Math.max(Date.now(), this.version + 1);
        try {
          const { put, del, list } = await this.sdk();
          const r = await put(`${PREFIX}${v}.db`, fs.readFileSync(this.file), { access: "public", addRandomSuffix: false, contentType: "application/octet-stream", cacheControlMaxAge: 31536000 });
          this.version = v;
          if (!process.env.BLOB_BASE_URL) process.env.BLOB_BASE_URL = r.url.slice(0, r.url.indexOf(PREFIX));
          console.log(`[db] mirrored version ${v} (${fs.statSync(this.file).size} bytes)`);
          if (v % 10 === 0 || Math.random() < 0.1) { const { blobs } = await list({ prefix: PREFIX, limit: 1000 }); const old = blobs.map((b) => ({ v: versionOf(b.pathname), url: b.url })).sort((a, b) => b.v - a.v).slice(30).map((x) => x.url); if (old.length) await del(old).catch(() => {}); }
        } catch (e) { console.error("[db] blob upload failed", (e as Error).message); }
      }
      this.uploading = null;
    })();
    await this.uploading;
    return this.version;
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
  if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) { mirror = new BlobMirror(file); await mirror.ensure(0, true); }
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
