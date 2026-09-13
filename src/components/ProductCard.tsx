import Image from "next/image";
import Link from "next/link";
import Stars from "./Stars";
import { PriceBlock } from "./Price";
import { deliveryDate, productUrl, type Product } from "@/lib/products";

/** Grid card used on category rows, related items and the deals page. */
export function GridCard({ p, compact = false, eager = false }: { p: Product; compact?: boolean; eager?: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? "w-[150px]" : "w-[200px]"} shrink-0`}>
      <Link href={productUrl(p)} className="block bg-white rounded-sm p-2">
        <div className={`relative ${compact ? "h-[150px]" : "h-[200px]"}`}><Image src={p.thumb} alt={p.title} fill sizes="200px" loading={eager ? "eager" : "lazy"} className="object-contain" /></div>
      </Link>
      <Link href={productUrl(p)} className="mt-2 text-[14px] leading-5 text-ink truncate-2 hover:text-link-hover hover:underline">{p.title}</Link>
      <div className="mt-1 flex items-center gap-1"><Stars rating={p.rating} small /><span className="text-[12px] text-link">{p.reviewCount.toLocaleString()}</span></div>
      <div className="mt-1"><PriceBlock p={p} size="sm" /></div>
      {p.prime && <span className="prime-badge mt-0.5">prime</span>}
    </div>
  );
}

/** Search-results row, matching Amazon's list layout. */
export function ResultCard({ p, q }: { p: Product; q?: string }) {
  const url = productUrl(p);
  return (
    <div className="s-result flex gap-4 p-4">
      <Link href={url} className="relative block h-[280px] w-[280px] shrink-0 rounded-md bg-white"><Image src={p.thumb} alt={p.title} fill sizes="280px" className="object-contain p-3" /></Link>
      <div className="min-w-0 flex-1">
        {p.listPrice && <span className="mb-1 inline-block rounded-sm bg-nav px-1.5 py-0.5 text-[12px] font-bold text-white">Limited time deal</span>}
        <Link href={url} className="block"><h2 className="truncate-2">{p.title}</h2></Link>
        <div className="mt-0.5 flex items-center gap-1.5 text-[14px]">
          <span className="text-ink">{p.rating.toFixed(1)}</span><Stars rating={p.rating} small /><span className="text-link">({p.reviewCount.toLocaleString()})</span>
        </div>
        <div className="text-[12px] text-muted">{Math.max(50, Math.round(p.reviewCount / 7)).toLocaleString()}+ bought in past month</div>
        <div className="mt-2"><PriceBlock p={p} size="lg" showDeal={false} /></div>
        {p.listPrice && <div className="text-[12px] text-muted">Typical: <s>${p.listPrice.toFixed(2)}</s></div>}
        <div className="mt-1.5 text-[14px]">
          {p.prime ? <><span className="prime-badge">prime</span><span className="ml-2 text-muted">FREE delivery</span> <b className="text-ink">{deliveryDate(2)}</b></> : <><span className="text-muted">$6.99 delivery</span> <b className="text-ink">{deliveryDate(5)}</b></>}
        </div>
        {p.stock < 10 && <div className="mt-1 text-[14px] text-danger">Only {p.stock} left in stock - order soon.</div>}
        <form action="/api/cart" method="post" className="mt-3">
          <input type="hidden" name="productId" value={p.id} /><input type="hidden" name="redirect" value={`/s?k=${encodeURIComponent(q || "")}&added=${p.id}`} />
          <button className="a-button a-button-primary a-button-pill h-[31px] text-[13px]">Add to cart</button>
        </form>
      </div>
    </div>
  );
}
