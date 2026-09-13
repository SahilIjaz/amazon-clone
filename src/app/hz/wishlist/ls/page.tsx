import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { product as getProduct, productUrl } from "@/lib/products";
import { Price } from "@/components/Price";
import Stars from "@/components/Stars";
import ListControls from "@/components/ListControls";

export const metadata: Metadata = { title: "Your Lists" };
export const dynamic = "force-dynamic";

export default async function Lists({ searchParams }: { searchParams: Promise<{ list?: string; new?: string }> }) {
  const user = await currentUser(); if (!user) redirect("/ap/signin?returnTo=/hz/wishlist/ls");
  const sp = await searchParams;
  const d = await db();
  let lists = await d.prepare("SELECT id, name, is_default FROM lists WHERE user_id=? ORDER BY is_default DESC, created_at").all<{ id: string; name: string; is_default: number }>(user.id);
  if (!lists.length) { await d.prepare("INSERT INTO lists (id,user_id,name,is_default) VALUES (?,?,?,1)").run(crypto.randomUUID(), user.id, "Shopping List"); lists = await d.prepare("SELECT id, name, is_default FROM lists WHERE user_id=?").all(user.id); }
  const current = lists.find((l) => l.id === sp.list) || lists[0]!;
  const items = (await d.prepare("SELECT product_id, added_at FROM list_items WHERE list_id=? ORDER BY added_at DESC").all<{ product_id: number; added_at: string }>(current.id)).map((r) => ({ p: getProduct(r.product_id)!, added: r.added_at })).filter((x) => x.p);
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-5 text-[14px]">
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside>
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-bold">Your Lists</h2><ListControls mode="create" open={sp.new === "1"} /></div>
          <ul className="mt-2 space-y-1">{lists.map((l) => <li key={l.id}><Link href={`/hz/wishlist/ls?list=${l.id}`} className={`block rounded-md px-3 py-2 hover:bg-[#f0f2f2] hover:no-underline ${l.id === current.id ? "bg-[#e3e6e6] font-bold text-ink" : "text-ink"}`}>{l.name}<span className="block text-[12px] font-normal text-muted">{l.is_default ? "Default · Private" : "Private"}</span></Link></li>)}</ul>
        </aside>
        <section>
          <div className="flex items-center justify-between"><div><h1 className="text-[28px] font-normal">{current.name}</h1><p className="text-[12px] text-muted">Private · {items.length} {items.length === 1 ? "item" : "items"}</p></div>{!current.is_default && <ListControls mode="delete" listId={current.id} />}</div>
          <div className="mt-4 divide-y divide-line-soft border-y border-line-soft">
            {items.length === 0 && <p className="py-10 text-center text-[16px]">This list is empty. <Link href="/">Add items from any product page</Link>.</p>}
            {items.map(({ p, added }) => (
              <div key={p.id} className="grid grid-cols-[180px_1fr_200px] gap-4 py-4">
                <Link href={productUrl(p)} className="relative block h-[180px]"><Image src={p.thumb} alt={p.title} fill sizes="180px" className="object-contain" /></Link>
                <div><Link href={productUrl(p)} className="text-[16px] text-ink truncate-2">{p.title}</Link><div className="mt-1 flex items-center gap-1"><Stars rating={p.rating} small /><span className="text-[12px] text-link">{p.reviewCount.toLocaleString()}</span></div><div className="mt-1"><Price value={p.price} size="md" /></div><p className="text-[12px] text-muted">Item added {new Date(added + "Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
                <div className="space-y-2"><form action="/api/cart" method="post"><input type="hidden" name="productId" value={p.id} /><input type="hidden" name="redirect" value="/cart" /><button className="a-button a-button-primary a-button-pill a-button-block">Add to Cart</button></form><ListControls mode="remove" listId={current.id} productId={p.id} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
