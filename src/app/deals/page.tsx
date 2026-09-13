import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { deals, discountPct, money, productUrl } from "@/lib/products";
import { Price } from "@/components/Price";

export const metadata: Metadata = { title: "Today's Deals" };

export default async function Deals({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const all = deals();
  const depts = Array.from(new Set(all.map((p) => p.department)));
  const list = d ? all.filter((p) => p.department === d) : all;
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-5">
      <h1 className="text-[28px] font-normal">Today&apos;s Deals</h1>
      <p className="text-[14px] text-muted">Limited-time deals across the store. Prices and availability may change.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[13px]"><Link href="/deals" className={`rounded-full border px-3 py-1 hover:no-underline ${!d ? "border-ink bg-ink text-white" : "border-line text-ink"}`}>All deals</Link>{depts.map((x) => <Link key={x} href={`/deals?d=${encodeURIComponent(x)}`} className={`rounded-full border px-3 py-1 hover:no-underline ${d === x ? "border-ink bg-ink text-white" : "border-line text-ink"}`}>{x}</Link>)}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p) => (
          <Link key={p.id} href={productUrl(p)} className="a-box block p-3 text-ink hover:no-underline hover:shadow-md">
            <div className="relative h-[200px] bg-white"><Image src={p.thumb} alt={p.title} fill sizes="240px" className="object-contain" /></div>
            <div className="mt-2 flex items-center gap-2"><span className="deal-badge">{discountPct(p)}% off</span><span className="text-[12px] font-bold text-deal">Limited time deal</span></div>
            <div className="mt-1 flex items-baseline gap-2"><Price value={p.price} size="md" /><span className="text-[12px] text-muted">List: <s>{money(p.listPrice!)}</s></span></div>
            <p className="mt-1 text-[14px] leading-5 truncate-2">{p.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
