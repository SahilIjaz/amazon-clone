import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Help & Contact Us - Amazon Customer Service" };

const TOPICS: [string, string, string][] = [
  ["📦", "Where's my stuff?", "Track packages, edit or cancel orders"], ["↩", "Returns & Refunds", "Return or exchange items, print return labels"], ["🔒", "Login & security", "Change your password, email or phone"], ["💳", "Payments & gift cards", "Add or edit payment methods, redeem gift cards"], ["✔", "Prime", "Manage your membership and benefits"], ["📱", "Devices & digital services", "Set up and troubleshoot your devices"], ["🚚", "Shipping & delivery", "Shipping rates, times and policies"], ["🛡", "Security & privacy", "Report something suspicious, privacy settings"],
];
const FAQ: [string, string][] = [
  ["How do I track my package?", "Go to Your Orders, find the order and select Track package. You'll see the carrier and the latest scan."],
  ["How do I return an item?", "Most items can be returned within 30 days of delivery. From Your Orders, choose Return or replace items and follow the steps to print a label or get a QR code."],
  ["Can I change or cancel an order?", "You can cancel items that haven't entered the shipping process yet from Your Orders. After that, refuse the delivery or start a return."],
  ["How do I change my password?", "Open Login & security in Your Account and choose Edit next to Password. You'll be asked to confirm with a One Time Password."],
  ["What is Amazon Prime?", "Prime gives you fast free delivery, exclusive deals, Prime Video and more. Manage it from Your Account › Prime."],
];

export default async function Help() {
  const user = await currentUser();
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-6 text-[14px]">
      <h1 className="text-[28px] font-normal">Hello{user ? `, ${user.name.split(" ")[0]}` : ""}. What can we help you with?</h1>
      <form action="/gp/help/customer/display.html" className="mt-3 flex max-w-[600px] gap-2"><input name="q" className="a-input" placeholder="Search our help library" /><button className="a-button a-button-base a-button-pill">Search</button></form>
      <h2 className="mt-8 text-[20px] font-bold">Some things you can do here</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{TOPICS.map(([i, t, s]) => <div key={t} className="a-box p-4"><span className="text-[26px]">{i}</span><h3 className="mt-1 font-bold">{t}</h3><p className="text-[12px] text-muted">{s}</p></div>)}</div>
      <h2 className="mt-8 text-[20px] font-bold">Browse help topics</h2>
      <div className="mt-3 divide-y divide-line-soft border-y border-line-soft">{FAQ.map(([q, a]) => <details key={q} className="py-3"><summary className="cursor-pointer font-bold text-link">{q}</summary><p className="mt-2 text-ink">{a}</p></details>)}</div>
      <div className="a-box mt-8 flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="text-[18px] font-bold">Need more help?</h2><p className="text-muted">Chat with us or request a call. Typical wait time: under a minute.</p></div><div className="flex gap-2"><Link href={user ? "/your-account" : "/ap/signin?returnTo=/gp/help/customer/display.html"} className="a-button a-button-primary a-button-pill hover:no-underline">Start chatting now</Link><Link href="/your-account" className="a-button a-button-base a-button-pill hover:no-underline">Request a call</Link></div></div>
    </div>
  );
}
