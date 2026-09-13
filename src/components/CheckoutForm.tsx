"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Address, Card } from "@/app/checkout/page";
import { deliveryDate, money } from "@/lib/products";

type Line = { id: number; title: string; price: number; qty: number; thumb: string; prime: boolean };
const post = async (url: string, body: Record<string, unknown>) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; error?: string; id?: string; orderId?: string }>;
const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

/** Amazon's single-page checkout: 1 address, 2 payment, 3 review + place order. */
export default function CheckoutForm({ user, lines, addresses: initialAddresses, cards: initialCards }: { user: { name: string; email: string; prime: boolean }; lines: Line[]; addresses: Address[]; cards: Card[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [cards, setCards] = useState(initialCards);
  const [addrId, setAddrId] = useState(initialAddresses[0]?.id || "");
  const [cardId, setCardId] = useState(initialCards[0]?.id || "");
  const [addingAddr, setAddingAddr] = useState(initialAddresses.length === 0);
  const [addingCard, setAddingCard] = useState(initialCards.length === 0);
  const [shipping, setShipping] = useState<"free" | "fast">("free");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [na, setNa] = useState({ full_name: user.name, phone: "", line1: "", line2: "", city: "", state: "NY", zip: "" });
  const [nc, setNc] = useState({ number: "", name_on_card: user.name, exp: "", cvv: "" });

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const ship = shipping === "fast" ? 9.99 : subtotal >= 35 ? 0 : 5.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + ship + tax;

  const saveAddress = async () => { setErr(null); if (!na.full_name || !na.line1 || !na.city || !na.zip) { setErr("Please fill in the required address fields."); return; } setBusy(true); const r = await post("/api/account/address", na); setBusy(false); if (!r.ok) { setErr(r.error || "Could not save"); return; } const a: Address = { id: r.id!, ...na, phone: na.phone || null, line2: na.line2 || null, country: "United States", is_default: addresses.length ? 0 : 1 }; setAddresses([...addresses, a]); setAddrId(a.id); setAddingAddr(false); };
  const saveCard = async () => { setErr(null); const digits = nc.number.replace(/\s/g, ""); const m = nc.exp.match(/^(\d{2})\s*\/\s*(\d{2,4})$/); if (digits.length < 12 || !m || !nc.name_on_card) { setErr("Enter a valid card number, name and expiry (MM/YY)."); return; } setBusy(true); const r = await post("/api/account/payment", { number: digits, name_on_card: nc.name_on_card, exp_month: Number(m[1]), exp_year: Number(m[2].length === 2 ? "20" + m[2] : m[2]) }); setBusy(false); if (!r.ok) { setErr(r.error || "Could not save"); return; } const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : digits.startsWith("3") ? "American Express" : "Card"; const c: Card = { id: r.id!, brand, last4: digits.slice(-4), name_on_card: nc.name_on_card, exp_month: Number(m[1]), exp_year: Number(m[2].length === 2 ? "20" + m[2] : m[2]), is_default: cards.length ? 0 : 1 }; setCards([...cards, c]); setCardId(c.id); setAddingCard(false); };
  const placeOrder = async () => { setErr(null); if (!addrId) { setErr("Select a delivery address."); return; } if (!cardId) { setErr("Select a payment method."); return; } setBusy(true); const r = await post("/api/checkout", { addressId: addrId, cardId, shipping }); setBusy(false); if (r.ok) window.location.href = `/checkout/thankyou?order=${r.orderId}`; else setErr(r.error || "Could not place the order"); };

  const addr = addresses.find((a) => a.id === addrId); const card = cards.find((c) => c.id === cardId);
  const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => <section className="grid grid-cols-[40px_1fr] gap-4 border-b border-line-soft py-5"><span className="text-[18px] font-bold">{n}</span><div><h2 className="text-[18px] font-bold">{title}</h2><div className="mt-3 text-[14px]">{children}</div></div></section>;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        {err && <div className="mb-4 rounded-md border border-[#c40000] bg-[#fff5f5] p-3 text-[13px]"><b className="text-[#c40000]">There was a problem</b><p>{err}</p></div>}
        <Section n={1} title="Delivery address">
          {addr && !addingAddr ? <div className="flex justify-between gap-4"><p><b>{addr.full_name}</b><br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />{addr.city}, {addr.state} {addr.zip}<br />{addr.country}</p><button type="button" className="a-link text-[13px]" onClick={() => setAddingAddr(true)}>Change</button></div> : null}
          {addresses.length > 0 && addingAddr && <div className="mb-3 space-y-2">{addresses.map((a) => <label key={a.id} className="flex cursor-pointer items-start gap-2"><input type="radio" name="addr" checked={addrId === a.id} onChange={() => { setAddrId(a.id); setAddingAddr(false); }} className="mt-1" /><span><b>{a.full_name}</b> {a.line1}, {a.city}, {a.state} {a.zip}</span></label>)}</div>}
          {addingAddr && (
            <div className="a-box max-w-[420px] p-4">
              <h3 className="mb-2 font-bold">Add a new address</h3>
              <div className="space-y-2">
                <div><label className="block text-[12px] font-bold">Full name (First and Last name)</label><input className="a-input" value={na.full_name} onChange={(e) => setNa({ ...na, full_name: e.target.value })} /></div>
                <div><label className="block text-[12px] font-bold">Phone number</label><input className="a-input" value={na.phone} onChange={(e) => setNa({ ...na, phone: e.target.value })} placeholder="May be used to assist delivery" /></div>
                <div><label className="block text-[12px] font-bold">Address</label><input className="a-input" value={na.line1} onChange={(e) => setNa({ ...na, line1: e.target.value })} placeholder="Street address or P.O. Box" /><input className="a-input mt-1" value={na.line2} onChange={(e) => setNa({ ...na, line2: e.target.value })} placeholder="Apt, suite, unit, building, floor, etc." /></div>
                <div className="grid grid-cols-3 gap-2"><div><label className="block text-[12px] font-bold">City</label><input className="a-input" value={na.city} onChange={(e) => setNa({ ...na, city: e.target.value })} /></div><div><label className="block text-[12px] font-bold">State</label><select className="a-input" value={na.state} onChange={(e) => setNa({ ...na, state: e.target.value })}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div><div><label className="block text-[12px] font-bold">ZIP Code</label><input className="a-input" value={na.zip} onChange={(e) => setNa({ ...na, zip: e.target.value })} /></div></div>
                <button type="button" onClick={saveAddress} disabled={busy} className="a-button a-button-primary a-button-pill mt-1">Use this address</button>
              </div>
            </div>
          )}
        </Section>
        <Section n={2} title="Payment method">
          {card && !addingCard ? <div className="flex justify-between gap-4"><p><b>{card.brand}</b> ending in {card.last4}<br /><span className="text-muted">{card.name_on_card} · Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year}</span></p><button type="button" className="a-link text-[13px]" onClick={() => setAddingCard(true)}>Change</button></div> : null}
          {cards.length > 0 && addingCard && <div className="mb-3 space-y-2">{cards.map((c) => <label key={c.id} className="flex cursor-pointer items-center gap-2"><input type="radio" name="card" checked={cardId === c.id} onChange={() => { setCardId(c.id); setAddingCard(false); }} /><span><b>{c.brand}</b> ending in {c.last4}</span></label>)}</div>}
          {addingCard && (
            <div className="a-box max-w-[420px] p-4">
              <h3 className="mb-2 font-bold">Add a credit or debit card</h3>
              <p className="mb-2 text-[12px] text-muted">This is a demo store: card numbers are never charged and only the last four digits are stored.</p>
              <div className="space-y-2">
                <div><label className="block text-[12px] font-bold">Card number</label><input className="a-input" inputMode="numeric" value={nc.number} onChange={(e) => setNc({ ...nc, number: e.target.value })} placeholder="4242 4242 4242 4242" /></div>
                <div><label className="block text-[12px] font-bold">Name on card</label><input className="a-input" value={nc.name_on_card} onChange={(e) => setNc({ ...nc, name_on_card: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[12px] font-bold">Expiration date</label><input className="a-input" value={nc.exp} onChange={(e) => setNc({ ...nc, exp: e.target.value })} placeholder="MM/YY" /></div><div><label className="block text-[12px] font-bold">Security code</label><input className="a-input" value={nc.cvv} onChange={(e) => setNc({ ...nc, cvv: e.target.value })} placeholder="CVV" /></div></div>
                <button type="button" onClick={saveCard} disabled={busy} className="a-button a-button-primary a-button-pill mt-1">Add your card</button>
              </div>
            </div>
          )}
        </Section>
        <Section n={3} title="Review items and delivery">
          <div className="space-y-3">
            {lines.map((l) => <div key={l.id} className="flex gap-3"><div className="relative h-[90px] w-[90px] shrink-0"><Image src={l.thumb} alt="" fill sizes="90px" className="object-contain" /></div><div><p className="font-bold leading-5 truncate-2">{l.title}</p><p className="text-danger font-bold">{money(l.price)}</p><p className="text-[12px] text-muted">Qty: {l.qty}</p>{l.prime && <span className="prime-badge">prime</span>}</div></div>)}
          </div>
          <div className="mt-4 space-y-2">
            <p className="font-bold text-success">Delivery date: {deliveryDate(shipping === "fast" ? 1 : 2)}</p>
            <label className="flex items-center gap-2"><input type="radio" name="ship" checked={shipping === "free"} onChange={() => setShipping("free")} /> {subtotal >= 35 ? "FREE Shipping" : "$5.99 - Standard Shipping"} <span className="text-muted">({deliveryDate(2)})</span></label>
            <label className="flex items-center gap-2"><input type="radio" name="ship" checked={shipping === "fast"} onChange={() => setShipping("fast")} /> $9.99 - Same-Day / One-Day Delivery <span className="text-muted">({deliveryDate(1)})</span></label>
          </div>
        </Section>
        <div className="a-box mt-5 flex items-center gap-5 p-4">
          <button type="button" onClick={placeOrder} disabled={busy} className="a-button a-button-primary a-button-pill h-[36px] px-6">{busy ? "Placing order…" : "Place your order"}</button>
          <div className="text-[13px]"><p className="text-[18px] font-bold text-danger">Order total: {money(total)}</p><p className="text-[12px] text-muted">By placing your order, you agree to Amazon&apos;s <Link href="/gp/help/customer/display.html">privacy notice</Link> and <Link href="/gp/help/customer/display.html">conditions of use</Link>.</p></div>
        </div>
      </div>
      <aside className="a-box h-fit p-5 text-[14px]">
        <button type="button" onClick={placeOrder} disabled={busy} className="a-button a-button-primary a-button-pill a-button-block">{busy ? "Placing order…" : "Place your order"}</button>
        <p className="mt-2 text-[12px] text-muted">By placing your order, you agree to Amazon&apos;s privacy notice and conditions of use.</p>
        <div className="a-divider my-3" />
        <h3 className="text-[18px] font-bold">Order Summary</h3>
        <dl className="mt-2 space-y-1"><div className="flex justify-between"><dt>Items:</dt><dd>{money(subtotal)}</dd></div><div className="flex justify-between"><dt>Shipping & handling:</dt><dd>{money(ship)}</dd></div><div className="flex justify-between"><dt>Total before tax:</dt><dd>{money(subtotal + ship)}</dd></div><div className="flex justify-between"><dt>Estimated tax to be collected:</dt><dd>{money(tax)}</dd></div></dl>
        <div className="a-divider my-3" />
        <p className="flex justify-between text-[18px] font-bold text-danger"><span>Order total:</span><span>{money(total)}</span></p>
        <div className="a-divider my-3" />
        <p className="text-[12px]"><Link href="/gp/help/customer/display.html">How are shipping costs calculated?</Link></p>
      </aside>
    </div>
  );
}
