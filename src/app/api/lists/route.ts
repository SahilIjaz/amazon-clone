import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, uid } from "@/lib/db";

/** Wish lists: add/remove a product to the default list, or create a new list. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to save items" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { productId?: number; action?: string; listId?: string; name?: string };
  const d = await db();
  if (b.action === "create") {
    const name = (b.name || "").trim(); if (!name) return NextResponse.json({ ok: false, error: "Give your list a name" }, { status: 400 });
    const id = uid(); await d.prepare("INSERT INTO lists (id,user_id,name,is_default) VALUES (?,?,?,0)").run(id, user.id, name); return NextResponse.json({ ok: true, id });
  }
  if (b.action === "delete-list") { await d.prepare("DELETE FROM lists WHERE id=? AND user_id=? AND is_default=0").run(b.listId || "", user.id); return NextResponse.json({ ok: true }); }
  let listId = b.listId;
  if (!listId) {
    const row = await d.prepare("SELECT id FROM lists WHERE user_id=? ORDER BY is_default DESC, created_at LIMIT 1").get<{ id: string }>(user.id);
    if (row) listId = row.id; else { listId = uid(); await d.prepare("INSERT INTO lists (id,user_id,name,is_default) VALUES (?,?,?,1)").run(listId, user.id, "Shopping List"); }
  }
  if (b.action === "remove") await d.prepare("DELETE FROM list_items WHERE list_id=? AND product_id=?").run(listId, Number(b.productId));
  else await d.prepare("INSERT OR IGNORE INTO list_items (list_id,product_id) VALUES (?,?)").run(listId, Number(b.productId));
  return NextResponse.json({ ok: true, listId });
}
