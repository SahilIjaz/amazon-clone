import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Local inbox" };
export const dynamic = "force-dynamic";

/** Every e-mail the app sends is also kept here, so OTP flows work without SMTP configured. */
export default async function Inbox() {
  const rows = await (await db()).prepare("SELECT id, to_email, subject, text, created_at FROM outbox ORDER BY id DESC LIMIT 50").all<{ id: number; to_email: string; subject: string; text: string; created_at: string }>();
  return (
    <div className="mx-auto max-w-[800px] bg-white p-6">
      <h1 className="text-[24px] font-bold">Local inbox</h1>
      <p className="text-[13px] text-muted">Copies of the last 50 e-mails sent by this deployment (OTPs, order confirmations). Newest first.</p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-[14px]">No messages yet.</p>}
        {rows.map((m) => <article key={m.id} className="a-box p-4 text-[13px]"><p className="text-muted">To {m.to_email} · {m.created_at}</p><h2 className="font-bold">{m.subject}</h2><pre className="mt-2 whitespace-pre-wrap font-sans">{m.text}</pre></article>)}
      </div>
    </div>
  );
}
