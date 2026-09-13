import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { cartLines, currentCartId } from "@/lib/cart";
import { db, uid } from "@/lib/db";
import { deliveryDate, deliveryISO, money } from "@/lib/products";
import { sendMail } from "@/lib/mail";

/** Places the order from the active cart lines: snapshots items, address and card, clears the cart, e-mails a confirmation. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to continue" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { addressId?: string; cardId?: string; shipping?: string };
  const d = await db();
  const address = await d.prepare("SELECT * FROM addresses WHERE id=? AND user_id=?").get<Record<string, unknown>>(b.addressId || "", user.id);
  const card = await d.prepare("SELECT id, brand, last4, name_on_card FROM payment_methods WHERE id=? AND user_id=?").get<Record<string, unknown>>(b.cardId || "", user.id);
  if (!address) return NextResponse.json({ ok: false, error: "Select a delivery address." }, { status: 400 });
  if (!card) return NextResponse.json({ ok: false, error: "Select a payment method." }, { status: 400 });
  const cartId = await currentCartId(user);
  const lines = (await cartLines(cartId)).filter((l) => !l.saved);
  if (!lines.length) return NextResponse.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const fast = b.shipping === "fast";
  const ship = fast ? 9.99 : subtotal >= 35 ? 0 : 5.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + ship + tax;
  const id = "114-" + Math.floor(1000000 + Math.random() * 9000000) + "-" + Math.floor(1000000 + Math.random() * 9000000);
  await d.prepare("INSERT INTO orders (id,user_id,status,subtotal_cents,shipping_cents,tax_cents,total_cents,address_json,payment_json,delivery_date) VALUES (?,?,?,?,?,?,?,?,?,?)").run(id, user.id, "ordered", Math.round(subtotal * 100), Math.round(ship * 100), Math.round(tax * 100), Math.round(total * 100), JSON.stringify(address), JSON.stringify(card), deliveryISO(fast ? 1 : 2));
  for (const l of lines) await d.prepare("INSERT INTO order_items (order_id,product_id,title,price_cents,qty,thumb) VALUES (?,?,?,?,?,?)").run(id, l.product.id, l.product.title, Math.round(l.product.price * 100), l.qty, l.product.thumb);
  await d.prepare("DELETE FROM cart_items WHERE cart_id=? AND saved=0").run(cartId!);
  const text = `Hello ${user.name},\n\nThank you for your order. We'll send a confirmation when your items ship.\n\nOrder #${id}\nArriving: ${deliveryDate(fast ? 1 : 2)}\n\n${lines.map((l) => `${l.qty} x ${l.product.title} - ${money(l.product.price * l.qty)}`).join("\n")}\n\nOrder total: ${money(total)}\n\nView or manage your order: /gp/css/order-history`;
  void uid;
  await sendMail(user.email, `Your Amazon.com order #${id}`, text);
  return NextResponse.json({ ok: true, orderId: id });
}
