"use client";
import { useState } from "react";
import { INPUT, LABEL, PRIMARY } from "./AuthShell";

const post = async (url: string, body: Record<string, unknown>) => (await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; error?: string; delivery?: string }>;

/** Password assistance: email → OTP → new password. */
export default function ForgotForm({ presetEmail }: { presetEmail?: string }) {
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState(presetEmail || "");
  const [code, setCode] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [hint, setHint] = useState<string | null>(null);
  const send = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); setBusy(true); const r = await post("/api/auth/forgot", { email }); setBusy(false); if (!r.ok) { setErr(r.error || "Could not send the OTP"); return; } setHint(r.delivery === "email" ? `We sent an OTP to ${email}.` : "Your OTP is in the local inbox (/dev/inbox)."); setStep("otp"); };
  const reset = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); if (pw.length < 6) { setErr("Passwords must be at least 6 characters."); return; } if (pw !== pw2) { setErr("Passwords must match."); return; } setBusy(true); const r = await post("/api/auth/reset", { email, code, password: pw }); setBusy(false); if (r.ok) setStep("done"); else setErr(r.error || "Invalid OTP"); };
  const Err = () => err ? <div className="mb-3 rounded-md border border-[#c40000] bg-white p-3 text-[13px]"><b className="text-[#c40000]">There was a problem</b><p>{err}</p></div> : null;
  if (step === "done") return <div><h1 className="mb-3 text-[28px] font-normal leading-8">Password changed</h1><p className="text-[13px]">Your password has been updated. <a href={`/ap/signin?email=${encodeURIComponent(email)}`} className="a-link">Sign in</a> with your new password.</p></div>;
  if (step === "otp") return (
    <form onSubmit={reset} className="space-y-3">
      <h1 className="text-[28px] font-normal leading-8">Create new password</h1><Err />
      <p className="text-[13px]">{hint} Enter it below along with your new password.</p>
      <div><label className={LABEL}>OTP</label><input className={INPUT} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} required autoFocus /></div>
      <div><label className={LABEL}>New password</label><input className={INPUT} type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
      <div><label className={LABEL}>Password again</label><input className={INPUT} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
      <button className={PRIMARY} disabled={busy}>Save changes and sign in</button>
    </form>
  );
  return (
    <form onSubmit={send}>
      <h1 className="mb-3 text-[28px] font-normal leading-8">Password assistance</h1><Err />
      <p className="mb-3 text-[13px]">Enter the email address or mobile phone number associated with your Amazon account.</p>
      <label className={LABEL}>Email or mobile phone number</label>
      <input className={INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <button className={`${PRIMARY} mt-4`} disabled={busy}>Continue</button>
    </form>
  );
}
