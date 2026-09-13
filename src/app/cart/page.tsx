import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { cartLines, currentCartId, subtotal } from "@/lib/cart";
import { money, productUrl, topRated } from "@/lib/products";
import { GridCard } from "@/components/ProductCard";
import CartLineControls from "@/components/CartLineControls";
import { Price } from "@/components/Price";

export const metadata: Metadata = { title: "Amazon.com Shopping Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await currentUser();
  const lines = await cartLines(await currentCartId(user));
  const active = lines.filter((l) => !l.saved), saved = lines.filter((l) => l.saved);
  const count = active.reduce((s, l) => s + l.qty, 0);
  const sub = subtotal(lines);
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="bg-white p-5">
            {active.length === 0 ? (
              <div className="flex items-center gap-6">
                <svg width="240" height="180" viewBox="0 0 240 180" aria-hidden="true"><rect x="0" y="0" width="240" height="180" rx="12" fill="#f0f2f2" /><rect x="30" y="60" width="86" height="64" rx="8" fill="#d5dbdb" /><rect x="38" y="68" width="70" height="46" rx="4" fill="#fff" /><path d="M140 70h44a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8h-44z" fill="#f2b8a2" /><path d="M192 84h10a8 8 0 0 1 0 16h-10" fill="none" stroke="#f2b8a2" strokeWidth="6" /><rect x="134" y="116" width="66" height="8" rx="4" fill="#c7cbcb" /><path d="M60 40c0-10 30-14 44-8" stroke="#7f8a8a" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="150" cy="40" r="14" fill="#febd69" /></svg>
                <div>
                  <h1 className="text-[24px] font-bold">Your Amazon Cart is empty</h1>
                  <p className="mt-1 text-[14px]"><Link href="/deals">Shop today&apos;s deals</Link></p>
                  {!user && <div className="mt-4 flex gap-2"><Link href="/ap/signin?returnTo=/cart" className="a-button a-button-primary a-button-pill hover:no-underline">Sign in to your account</Link><Link href="/ap/register" className="a-button a-button-base a-button-pill hover:no-underline">Sign up now</Link></div>}
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-[28px] font-normal">Shopping Cart</h1>
                <p className="text-right text-[14px] text-muted">Price</p>
                <div className="a-divider" />
                {active.map((l) => (
                  <div key={l.product.id} className="grid grid-cols-[180px_1fr_auto] gap-4 border-b border-line-soft py-4">
                    <Link href={productUrl(l.product)} className="relative block h-[180px] bg-white"><Image src={l.product.thumb} alt={l.product.title} fill sizes="180px" className="object-contain" /></Link>
                    <div className="min-w-0">
                      <Link href={productUrl(l.product)} className="text-[18px] leading-6 text-ink hover:text-link-hover truncate-2">{l.product.title}</Link>
                      <p className={`text-[12px] ${l.product.stock > 0 ? "text-success" : "text-danger"}`}>{l.product.stock > 0 ? "In Stock" : "Out of stock"}</p>
                      {l.product.prime && <p className="text-[12px]"><span className="prime-badge">prime</span> <span className="text-muted">FREE delivery</span></p>}
                      <p className="text-[12px] text-muted">Eligible for Return, Refund or Replacement within 30 days of receipt</p>
                      <p className="text-[12px]"><span className="text-muted">Gift options not available.</span> <Link href="/gp/help/customer/display.html">Learn more</Link></p>
                      <CartLineControls productId={l.product.id} qty={l.qty} max={Math.min(10, Math.max(1, l.product.stock))} />
                    </div>
                    <div className="text-right"><Price value={l.product.price * l.qty} size="md" /></div>
                  </div>
                ))}
                <p className="mt-3 text-right text-[18px]">Subtotal ({count} {count === 1 ? "item" : "items"}): <b>{money(sub)}</b></p>
              </>
            )}
          </section>
          {saved.length > 0 && (
            <section className="bg-white p-5">
              <h2 className="text-[21px] font-normal">Saved for later ({saved.length} {saved.length === 1 ? "item" : "items"})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((l) => <div key={l.product.id} className="a-box p-3"><Link href={productUrl(l.product)} className="relative block h-[160px] bg-white"><Image src={l.product.thumb} alt={l.product.title} fill sizes="200px" className="object-contain" /></Link><Link href={productUrl(l.product)} className="mt-2 block text-[14px] text-ink truncate-2">{l.product.title}</Link><div className="mt-1"><Price value={l.product.price} size="sm" /></div><CartLineControls productId={l.product.id} qty={l.qty} max={10} saved /></div>)}
              </div>
            </section>
          )}
          <section className="bg-white p-5">
            <h2 className="a-section-head">Customers who bought items in your cart also bought</h2>
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2">{topRated(10).map((p) => <GridCard key={p.id} p={p} />)}</div>
          </section>
        </div>
        <aside className="space-y-4">
          <div className="bg-white p-5 text-[14px]">
            {sub >= 35 ? <p className="mb-2 text-[12px]"><span className="text-success">✓</span> Your order qualifies for FREE Shipping. <span className="text-muted">Choose this option at checkout.</span></p> : <p className="mb-2 text-[12px] text-muted">Add <b className="text-ink">{money(Math.max(0, 35 - sub))}</b> of eligible items to your order to qualify for FREE Shipping.</p>}
            <p className="text-[18px]">Subtotal ({count} {count === 1 ? "item" : "items"}): <b>{money(sub)}</b></p>
            <label className="mt-2 flex items-center gap-2 text-[13px]"><input type="checkbox" className="h-4 w-4" /> This order contains a gift</label>
            <Link href={active.length ? (user ? "/checkout" : "/ap/signin?returnTo=/checkout") : "#"} className={`a-button a-button-primary a-button-pill a-button-block mt-3 hover:no-underline ${active.length ? "" : "pointer-events-none opacity-50"}`}>Proceed to checkout</Link>
          </div>
          <div className="bg-white p-5 text-[12px] text-muted">
            <p className="text-[14px] font-bold text-ink">Pair with your cart</p>
            <div className="mt-2 flex gap-3 overflow-x-auto">{topRated(3).map((p) => <GridCard key={p.id} p={p} compact />)}</div>
          </div>
        </aside>
      </div>
      <p className="mt-4 text-[12px] text-muted">The price and availability of items at Amazon.com are subject to change. The Cart is a temporary place to store a list of your items and reflects each item&apos;s most recent price. <Link href="/gp/help/customer/display.html">Learn more</Link></p>
    </div>
  );
}
