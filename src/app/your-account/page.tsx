import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your Account" };
export const dynamic = "force-dynamic";

const TILES: [string, string, string, string][] = [
  ["📦", "Your Orders", "Track, return, or buy things again", "/gp/css/order-history"],
  ["🔒", "Login & security", "Edit login, name, and mobile number", "/your-account/security"],
  ["✔", "Prime", "View benefits and payment settings", "/your-account/prime"],
  ["📍", "Your Addresses", "Edit addresses for orders and gifts", "/your-account/addresses"],
  ["💳", "Your Payments", "Manage payment methods and settings", "/your-account/payments"],
  ["🎁", "Gift cards", "View balance or redeem a card", "/gp/help/customer/display.html"],
  ["📝", "Your Lists", "Manage your wish lists", "/hz/wishlist/ls"],
  ["🕒", "Browsing History", "Products you've viewed recently", "/gp/history"],
  ["💬", "Your Messages", "View messages to and from Amazon", "/gp/help/customer/display.html"],
  ["🛠", "Customer Service", "Get help with orders and more", "/gp/help/customer/display.html"],
  ["📱", "Digital Services and Device Support", "Troubleshoot device issues", "/gp/help/customer/display.html"],
  ["📊", "Your Recommendations", "Based on your browsing", "/gp/history"],
];

export default async function YourAccount() {
  const user = await currentUser(); if (!user) redirect("/ap/signin?returnTo=/your-account");
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-5">
      <h1 className="text-[28px] font-normal">Your Account</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map(([icon, title, sub, href]) => <Link key={title} href={href} className="a-box flex gap-4 p-4 text-ink hover:bg-[#f7fafa] hover:no-underline"><span className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full bg-[#f0f2f2] text-[26px]">{icon}</span><span><span className="block text-[16px] font-bold">{title}</span><span className="block text-[13px] text-muted">{sub}</span></span></Link>)}
      </div>
      <p className="mt-6 text-[13px] text-muted">Signed in as {user.name} ({user.email}). <a href="/api/auth/logout" className="a-link">Sign out</a></p>
    </div>
  );
}
