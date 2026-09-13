import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Help & Contact Us - Amazon Customer Service" };

const TILES: [string, string, string][] = [
  ["📦", "A delivery, order or return", "/gp/css/order-history"], ["🔑", "Help with signing in", "/ap/forgotpassword"], ["✔", "Prime", "/your-account/prime"], ["📱", "Kindle, Fire, Alexa, other devices", "/your-account"], ["🎬", "Prime Video", "/your-account"], ["🎵", "Amazon Music", "/your-account"], ["💳", "Payment, charges or gift cards", "/your-account/payments"], ["📍", "Address, security & privacy", "/your-account/addresses"], ["🛒", "Memberships, subscriptions or communications", "/your-account"], ["🛡", "Report something suspicious", "/gp/help/customer/display.html"],
];
const TOPICS: [string, string][] = [
  ["Where's my stuff?", "Go to Your Orders, find the order and select Track package to see the carrier and the latest scan."],
  ["Returns & refunds", "Most items can be returned within 30 days of delivery. From Your Orders, choose Return or replace items and follow the steps."],
  ["Change or cancel an order", "Cancel items that haven't entered the shipping process from Your Orders. After that, refuse the delivery or start a return."],
  ["Manage your account", "Change your name, email, phone and password from Login & security. Add or remove addresses and payment methods from Your Account."],
  ["Prime membership", "Prime gives you fast free delivery, exclusive deals and Prime Video. Manage or end your membership from Your Account › Prime."],
];

export default async function Help() {
  const user = await currentUser();
  return (
    <div className="bg-white pb-10">
      <div className="bg-[#0a3a4a] px-5 pb-16 pt-8 text-white">
        <div className="mx-auto max-w-[1000px]">
          <h1 className="text-[28px] font-normal">Hello{user ? `, ${user.name.split(" ")[0]}` : ""}. What can we help you with?</h1>
          <p className="mt-1 text-[14px] text-white/80">Some things you can do here</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{TILES.map(([i, t, h]) => <Link key={t} href={h} className="rounded-lg bg-white p-4 text-ink hover:bg-[#f7fafa] hover:no-underline"><span className="text-[28px]">{i}</span><span className="mt-2 block text-[14px] font-bold leading-5">{t}</span></Link>)}</div>
        </div>
      </div>
      <div className="mx-auto max-w-[1000px] px-5 text-[14px]">
        <h2 className="mt-8 text-[20px] font-bold">Browse Help Topics</h2>
        <div className="mt-3 divide-y divide-line-soft border-y border-line-soft">{TOPICS.map(([q, a]) => <details key={q} className="py-3"><summary className="cursor-pointer font-bold text-link">{q}</summary><p className="mt-2 text-ink">{a}</p></details>)}</div>
        <h2 className="mt-8 text-[20px] font-bold">Search our help library</h2>
        <form action="/gp/help/customer/display.html" className="mt-2 flex max-w-[600px] gap-2"><input name="q" className="a-input" placeholder="Type something like, &quot;question about a charge&quot;" /><button className="a-button a-button-base a-button-pill">Search</button></form>
        <div className="a-box mt-8 flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="text-[18px] font-bold">Need more help?</h2><p className="text-muted">Chat with us or request a call. Typical wait time: under a minute.</p></div><div className="flex gap-2"><Link href={user ? "/your-account" : "/ap/signin?returnTo=/gp/help/customer/display.html"} className="a-button a-button-primary a-button-pill hover:no-underline">Start chatting now</Link><Link href="/your-account" className="a-button a-button-base a-button-pill hover:no-underline">Request a call</Link></div></div>
      </div>
    </div>
  );
}
