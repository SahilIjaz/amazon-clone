"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Quantity dropdown + Delete / Save for later / Move to cart, posting to /api/cart and refreshing the page. */
export default function CartLineControls({ productId, qty, max, saved = false }: { productId: number; qty: number; max: number; saved?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const send = async (body: Record<string, unknown>) => { setBusy(true); await fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, ...body }) }); setBusy(false); router.refresh(); };
  return (
    <div className={`mt-2 flex flex-wrap items-center gap-2 text-[12px] ${busy ? "opacity-60" : ""}`}>
      {!saved && <label className="a-select inline-flex items-center gap-1 pr-2"><span>Qty:</span><select value={qty} onChange={(e) => send({ action: "set", qty: Number(e.target.value) })} className="bg-transparent outline-none">{Array.from({ length: max }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}<option value={0}>0 (Delete)</option></select></label>}
      <button type="button" onClick={() => send({ action: "remove" })} className="a-link border-l border-line pl-2 first:border-0 first:pl-0">Delete</button>
      {saved ? <button type="button" onClick={() => send({ action: "unsave" })} className="a-link border-l border-line pl-2">Move to cart</button> : <button type="button" onClick={() => send({ action: "save" })} className="a-link border-l border-line pl-2">Save for later</button>}
      <button type="button" className="a-link border-l border-line pl-2">Share</button>
    </div>
  );
}
