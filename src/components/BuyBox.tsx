"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Price } from "./Price";
import { deliveryDate, type Product } from "@/lib/products";

/** Right-hand buy box: price, delivery, quantity, Add to Cart / Buy Now, Add to List. */
export default function BuyBox({ p, signedIn, inList }: { p: Product; signedIn: boolean; inList: boolean }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"" | "cart" | "buy" | "list">("");
  const [added, setAdded] = useState(false);
  const [listed, setListed] = useState(inList);
  const post = async (url: string, body: Record<string, unknown>) => { const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return r.json() as Promise<{ ok: boolean; error?: string; next?: string }>; };
  const addToCart = async () => { setBusy("cart"); const r = await post("/api/cart", { productId: p.id, qty }); setBusy(""); if (r.ok) { setAdded(true); router.refresh(); } };
  const buyNow = async () => { setBusy("buy"); const r = await post("/api/cart", { productId: p.id, qty }); setBusy(""); if (r.ok) router.push(signedIn ? "/checkout" : "/ap/signin?returnTo=/checkout"); };
  const addToList = async () => { if (!signedIn) { router.push(`/ap/signin?returnTo=/dp/${p.id}`); return; } setBusy("list"); const r = await post("/api/lists", { productId: p.id }); setBusy(""); if (r.ok) setListed(true); };
  return (
    <div className="a-box h-fit p-[18px] text-[14px]">
      <div className="flex items-baseline gap-2"><Price value={p.price} size="lg" /></div>
      <p className="mt-2">{p.prime ? <><span className="text-muted">FREE delivery</span> <b>{deliveryDate(2)}</b>. <span className="text-muted">Order within</span> <span className="text-success">4 hrs 12 mins</span></> : <><span className="text-muted">$6.99 delivery</span> <b>{deliveryDate(5)}</b></>}</p>
      <p className="mt-1 text-[12px]"><span className="text-link">📍 Deliver to United States</span></p>
      <p className={`mt-3 text-[18px] ${p.stock > 0 ? "text-success" : "text-danger"}`}>{p.stock > 10 ? "In Stock" : p.stock > 0 ? `Only ${p.stock} left in stock - order soon.` : "Currently unavailable."}</p>
      <label className="mt-3 block"><span className="mr-1">Quantity:</span><select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="a-select">{Array.from({ length: Math.min(10, Math.max(1, p.stock)) }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
      <button type="button" onClick={addToCart} disabled={!!busy || p.stock === 0} className="a-button a-button-primary a-button-pill a-button-block mt-3">{busy === "cart" ? "Adding…" : "Add to Cart"}</button>
      <button type="button" onClick={buyNow} disabled={!!busy || p.stock === 0} className="a-button a-button-buynow a-button-pill a-button-block mt-2">{busy === "buy" ? "Please wait…" : "Buy Now"}</button>
      {added && <p className="mt-2 text-[13px] text-success">✓ Added to Cart. <a href="/cart" className="a-link">Go to Cart</a></p>}
      <table className="mt-3 w-full text-[12px] text-muted"><tbody>
        <tr><td className="py-0.5 pr-3">Ships from</td><td className="text-ink">Amazon.com</td></tr>
        <tr><td className="py-0.5 pr-3">Sold by</td><td className="text-ink">{p.brand}</td></tr>
        <tr><td className="py-0.5 pr-3">Returns</td><td><span className="text-link">30-day refund/replacement</span></td></tr>
        <tr><td className="py-0.5 pr-3">Payment</td><td><span className="text-link">Secure transaction</span></td></tr>
      </tbody></table>
      <div className="a-divider my-3" />
      <button type="button" onClick={addToList} disabled={busy === "list"} className="a-button a-button-base a-button-pill a-button-block">{listed ? "✓ In your list" : "Add to List"}</button>
    </div>
  );
}
