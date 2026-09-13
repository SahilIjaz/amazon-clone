import { cookies } from "next/headers";
import { db, uid } from "./db";
import { CART_COOKIE, type User } from "./auth";
import { product, type Product } from "./products";

export type CartLine = { product: Product; qty: number; saved: boolean };

/** Cart id from the guest cookie (read-only; route handlers create it via ensureCartId). */
export async function cartIdFromCookie() { return (await cookies()).get(CART_COOKIE)?.value ?? null; }

/** The cart that belongs to the signed-in user, or the guest cookie cart. */
export async function currentCartId(user: User | null): Promise<string | null> {
  const d = await db();
  if (user) {
    const row = await d.prepare("SELECT id FROM carts WHERE user_id=?").get<{ id: string }>(user.id);
    return row?.id ?? null;
  }
  return cartIdFromCookie();
}

/** Guarantees a cart exists for this request. Only call from route handlers (sets the guest cookie). */
export async function ensureCartId(user: User | null): Promise<string> {
  const d = await db();
  if (user) {
    const row = await d.prepare("SELECT id FROM carts WHERE user_id=?").get<{ id: string }>(user.id);
    if (row) return row.id;
    const id = uid(); await d.prepare("INSERT INTO carts (id,user_id) VALUES (?,?)").run(id, user.id); return id;
  }
  const c = await cookies();
  let id = c.get(CART_COOKIE)?.value;
  if (id && (await d.prepare("SELECT id FROM carts WHERE id=?").get(id))) return id;
  id = uid();
  await d.prepare("INSERT INTO carts (id,user_id) VALUES (?,NULL)").run(id);
  c.set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return id;
}

/** After sign-in, fold the guest cart into the user's cart (quantities add up). */
export async function mergeGuestCart(user: User) {
  const guestId = await cartIdFromCookie();
  if (!guestId) return;
  const d = await db();
  const target = await ensureCartId(user);
  if (target === guestId) return;
  const rows = await d.prepare("SELECT product_id, qty, saved FROM cart_items WHERE cart_id=?").all<{ product_id: number; qty: number; saved: number }>(guestId);
  for (const r of rows) {
    await d.prepare("INSERT INTO cart_items (cart_id,product_id,qty,saved) VALUES (?,?,?,?) ON CONFLICT(cart_id,product_id) DO UPDATE SET qty=qty+excluded.qty").run(target, r.product_id, r.qty, r.saved);
  }
  await d.prepare("DELETE FROM carts WHERE id=?").run(guestId);
  (await cookies()).delete(CART_COOKIE);
}

export async function cartLines(cartId: string | null): Promise<CartLine[]> {
  if (!cartId) return [];
  const rows = await (await db()).prepare("SELECT product_id, qty, saved FROM cart_items WHERE cart_id=? ORDER BY added_at DESC").all<{ product_id: number; qty: number; saved: number }>(cartId);
  return rows.map((r) => ({ product: product(r.product_id)!, qty: r.qty, saved: !!r.saved })).filter((l) => l.product);
}

export async function cartCount(cartId: string | null) {
  if (!cartId) return 0;
  const r = await (await db()).prepare("SELECT COALESCE(SUM(qty),0) AS n FROM cart_items WHERE cart_id=? AND saved=0").get<{ n: number }>(cartId);
  return Number(r?.n ?? 0);
}

export function subtotal(lines: CartLine[]) { return lines.filter((l) => !l.saved).reduce((s, l) => s + l.product.price * l.qty, 0); }
