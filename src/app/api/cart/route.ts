import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { ensureCartId } from "@/lib/cart";
import { db } from "@/lib/db";
import { product } from "@/lib/products";

/**
 * Cart mutations. JSON: { productId, qty?, action?: "add"|"set"|"remove"|"save"|"unsave" }.
 * Also accepts a classic form post (from the search results "Add to cart") and redirects back.
 */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let b: Record<string, string> = {};
  if (ct.includes("application/json")) b = await req.json(); else { const fd = await req.formData(); fd.forEach((v, k) => { b[k] = String(v); }); }
  const p = product(b.productId || "");
  if (!p) return NextResponse.json({ ok: false, error: "Unknown product" }, { status: 400 });
  const user = await currentUser();
  const cartId = await ensureCartId(user);
  const d = await db();
  const action = b.action || "add";
  const qty = Math.max(0, Math.min(30, Number(b.qty ?? 1) || 1));
  if (action === "remove" || (action === "set" && qty === 0)) await d.prepare("DELETE FROM cart_items WHERE cart_id=? AND product_id=?").run(cartId, p.id);
  else if (action === "set") await d.prepare("UPDATE cart_items SET qty=? WHERE cart_id=? AND product_id=?").run(qty, cartId, p.id);
  else if (action === "save") await d.prepare("UPDATE cart_items SET saved=1 WHERE cart_id=? AND product_id=?").run(cartId, p.id);
  else if (action === "unsave") await d.prepare("UPDATE cart_items SET saved=0 WHERE cart_id=? AND product_id=?").run(cartId, p.id);
  else await d.prepare("INSERT INTO cart_items (cart_id,product_id,qty,saved) VALUES (?,?,?,0) ON CONFLICT(cart_id,product_id) DO UPDATE SET qty=MIN(30, qty+excluded.qty), saved=0").run(cartId, p.id, qty);
  await d.prepare("UPDATE carts SET updated_at=datetime('now') WHERE id=?").run(cartId);
  if (b.redirect) return NextResponse.redirect(new URL(b.redirect, req.url), 303);
  return NextResponse.json({ ok: true });
}
