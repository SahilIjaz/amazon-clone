"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Address = { id: string; full_name: string; phone: string | null; line1: string; line2: string | null; city: string; state: string; zip: string; country: string; is_default: number };
type Card = { id: string; brand: string; last4: string; name_on_card: string; exp_month: number; exp_year: number; is_default: number };
const post = async (url: string, body: Record<string, unknown>) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; error?: string }>;

export default function AccountSection({ section, user, addresses, cards }: { section: "addresses" | "payments" | "security" | "prime"; user: { name: string; email: string; phone: string | null; prime: boolean }; addresses: Address[]; cards: Card[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [na, setNa] = useState({ full_name: user.name, phone: "", line1: "", line2: "", city: "", state: "NY", zip: "" });
  const [nc, setNc] = useState({ number: "", name_on_card: user.name, exp: "" });
  const [prof, setProf] = useState({ name: user.name, phone: user.phone || "" });
  const [pw, setPw] = useState({ current: "", password: "" });
  const run = async (url: string, body: Record<string, unknown>, ok: string) => { setErr(null); setMsg(null); const r = await post(url, body); if (r.ok) { setMsg(ok); setAdding(false); router.refresh(); } else setErr(r.error || "Something went wrong"); };
  const Notice = () => <>{msg && <p className="mb-3 rounded-md border border-success bg-[#f0fff0] p-2 text-[13px] text-success">✓ {msg}</p>}{err && <p className="mb-3 rounded-md border border-[#c40000] bg-[#fff5f5] p-2 text-[13px] text-[#c40000]">{err}</p>}</>;

  if (section === "addresses") return (
    <div className="mt-4 text-[14px]"><Notice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button type="button" onClick={() => setAdding(true)} className="a-box grid min-h-[200px] place-items-center border-dashed text-[20px] text-muted hover:bg-[#f7fafa]">+ Add Address</button>
        {addresses.map((a) => <div key={a.id} className="a-box flex min-h-[200px] flex-col p-4">{!!a.is_default && <p className="mb-1 border-b border-line pb-1 text-[12px] font-bold">Default:</p>}<p className="flex-1"><b>{a.full_name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.zip}<br />{a.country}{a.phone && <><br />Phone number: {a.phone}</>}</p><p className="text-[13px]"><button className="a-link" onClick={() => run("/api/account/address-delete", { id: a.id }, "Address removed")}>Remove</button>{!a.is_default && <> | <button className="a-link" onClick={() => run("/api/account/address-default", { id: a.id }, "Default address updated")}>Set as Default</button></>}</p></div>)}
      </div>
      {adding && <div className="a-box mt-4 max-w-[460px] p-4"><h2 className="mb-2 text-[18px] font-bold">Add a new address</h2><div className="space-y-2">{[["full_name", "Full name"], ["phone", "Phone number"], ["line1", "Address"], ["line2", "Apt, suite, unit (optional)"], ["city", "City"], ["state", "State"], ["zip", "ZIP Code"]].map(([k, l]) => <div key={k}><label className="block text-[12px] font-bold">{l}</label><input className="a-input" value={(na as Record<string, string>)[k!]} onChange={(e) => setNa({ ...na, [k!]: e.target.value })} /></div>)}<button className="a-button a-button-primary a-button-pill" onClick={() => run("/api/account/address", na, "Address added")}>Add address</button></div></div>}
    </div>
  );
  if (section === "payments") return (
    <div className="mt-4 text-[14px]"><Notice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button type="button" onClick={() => setAdding(true)} className="a-box grid min-h-[120px] place-items-center border-dashed text-[18px] text-muted hover:bg-[#f7fafa]">+ Add a payment method</button>
        {cards.map((c) => <div key={c.id} className="a-box p-4"><p className="text-[16px] font-bold">{c.brand} •••• {c.last4}</p><p className="text-muted">{c.name_on_card} · Expires {String(c.exp_month).padStart(2, "0")}/{c.exp_year}</p>{!!c.is_default && <p className="text-[12px] font-bold">Default</p>}<button className="a-link mt-2 text-[13px]" onClick={() => run("/api/account/payment-delete", { id: c.id }, "Card removed")}>Remove</button></div>)}
      </div>
      {adding && <div className="a-box mt-4 max-w-[420px] p-4"><h2 className="mb-1 text-[18px] font-bold">Add a credit or debit card</h2><p className="mb-2 text-[12px] text-muted">Demo store: nothing is charged, only the last four digits are stored.</p><div className="space-y-2"><div><label className="block text-[12px] font-bold">Card number</label><input className="a-input" value={nc.number} onChange={(e) => setNc({ ...nc, number: e.target.value })} placeholder="4242 4242 4242 4242" /></div><div><label className="block text-[12px] font-bold">Name on card</label><input className="a-input" value={nc.name_on_card} onChange={(e) => setNc({ ...nc, name_on_card: e.target.value })} /></div><div><label className="block text-[12px] font-bold">Expiration (MM/YY)</label><input className="a-input" value={nc.exp} onChange={(e) => setNc({ ...nc, exp: e.target.value })} placeholder="MM/YY" /></div><button className="a-button a-button-primary a-button-pill" onClick={() => { const m = nc.exp.match(/^(\d{2})\s*\/\s*(\d{2,4})$/); if (!m) { setErr("Enter the expiry as MM/YY"); return; } run("/api/account/payment", { number: nc.number, name_on_card: nc.name_on_card, exp_month: Number(m[1]), exp_year: Number(m[2].length === 2 ? "20" + m[2] : m[2]) }, "Card added"); }}>Add your card</button></div></div>}
    </div>
  );
  if (section === "prime") return (
    <div className="a-box mt-4 max-w-[520px] p-5 text-[14px]"><Notice />
      <p className="prime-badge text-[22px]">prime</p>
      <p className="mt-2">{user.prime ? "You're a Prime member. Enjoy FREE One-Day Delivery on eligible items, exclusive deals and more." : "Join Prime for FREE One-Day Delivery on eligible items, exclusive deals and Prime Video."}</p>
      <p className="mt-1 text-muted">Demo membership: no payment is taken.</p>
      <button className={`a-button ${user.prime ? "a-button-base" : "a-button-primary"} a-button-pill mt-3`} onClick={() => run("/api/account/prime", { on: !user.prime }, user.prime ? "Prime membership ended" : "Welcome to Prime!")}>{user.prime ? "End membership" : "Start your membership"}</button>
    </div>
  );
  return (
    <div className="mt-4 max-w-[520px] space-y-4 text-[14px]"><Notice />
      <div className="a-box p-4"><h2 className="text-[16px] font-bold">Name & mobile</h2><div className="mt-2 space-y-2"><div><label className="block text-[12px] font-bold">Name</label><input className="a-input" value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} /></div><div><label className="block text-[12px] font-bold">Mobile phone number</label><input className="a-input" value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} /></div><button className="a-button a-button-primary a-button-pill" onClick={() => run("/api/auth/profile", prof, "Profile saved")}>Save changes</button></div></div>
      <div className="a-box p-4"><h2 className="text-[16px] font-bold">Email</h2><p className="mt-1">{user.email}</p></div>
      <div className="a-box p-4"><h2 className="text-[16px] font-bold">Password</h2><div className="mt-2 space-y-2"><div><label className="block text-[12px] font-bold">Current password</label><input type="password" className="a-input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div><div><label className="block text-[12px] font-bold">New password</label><input type="password" className="a-input" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></div><button className="a-button a-button-primary a-button-pill" onClick={() => run("/api/auth/password", pw, "Password changed")}>Save changes</button></div></div>
    </div>
  );
}
