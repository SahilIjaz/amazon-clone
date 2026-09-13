import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Stars from "@/components/Stars";
import { Price, PriceBlock } from "@/components/Price";
import { GridCard } from "@/components/ProductCard";
import Gallery from "@/components/Gallery";
import BuyBox from "@/components/BuyBox";
import { CATEGORY_LABEL, deliveryDate, discountPct, money, product, related } from "@/lib/products";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const { id } = await params; const p = product(id); return p ? { title: `${p.title} : ${p.department}`, description: p.description } : {}; }

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = product(id);
  if (!p) notFound();
  const user = await currentUser();
  const d = await db();
  if (user) await d.prepare("INSERT INTO browsing_history (user_id, product_id, viewed_at) VALUES (?,?,datetime('now')) ON CONFLICT(user_id, product_id) DO UPDATE SET viewed_at=datetime('now')").run(user.id, p.id);
  const userReviews = await d.prepare("SELECT r.*, u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY created_at DESC").all<{ id: string; rating: number; title: string; body: string; created_at: string; name: string }>(p.id);
  const inList = user ? !!(await d.prepare("SELECT 1 FROM list_items li JOIN lists l ON l.id=li.list_id WHERE l.user_id=? AND li.product_id=?").get(user.id, p.id)) : false;
  const allReviews = [...userReviews.map((r) => ({ name: r.name, rating: r.rating, title: r.title, comment: r.body, date: r.created_at.slice(0, 10), verified: true })), ...p.reviews.map((r) => ({ ...r, title: r.rating >= 4 ? "Great value" : r.rating >= 3 ? "Decent" : "Not what I expected", verified: true }))];
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, pct: allReviews.length ? Math.round((allReviews.filter((r) => Math.round(r.rating) === s).length / allReviews.length) * 100) : 0 }));
  const pct = discountPct(p);
  return (
    <div className="bg-white">
      <div className="px-5 pt-3 text-[12px] text-muted">
        <Link href={`/s?i=${encodeURIComponent(p.department)}`} className="text-muted hover:text-link-hover">{p.department}</Link> › <Link href={`/s?c=${p.category}`} className="text-muted hover:text-link-hover">{CATEGORY_LABEL[p.category] || p.category}</Link> › <span>{p.brand}</span>
      </div>
      <div className="grid gap-6 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_300px]">
        <Gallery images={p.images.length ? p.images : [p.thumb]} title={p.title} />
        <div className="min-w-0">
          <h1 className="text-[24px] font-normal leading-8 text-ink">{p.title}</h1>
          <Link href={`/s?brand=${encodeURIComponent(p.brand)}`} className="text-[14px]">Visit the {p.brand} Store</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[14px]">
            <span>{p.rating.toFixed(1)}</span><Stars rating={p.rating} /><span className="nav-caret !border-t-[#555]" /><a href="#reviews" className="text-link">{(p.reviewCount + userReviews.length).toLocaleString()} ratings</a>
            <span className="text-muted">|</span><span>{Math.max(50, Math.round(p.reviewCount / 7)).toLocaleString()}+ bought in past month</span>
          </div>
          {p.reviewCount > 2000 && <div className="mt-1"><span className="inline-block rounded-sm bg-[#c45500] px-1.5 py-0.5 text-[12px] font-bold text-white">#1 Best Seller</span> <span className="text-[12px] text-muted">in {CATEGORY_LABEL[p.category] || p.category}</span></div>}
          <div className="a-divider my-3" />
          <div className="flex items-baseline gap-3">
            {pct > 0 && <span className="text-[28px] font-light text-deal">-{pct}%</span>}
            <Price value={p.price} size="lg" />
          </div>
          {p.listPrice && <div className="text-[12px] text-muted">List Price: <s>{money(p.listPrice)}</s></div>}
          <div className="mt-1 text-[14px]">{p.prime ? <><span className="prime-badge">prime</span> <span className="text-muted">One-Day</span></> : <span className="text-muted">FREE Returns</span>}</div>
          <div className="a-divider my-3" />
          <table className="text-[14px]"><tbody>
            <tr><td className="pr-6 font-bold">Brand</td><td>{p.brand}</td></tr>
            {p.dimensions && <tr><td className="pr-6 font-bold">Product Dimensions</td><td>{p.dimensions.width} x {p.dimensions.depth} x {p.dimensions.height} inches</td></tr>}
            {p.sku && <tr><td className="pr-6 font-bold">Item model number</td><td>{p.sku}</td></tr>}
            <tr><td className="pr-6 font-bold">Category</td><td>{CATEGORY_LABEL[p.category] || p.category}</td></tr>
          </tbody></table>
          <div className="a-divider my-3" />
          <h2 className="text-[16px] font-bold">About this item</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px]">
            <li>{p.description}</li>
            {p.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <BuyBox p={p} signedIn={!!user} inList={inList} />
      </div>

      <section className="px-5 py-6"><h2 className="a-section-head">Products related to this item</h2><div className="mt-3 flex gap-4 overflow-x-auto pb-2">{related(p, 10).map((r) => <GridCard key={r.id} p={r} />)}</div></section>

      <section id="reviews" className="grid gap-10 px-5 py-6 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="text-[24px] font-bold">Customer reviews</h2>
          <div className="mt-1 flex items-center gap-2"><Stars rating={p.rating} /><span className="text-[18px]">{p.rating.toFixed(1)} out of 5</span></div>
          <p className="text-[14px] text-muted">{(p.reviewCount + userReviews.length).toLocaleString()} global ratings</p>
          <div className="mt-3 space-y-1.5">{dist.map(({ s, pct }) => <div key={s} className="flex items-center gap-2 text-[14px] text-link"><span className="w-12">{s} star</span><span className="h-5 flex-1 rounded-sm border border-[#ccc] bg-[#f0f2f2]"><span className="block h-full rounded-sm bg-star" style={{ width: `${pct}%` }} /></span><span className="w-9 text-right">{pct}%</span></div>)}</div>
          <div className="a-divider my-4" />
          <h3 className="text-[16px] font-bold">Review this product</h3>
          <p className="text-[14px]">Share your thoughts with other customers</p>
          <Link href={user ? `/review/create/${p.id}` : `/ap/signin?returnTo=/review/create/${p.id}`} className="a-button a-button-base a-button-block mt-2">Write a customer review</Link>
        </div>
        <div>
          <h3 className="text-[16px] font-bold">Top reviews from the United States</h3>
          <div className="mt-4 space-y-6">
            {allReviews.slice(0, 8).map((r, i) => (
              <article key={i} className="text-[14px]">
                <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e3e6e6] text-[12px]">👤</span><span>{r.name}</span></div>
                <div className="mt-1 flex items-center gap-2"><Stars rating={r.rating} small /><b>{r.title}</b></div>
                <p className="text-[12px] text-muted">Reviewed in the United States on {new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                {r.verified && <p className="text-[12px] font-bold text-[#c45500]">Verified Purchase</p>}
                <p className="mt-1">{r.comment}</p>
                <p className="mt-2 text-[12px] text-muted"><button className="a-button a-button-base h-[28px] px-3 text-[12px]">Helpful</button> <span className="ml-2">Report</span></p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
