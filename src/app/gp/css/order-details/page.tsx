import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/products";

export const metadata: Metadata = { title: "Order Details" };
export const dynamic = "force-dynamic";

export default async function OrderDetails({ searchParams }: { searchParams: Promise<{ orderID?: string }> }) {
  const user = await currentUser(); if (!user) redirect("/ap/signin");
  const { orderID } = await searchParams;
  const d = await db();
  const o = await d.prepare("SELECT * FROM orders WHERE id=? AND user_id=?").get<{ id: string; subtotal_cents: number; shipping_cents: number; tax_cents: number; total_cents: number; delivery_date: string; address_json: string; payment_json: string; created_at: string }>(orderID || "", user.id);
  if (!o) redirect("/gp/css/order-history");
  const items = await d.prepare("SELECT * FROM order_items WHERE order_id=?").all<{ product_id: number; title: string; price_cents: number; qty: number; thumb: string }>(o.id);
  const a = JSON.parse(o.address_json) as Record<string, string>; const c = JSON.parse(o.payment_json) as Record<string, string>;
  return (
    <div className="mx-auto max-w-[920px] px-5 py-5 text-[14px]">
      <p className="text-[12px]"><Link href="/your-account">Your Account</Link> › <Link href="/gp/css/order-history">Your Orders</Link> › <span className="text-danger">Order Details</span></p>
      <h1 className="text-[28px] font-normal">Order Details</h1>
      <p className="text-muted">Ordered on {new Date(o.created_at + "Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Order# {o.id}</p>
      <div className="a-box mt-3 grid gap-6 p-5 md:grid-cols-3">
        <div><h2 className="font-bold">Shipping Address</h2><p>{a.full_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.zip}<br />{a.country}</p></div>
        <div><h2 className="font-bold">Payment Methods</h2><p>{c.brand} ending in {c.last4}</p></div>
        <div><h2 className="font-bold">Order Summary</h2><dl className="space-y-0.5"><div className="flex justify-between"><dt>Item(s) Subtotal:</dt><dd>{money(o.subtotal_cents / 100)}</dd></div><div className="flex justify-between"><dt>Shipping & Handling:</dt><dd>{money(o.shipping_cents / 100)}</dd></div><div className="flex justify-between"><dt>Estimated tax:</dt><dd>{money(o.tax_cents / 100)}</dd></div><div className="flex justify-between font-bold"><dt>Grand Total:</dt><dd>{money(o.total_cents / 100)}</dd></div></dl></div>
      </div>
      <div className="a-box mt-4 p-5">
        <h2 className="text-[18px] font-bold">Arriving {new Date(o.delivery_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
        <div className="mt-3 space-y-3">{items.map((i) => <div key={i.product_id} className="flex gap-3"><div className="relative h-[90px] w-[90px] shrink-0"><Image src={i.thumb} alt="" fill sizes="90px" className="object-contain" /></div><div><Link href={`/dp/${i.product_id}`}>{i.title}</Link><p className="text-[12px] text-muted">Qty: {i.qty}</p><p className="font-bold text-danger">{money(i.price_cents / 100)}</p></div></div>)}</div>
        <Link href="/gp/css/order-history" className="a-button a-button-base a-button-pill mt-4 hover:no-underline">Back to your orders</Link>
      </div>
    </div>
  );
}
