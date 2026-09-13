import type { Metadata } from "next";
import { Suspense } from "react";
import SortSelect from "@/components/SortSelect";
import Link from "next/link";
import { ResultCard } from "@/components/ProductCard";
import Stars from "@/components/Stars";
import { CATALOG_DEPARTMENTS, CATEGORY_LABEL, search, related, topRated, type SortKey } from "@/lib/products";

type SP = Record<string, string | undefined>;
export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> { const sp = await searchParams; return { title: sp.k ? `${sp.k}` : sp.i ? sp.i : "Search" }; }


function href(sp: SP, patch: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v && k !== "added" && k !== "page") u.set(k, v);
  if (patch.page) u.set("page", patch.page);
  return `/s?${u.toString()}`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.k || "";
  const res = search({ q, dept: sp.i, category: sp.c, sort: (sp.sort as SortKey) || "featured", minRating: sp.rating ? Number(sp.rating) : undefined, prime: sp.prime === "1", priceMin: sp.priceMin ? Number(sp.priceMin) : undefined, priceMax: sp.priceMax ? Number(sp.priceMax) : undefined, brand: sp.brand, page: sp.page ? Number(sp.page) : 1, deals: sp.deals === "1" });
  const from = (res.page - 1) * 16 + 1, to = Math.min(res.total, res.page * 16);
  const seen = new Set(res.items.map((p) => p.id));
  const more = res.total > 0 && res.total < 8 && res.page === 1 ? [...related(res.items[0]!, 16), ...topRated(16)].filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 12) : [];
  const label = q ? `"${q}"` : sp.i || sp.c ? (sp.c ? CATEGORY_LABEL[sp.c] || sp.c : sp.i) : "all products";
  const Filter = ({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) => <Link href={to} className={`block py-[2px] text-[14px] text-ink hover:text-link-hover ${active ? "font-bold" : ""}`}>{children}</Link>;
  return (
    <div className="bg-white">
      {sp.added && <div className="border-b border-line bg-[#f0f8f0] px-6 py-3 text-[14px]"><span className="font-bold text-success">✓ Added to Cart</span> <Link href="/cart" className="ml-4 a-button a-button-primary a-button-pill h-[29px] text-[13px]">Go to Cart</Link></div>}
      <div className="flex items-center justify-between border-b border-[#ddd] px-5 py-[11px] shadow-[0_1px_2px_rgba(0,0,0,.06)]">
        <span className="text-[14px]">{res.total ? `${from}-${to} of ${res.total} results for ` : "No results for "}<span className="font-bold text-danger">{label}</span></span>
        <Suspense><SortSelect /></Suspense>
      </div>
      <div className="flex gap-4 px-5 py-4">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <div className="text-[14px]">
            <h3 className="mb-1 font-bold">Delivery Day</h3>
            <Filter active={sp.prime === "1"} to={href(sp, { prime: sp.prime === "1" ? undefined : "1" })}><span className="mr-1 inline-block h-3.5 w-3.5 rounded-sm border border-[#888] align-middle bg-white text-center text-[10px] leading-[12px]">{sp.prime === "1" ? "✓" : ""}</span> Get It by Tomorrow</Filter>
            <h3 className="mb-1 mt-4 font-bold">Department</h3>
            <Filter active={!sp.i && !sp.c} to={href(sp, { i: undefined, c: undefined })}>Any Department</Filter>
            {CATALOG_DEPARTMENTS.map((d) => <Filter key={d.name} active={sp.i === d.name} to={href(sp, { i: d.name, c: undefined })}><span className={sp.i === d.name ? "" : "pl-2"}>{d.name}</span></Filter>)}
            {res.categories.length > 1 && <><h3 className="mb-1 mt-4 font-bold">Category</h3>{res.categories.slice(0, 10).map(([c, n]) => <Filter key={c} active={sp.c === c} to={href(sp, { c: sp.c === c ? undefined : c })}>{CATEGORY_LABEL[c] || c} <span className="text-muted">({n})</span></Filter>)}</>}
            <h3 className="mb-1 mt-4 font-bold">Customer Reviews</h3>
            {[4, 3, 2, 1].map((r) => <Filter key={r} active={sp.rating === String(r)} to={href(sp, { rating: sp.rating === String(r) ? undefined : String(r) })}><span className="inline-flex items-center gap-1"><Stars rating={r} small /> & Up</span></Filter>)}
            <h3 className="mb-1 mt-4 font-bold">Price</h3>
            {[["Under $25", undefined, "25"], ["$25 to $50", "25", "50"], ["$50 to $100", "50", "100"], ["$100 to $200", "100", "200"], ["$200 & Above", "200", undefined]].map(([l, a, b]) => <Filter key={l} active={sp.priceMin === a && sp.priceMax === b} to={href(sp, { priceMin: a, priceMax: b })}>{l}</Filter>)}
            <form className="mt-2 flex items-center gap-1" action="/s">{Object.entries(sp).filter(([k]) => !["priceMin", "priceMax", "added", "page"].includes(k)).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}<input name="priceMin" placeholder="$ Min" defaultValue={sp.priceMin} className="a-input w-[64px]" /><input name="priceMax" placeholder="$ Max" defaultValue={sp.priceMax} className="a-input w-[64px]" /><button className="a-button a-button-base h-[29px] px-3">Go</button></form>
            <h3 className="mb-1 mt-4 font-bold">Deals & Discounts</h3>
            <Filter active={sp.deals === "1"} to={href(sp, { deals: sp.deals === "1" ? undefined : "1" })}>All Discounts</Filter>
            {res.brands.length > 1 && <><h3 className="mb-1 mt-4 font-bold">Brands</h3>{res.brands.map((b) => <Filter key={b} active={sp.brand === b} to={href(sp, { brand: sp.brand === b ? undefined : b })}><span className="mr-1 inline-block h-3.5 w-3.5 rounded-sm border border-[#888] align-middle bg-white text-center text-[10px] leading-[12px]">{sp.brand === b ? "✓" : ""}</span> {b}</Filter>)}</>}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {res.total === 0 ? (
            <div className="py-10 text-[16px]">
              <p>No results for <b>{label}</b>.</p>
              <p className="mt-2 text-[14px] text-muted">Try checking your spelling or use more general terms.</p>
              <p className="mt-4 text-[14px]">Need help? <Link href="/gp/help/customer/display.html">Visit the help section</Link> or <Link href="/gp/help/customer/display.html">contact us</Link>.</p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-[16px] font-bold">Results</h2>
              <p className="mb-3 text-[13px] text-muted">Check each product page for other buying options.</p>
              <div className="space-y-3">{res.items.map((p) => <ResultCard key={p.id} p={p} q={q} />)}</div>
              {more.length > 0 && <><h2 className="mb-2 mt-6 text-[16px] font-bold">More results</h2><p className="mb-3 text-[13px] text-muted">Related items customers also viewed.</p><div className="space-y-3">{more.map((p) => <ResultCard key={p.id} p={p} q={q} />)}</div></>}
              {res.pages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-1 text-[14px]" aria-label="Pagination">
                  <Link href={href(sp, { page: String(Math.max(1, res.page - 1)) })} className={`rounded-l-lg border border-line px-4 py-2 text-ink hover:bg-[#f7fafa] hover:no-underline ${res.page === 1 ? "pointer-events-none text-muted" : ""}`}>‹ Previous</Link>
                  {Array.from({ length: res.pages }).map((_, i) => <Link key={i} href={href(sp, { page: String(i + 1) })} className={`border border-line px-3 py-2 hover:no-underline ${res.page === i + 1 ? "border-ink bg-white font-bold text-ink" : "text-ink hover:bg-[#f7fafa]"}`}>{i + 1}</Link>)}
                  <Link href={href(sp, { page: String(Math.min(res.pages, res.page + 1)) })} className={`rounded-r-lg border border-line px-4 py-2 text-ink hover:bg-[#f7fafa] hover:no-underline ${res.page === res.pages ? "pointer-events-none text-muted" : ""}`}>Next ›</Link>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
