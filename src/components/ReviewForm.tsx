"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true); const r = await (await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, rating, title, body }) })).json(); setBusy(false); if (r.ok) router.push(`/dp/${productId}#reviews`); else setErr(r.error || "Could not submit"); };
  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <div className="border-b border-line-soft pb-5"><h2 className="text-[18px] font-bold">Overall rating</h2><div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} stars`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className={`text-[34px] leading-none ${(hover || rating) >= n ? "text-star" : "text-[#ccc]"}`}>★</button>)}</div></div>
      <div className="border-b border-line-soft pb-5"><h2 className="text-[18px] font-bold">Add a headline</h2><input className="a-input mt-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's most important to know?" /></div>
      <div className="border-b border-line-soft pb-5"><h2 className="text-[18px] font-bold">Add a written review</h2><textarea className="a-input mt-2 h-[120px] py-2" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you like or dislike? What did you use this product for?" /></div>
      {err && <p className="text-[13px] text-[#c40000]">{err}</p>}
      <button className="a-button a-button-primary a-button-pill" disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
    </form>
  );
}
