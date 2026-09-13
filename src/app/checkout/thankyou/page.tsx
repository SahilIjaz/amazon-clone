import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, topRated } from "@/lib/products";
import { GridCard } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Thanks for your order" };
export const dynamic = "force-dynamic";

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await currentUser(); if (!user) redirect("/ap/signin");
  const { order } = await searchParams;
  const o = await (await db()).prepare("SELECT * FROM orders WHERE id=? AND user_id=?").get<{ id: string; total_cents: number; delivery_date: string; address_json: string }>(order || "", user.id);
  if (!o) redirect("/gp/css/order-history");
  const a = JSON.parse(o.address_json) as { full_name: string; city: string; state: string };
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-6">
      <div className="a-box p-5">
        <h1 className="text-[24px] font-bold text-success">✓ Order placed, thank you!</h1>
        <p className="mt-1 text-[14px]">Confirmation will be sent to your email.</p>
        <p className="mt-3 text-[14px]"><b>Shipping to {a.full_name}</b>, {a.city}, {a.state}</p>
        <p className="mt-3 text-[16px]"><b>Arriving {new Date(o.delivery_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</b></p>
        <p className="text-[14px]">Order total: <b>{money(o.total_cents / 100)}</b> · Order #{o.id}</p>
        <div className="mt-4 flex gap-3"><Link href="/gp/css/order-history" className="a-button a-button-base a-button-pill hover:no-underline">Review or edit your recent orders</Link><Link href="/" className="a-button a-button-primary a-button-pill hover:no-underline">Continue shopping</Link></div>
      </div>
      <section className="mt-5 bg-white p-5"><h2 className="a-section-head">Customers who bought this also bought</h2><div className="mt-3 flex gap-4 overflow-x-auto pb-2">{topRated(10).map((p) => <GridCard key={p.id} p={p} />)}</div></section>
    </div>
  );
}
