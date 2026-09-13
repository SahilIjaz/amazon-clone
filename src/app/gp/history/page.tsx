import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { product as getProduct, related } from "@/lib/products";
import { GridCard } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Your Browsing History" };
export const dynamic = "force-dynamic";

export default async function History() {
  const user = await currentUser(); if (!user) redirect("/ap/signin?returnTo=/gp/history");
  const rows = await (await db()).prepare("SELECT product_id FROM browsing_history WHERE user_id=? ORDER BY viewed_at DESC LIMIT 40").all<{ product_id: number }>(user.id);
  const items = rows.map((r) => getProduct(r.product_id)!).filter(Boolean);
  const recs = items.length ? related(items[0]!, 12) : [];
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-5">
      <h1 className="text-[28px] font-normal">Your Browsing History</h1>
      {items.length === 0 ? <p className="mt-3 text-[14px]">You have no recently viewed items. <Link href="/">Start browsing</Link>.</p> : <div className="mt-4 flex flex-wrap gap-4">{items.map((p) => <GridCard key={p.id} p={p} />)}</div>}
      {recs.length > 0 && <section className="mt-8 bg-white p-5"><h2 className="a-section-head">Recommended for you</h2><div className="mt-3 flex gap-4 overflow-x-auto pb-2">{recs.map((p) => <GridCard key={p.id} p={p} />)}</div></section>}
    </div>
  );
}
