import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, productUrl, product as getProduct } from "@/lib/products";

export const metadata: Metadata = { title: "Your Orders" };
export const dynamic = "force-dynamic";

type Order = { id: string; status: string; total_cents: number; delivery_date: string; address_json: string; created_at: string };
type Item = { order_id: string; product_id: number; title: string; price_cents: number; qty: number; thumb: string };

export default async function Orders({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await currentUser(); if (!user) redirect("/ap/signin?returnTo=/gp/css/order-history");
  const { tab = "orders" } = await searchParams;
  const d = await db();
  const orders = await d.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC").all<Order>(user.id);
  const items = await d.prepare("SELECT oi.* FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=?").all<Item>(user.id);
  const status = (o: Order) => { const days = (Date.now() - new Date(o.created_at + "Z").getTime()) / 864e5; const eta = new Date(o.delivery_date); return days > 3 ? { label: `Delivered ${eta.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`, done: true } : days > 1 ? { label: `Shipped · Arriving ${eta.toLocaleDateString("en-US", { weekday: "long" })}`, done: false } : { label: `Order placed · Arriving ${eta.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`, done: false }; };
  const Tab = ({ id, label }: { id: string; label: string }) => <Link href={`/gp/css/order-history?tab=${id}`} className={`border-b-[3px] px-1 pb-2 text-[14px] hover:no-underline ${tab === id ? "border-[#e47911] font-bold text-ink" : "border-transparent text-link"}`}>{label}</Link>;
  const shown = tab === "buy-again" ? [] : orders;
  const again = Array.from(new Map(items.map((i) => [i.product_id, i])).values());
  return (
    <div className="mx-auto max-w-[920px] px-5 py-5">
      <p className="text-[12px]"><Link href="/your-account">Your Account</Link> › <span className="text-danger">Your Orders</span></p>
      <div className="flex items-center justify-between"><h1 className="text-[28px] font-normal">Your Orders</h1><form action="/gp/css/order-history" className="hidden gap-2 sm:flex"><input name="q" placeholder="Search all orders" className="a-input w-[260px]" /><button className="a-button a-button-base a-button-pill h-[31px]">Search Orders</button></form></div>
      <div className="mt-2 flex gap-5 border-b border-line"><Tab id="orders" label="Orders" /><Tab id="buy-again" label="Buy Again" /><Tab id="not-shipped" label="Not Yet Shipped" /><Tab id="cancelled" label="Cancelled Orders" /></div>
      {tab === "buy-again" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3 md:grid-cols-4">{again.length === 0 ? <p className="text-[14px]">Items you buy will show up here so you can order them again.</p> : again.map((i) => { const p = getProduct(i.product_id); return <div key={i.product_id} className="a-box p-3 text-[13px]"><div className="relative h-[140px]"><Image src={i.thumb} alt="" fill sizes="160px" className="object-contain" /></div><Link href={p ? productUrl(p) : "#"} className="mt-2 block truncate-2 text-ink">{i.title}</Link><p className="font-bold">{money(i.price_cents / 100)}</p><form action="/api/cart" method="post"><input type="hidden" name="productId" value={i.product_id} /><input type="hidden" name="redirect" value="/cart" /><button className="a-button a-button-primary a-button-pill mt-2 h-[29px] text-[12px]">Buy it again</button></form></div>; })}</div>
      ) : (
        <>
          <p className="mt-3 text-[14px]"><b>{shown.length} orders</b> placed in <span className="a-select inline-block py-1">past 3 months</span></p>
          {shown.length === 0 && <div className="a-box mt-4 p-6 text-[14px]">Looks like you haven&apos;t placed an order in the last 3 months. <Link href="/">Start shopping</Link>.</div>}
          <div className="mt-4 space-y-4">
            {shown.filter((o) => tab !== "not-shipped" || !status(o).done).filter((o) => tab !== "cancelled" || o.status === "cancelled").map((o) => { const st = status(o); const a = JSON.parse(o.address_json) as { full_name: string }; const its = items.filter((i) => i.order_id === o.id); return (
              <article key={o.id} className="a-box overflow-hidden text-[14px]">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f0f2f2] px-5 py-3 text-[12px] text-muted">
                  <div className="flex gap-8"><div><p className="uppercase">Order placed</p><p className="text-ink">{new Date(o.created_at + "Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div><div><p className="uppercase">Total</p><p className="text-ink">{money(o.total_cents / 100)}</p></div><div><p className="uppercase">Ship to</p><p className="text-link">{a.full_name} ▾</p></div></div>
                  <div className="text-right"><p>ORDER # {o.id}</p><p><Link href={`/gp/css/order-details?orderID=${o.id}`}>View order details</Link> | <Link href={`/gp/css/order-details?orderID=${o.id}`}>View invoice</Link></p></div>
                </div>
                <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_220px]">
                  <div>
                    <h2 className="text-[18px] font-bold">{st.label}</h2>
                    <p className="text-[12px] text-muted">{st.done ? "Package was handed to resident" : "Your package is on its way"}</p>
                    <div className="mt-3 space-y-3">{its.map((i) => { const p = getProduct(i.product_id); return <div key={i.product_id} className="flex gap-3"><div className="relative h-[90px] w-[90px] shrink-0"><Image src={i.thumb} alt="" fill sizes="90px" className="object-contain" /></div><div><Link href={p ? productUrl(p) : "#"} className="truncate-2">{i.title}</Link><p className="text-[12px] text-muted">Qty: {i.qty} · {money(i.price_cents / 100)}</p><div className="mt-1 flex gap-2"><form action="/api/cart" method="post"><input type="hidden" name="productId" value={i.product_id} /><input type="hidden" name="redirect" value="/cart" /><button className="a-button a-button-primary a-button-pill h-[29px] text-[12px]">Buy it again</button></form><Link href={p ? productUrl(p) : "#"} className="a-button a-button-base a-button-pill h-[29px] text-[12px] hover:no-underline">View your item</Link></div></div></div>; })}</div>
                  </div>
                  <div className="space-y-2">{["Track package", "Return or replace items", "Share gift receipt", "Leave seller feedback", "Write a product review", "Archive order"].map((l) => <Link key={l} href={l === "Write a product review" ? `/review/create/${its[0]?.product_id}` : `/gp/css/order-details?orderID=${o.id}`} className="a-button a-button-base a-button-pill a-button-block h-[31px] text-[13px] hover:no-underline">{l}</Link>)}</div>
                </div>
              </article>
            ); })}
          </div>
        </>
      )}
    </div>
  );
}
