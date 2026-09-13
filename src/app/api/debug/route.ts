import { NextResponse } from "next/server";
import fs from "node:fs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { cartIdFromCookie } from "@/lib/cart";

export const runtime = "nodejs";
const instance = Math.random().toString(36).slice(2, 8);

/** Diagnostics for the serverless database mirror: which instance answered, what it holds, what the blob store holds. */
export async function GET() {
  const d = await db();
  const file = process.env.VERCEL ? "/tmp/amazon.db" : "data/amazon.db";
  const counts: Record<string, number> = {};
  for (const t of ["users", "carts", "cart_items", "orders"]) counts[t] = Number((await d.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get<{ n: number }>())?.n ?? 0);
  let blobs: { pathname: string; uploadedAt: string; size: number }[] = [];
  if (process.env.BLOB_READ_WRITE_TOKEN) { try { const { list } = await import("@vercel/blob"); blobs = (await list({ prefix: "db/", limit: 5 })).blobs.map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt.toString(), size: b.size })); } catch (e) { blobs = [{ pathname: "list failed: " + (e as Error).message, uploadedAt: "", size: 0 }]; } }
  const user = await currentUser();
  const cartId = await cartIdFromCookie();
  const cartRows = cartId ? await d.prepare("SELECT product_id, qty FROM cart_items WHERE cart_id=?").all(cartId) : [];
  return NextResponse.json({ instance, vercel: !!process.env.VERCEL, blobToken: !!process.env.BLOB_READ_WRITE_TOKEN, fileSize: fs.existsSync(file) ? fs.statSync(file).size : null, counts, blobs, user: user?.email ?? null, cartId, cartRows });
}
