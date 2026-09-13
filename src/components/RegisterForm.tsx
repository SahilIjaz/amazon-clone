"use client";
import { useState } from "react";
import Link from "next/link";
import { INPUT, LABEL, PRIMARY } from "./AuthShell";

const post = async (url: string, body: Record<string, unknown>) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; error?: string; next?: string; delivery?: string }>;

/** Create account → OTP verification, mirroring amazon.com/ap/register. */
export default function RegisterForm({ presetEmail, returnTo }: { presetEmail?: string; returnTo: string }) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [f, setF] = useState({ name: "", email: presetEmail || "", password: "", confirm: "" });
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => { e.preventDefault(); setErr(null);
    if (f.password.length < 6) { setErr("Passwords must be at least 6 characters."); return; }
    if (f.password !== f.confirm) { setErr("Passwords must match."); return; }
    setBusy(true); const r = await post("/api/auth/register", { name: f.name, email: f.email, password: f.password }); setBusy(false);
    if (!r.ok) { setErr(r.error || "Could not create the account"); return; }
    setHint(r.delivery === "email" ? `We sent an OTP to ${f.email}.` : "Your OTP is waiting in the local inbox (/dev/inbox)."); setStep("otp"); };
  const verify = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true);
    const r = await post("/api/auth/verify", { email: f.email, code, returnTo }); setBusy(false);
    if (r.ok) window.location.href = r.next || returnTo; else setErr(r.error || "Invalid OTP"); };
  const Err = () => err ? <div className="mb-3 rounded-md border border-[#c40000] bg-white p-3 text-[13px]"><b className="text-[#c40000]">There was a problem</b><p>{err}</p></div> : null;

  if (step === "otp") return (
    <form onSubmit={verify}>
      <h1 className="mb-3 text-[28px] font-normal leading-8">Verify email address</h1><Err />
      <p className="mb-3 text-[13px]">To verify your email, we&apos;ve sent a One Time Password (OTP) to <b>{f.email}</b> <button type="button" className="text-link" onClick={() => setStep("form")}>(Change)</button>. {hint}</p>
      <label className={LABEL} htmlFor="ap_otp">Enter OTP</label>
      <input id="ap_otp" className={INPUT} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} autoFocus required />
      <button className={`${PRIMARY} mt-4`} disabled={busy || code.length !== 6}>Create your Amazon account</button>
      <p className="mt-4 text-[12px] leading-4">By creating an account, you agree to Amazon&apos;s <Link href="/gp/help/customer/display.html">Conditions of Use</Link> and <Link href="/gp/help/customer/display.html">Privacy Notice</Link>.</p>
      <button type="button" onClick={async () => { const r = await post("/api/auth/resend", { email: f.email }); setHint(r.delivery === "email" ? "A new OTP is on its way." : "A new OTP is in the local inbox (/dev/inbox)."); }} className="mt-3 text-[13px] text-link">Resend OTP</button>
    </form>
  );
  return (
    <form onSubmit={create} className="space-y-3">
      <h1 className="text-[28px] font-normal leading-8">Create account</h1><Err />
      <div><label className={LABEL} htmlFor="ap_name">Your name</label><input id="ap_name" className={INPUT} placeholder="First and last name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></div>
      <div><label className={LABEL} htmlFor="ap_email">Mobile number or email</label><input id="ap_email" className={INPUT} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
      <div><label className={LABEL} htmlFor="ap_pw">Password</label><input id="ap_pw" className={INPUT} type="password" placeholder="At least 6 characters" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /><p className="mt-1 text-[12px]"><span className="text-[#0073bb]">ℹ</span> Passwords must be at least 6 characters.</p></div>
      <div><label className={LABEL} htmlFor="ap_pw2">Re-enter password</label><input id="ap_pw2" className={INPUT} type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required /></div>
      <button className={`${PRIMARY} mt-2`} disabled={busy}>{busy ? "Please wait…" : "Continue"}</button>
      <p className="text-[12px] leading-4">By creating an account, you agree to Amazon&apos;s <Link href="/gp/help/customer/display.html">Conditions of Use</Link> and <Link href="/gp/help/customer/display.html">Privacy Notice</Link>.</p>
      <div className="a-divider" />
      <p className="text-[13px]">Already have an account? <Link href="/ap/signin">Sign in ›</Link></p>
      <p className="text-[13px]"><b>Buying for work?</b> <Link href="/ap/register">Create a free business account</Link></p>
    </form>
  );
}
