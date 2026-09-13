import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { deals, discountPct, money, productUrl } from "@/lib/products";
import { Price } from "@/components/Price";

export const metadata: Metadata = { title: "Today's Deals" };
type SP = { d?: string; brand?: string; min?: string; prime?: string };

export default async function Deals({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = deals();
  const depts = Array.from(new Set(all.map((p) => p.department)));
  const brands = Array.from(new Set(all.map((p) => p.brand))).sort().slice(0, 14);
  const list = all.filter((p) => (!sp.d || p.department === sp.d) && (!sp.brand || p.brand === sp.brand) && (!sp.min || discountPct(p) >= Number(sp.min)) && (sp.prime !== "1" || p.prime));
  const href = (patch: Partial<SP>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, v); return `/deals?${u.toString()}`; };
  const Check = ({ on }: { on: boolean }) => <span className="mr-1 inline-block h-3.5 w-3.5 rounded-sm border border-[#888] bg-white text-center text-[10px] leading-[12px] align-middle">{on ? "✓" : ""}</span>;
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-4">
      <div className="flex items-center gap-4 border-b border-line pb-3"><h1 className="text-[28px] font-normal">Today&apos;s Deals</h1><span className="text-[12px] text-muted">{list.length} results</span></div>
      <div className="mt-4 flex gap-6">
        <aside className="hidden w-[240px] shrink-0 text-[14px] md:block">
          <h3 className="font-bold">Department</h3>
          <Link href={href({ d: undefined })} className={`block py-[2px] text-ink ${!sp.d ? "font-bold" : ""}`}>All Departments</Link>
          {depts.map((x) => <Link key={x} href={href({ d: sp.d === x ? undefined : x })} className={`block py-[2px] text-ink ${sp.d === x ? "font-bold" : "pl-2"}`}>{x}</Link>)}
          <h3 className="mt-4 font-bold">Brands</h3>
          {brands.map((b) => <Link key={b} href={href({ brand: sp.brand === b ? undefined : b })} className="block py-[2px] text-ink"><Check on={sp.brand === b} /> {b}</Link>)}
          <h3 className="mt-4 font-bold">Discount</h3>
          {[10, 20, 30, 50].map((m) => <Link key={m} href={href({ min: sp.min === String(m) ? undefined : String(m) })} className={`block py-[2px] text-ink ${sp.min === String(m) ? "font-bold" : ""}`}>{m}% Off or more</Link>)}
          <h3 className="mt-4 font-bold">Prime Programs</h3>
          <Link href={href({ prime: sp.prime === "1" ? undefined : "1" })} className="block py-[2px] text-ink"><Check on={sp.prime === "1"} /> <span className="prime-badge">prime</span> Exclusive deals</Link>
        </aside>
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <div key={p.id} className="a-box relative p-3 text-ink hover:shadow-md">
              <Link href={productUrl(p)} className="relative block h-[220px] bg-white"><Image src={p.thumb} alt={p.title} fill sizes="240px" className="object-contain" /></Link>
              <div className="mt-2 flex items-center gap-2"><span className="rounded-full bg-deal px-2 py-0.5 text-[12px] font-bold text-white">{discountPct(p)}% off</span><span className="text-[12px] font-bold text-deal">Limited time deal</span></div>
              <div className="mt-1 flex items-baseline gap-2"><Price value={p.price} size="md" /><span className="text-[12px] text-muted">Typical: <s>{money(p.listPrice!)}</s></span></div>
              <Link href={productUrl(p)} className="mt-1 block text-[14px] leading-5 text-ink truncate-2">{p.title}</Link>
              <div className="mt-2 flex items-center justify-between"><Link href={`/s?brand=${encodeURIComponent(p.brand)}&deals=1`} className="text-[13px]">Shop {p.brand} deals</Link><form action="/api/cart" method="post"><input type="hidden" name="productId" value={p.id} /><input type="hidden" name="redirect" value="/cart" /><button aria-label="Add to cart" className="grid h-9 w-9 place-items-center rounded-full border border-yellow-border bg-yellow shadow-sm hover:bg-yellow-hover"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4h3l2.5 12h11l2-8H7" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg></button></form></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
