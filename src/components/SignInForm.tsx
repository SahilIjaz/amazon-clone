"use client";
import { useState } from "react";
import Link from "next/link";
import { INPUT, LABEL, PRIMARY } from "./AuthShell";

const post = async (url: string, body: Record<string, unknown>) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; error?: string; exists?: boolean; next?: string; needsVerification?: boolean; delivery?: string }>;

/** Amazon's two-step sign-in: email first, then password (with OTP verification when the account isn't verified yet). */
export default function SignInForm({ returnTo, presetEmail }: { returnTo: string; presetEmail?: string }) {
  const [step, setStep] = useState<"email" | "password" | "otp">(presetEmail ? "password" : "email");
  const [email, setEmail] = useState(presetEmail || "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const next = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true);
    const r = await post("/api/auth/lookup", { email }); setBusy(false);
    if (!r.ok) { setErr(r.error || "Something went wrong"); return; }
    if (!r.exists) { window.location.href = `/ap/register?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`; return; }
    setStep("password"); };
  const signIn = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true);
    const r = await post("/api/auth/login", { email, password, returnTo }); setBusy(false);
    if (r.ok) { window.location.href = r.next || returnTo; return; }
    if (r.needsVerification) { setHint(r.delivery === "email" ? `We sent an OTP to ${email}.` : "Your OTP is waiting in the local inbox (/dev/inbox)."); setStep("otp"); return; }
    setErr(r.error || "Sign-in failed"); };
  const verify = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true);
    const r = await post("/api/auth/verify", { email, code, returnTo }); setBusy(false);
    if (r.ok) window.location.href = r.next || returnTo; else setErr(r.error || "Invalid OTP"); };

  const Err = () => err ? <div className="mb-3 rounded-md border border-[#c40000] bg-white p-3 text-[13px]"><b className="text-[#c40000]">There was a problem</b><p>{err}</p></div> : null;

  if (step === "email") return (
    <form onSubmit={next}>
      <h1 className="mb-3 text-[28px] font-normal leading-8">Sign in or create account</h1><Err />
      <label className={LABEL} htmlFor="ap_email">Enter mobile number or email</label>
      <input id="ap_email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoFocus required />
      <button className={`${PRIMARY} mt-4`} disabled={busy}>{busy ? "Please wait…" : "Continue"}</button>
      <p className="mt-4 text-[12px] leading-4">By continuing, you agree to Amazon&apos;s <Link href="/gp/help/customer/display.html">Conditions of Use</Link> and <Link href="/gp/help/customer/display.html">Privacy Notice</Link>.</p>
      <details className="mt-4 text-[13px]"><summary className="cursor-pointer text-link">▸ Need help?</summary><div className="mt-1 space-y-1 pl-3"><Link href="/ap/forgotpassword" className="block">Forgot your password?</Link><Link href="/gp/help/customer/display.html" className="block">Other issues with Sign-In</Link></div></details>
      <div className="a-divider my-4" />
      <p className="text-[13px] font-bold">Buying for work?</p><Link href="/ap/register" className="text-[13px]">Create a free business account</Link>
    </form>
  );
  if (step === "password") return (
    <form onSubmit={signIn}>
      <h1 className="mb-3 text-[28px] font-normal leading-8">Sign in</h1><Err />
      <p className="mb-3 text-[13px]">{email} <button type="button" className="ml-1 text-link" onClick={() => setStep("email")}>Change</button></p>
      <div className="flex justify-between"><label className={LABEL} htmlFor="ap_password">Password</label><Link href={`/ap/forgotpassword?email=${encodeURIComponent(email)}`} className="text-[13px]">Forgot password?</Link></div>
      <input id="ap_password" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoFocus required />
      <button className={`${PRIMARY} mt-4`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked /> Keep me signed in. <Link href="/gp/help/customer/display.html">Details ▾</Link></label>
    </form>
  );
  return (
    <form onSubmit={verify}>
      <h1 className="mb-3 text-[28px] font-normal leading-8">Verify email address</h1><Err />
      <p className="mb-3 text-[13px]">To verify your email, we&apos;ve sent a One Time Password (OTP) to <b>{email}</b>. {hint}</p>
      <label className={LABEL} htmlFor="ap_otp">Enter OTP</label>
      <input id="ap_otp" className={INPUT} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} autoFocus required />
      <button className={`${PRIMARY} mt-4`} disabled={busy || code.length !== 6}>Create your Amazon account</button>
      <button type="button" onClick={async () => { const r = await post("/api/auth/resend", { email }); setHint(r.delivery === "email" ? "A new OTP is on its way." : "A new OTP is in the local inbox (/dev/inbox)."); }} className="mt-3 text-[13px] text-link">Resend OTP</button>
    </form>
  );
}
