"use client";
import { useState } from "react";
import Link from "next/link";

const LISTS = [["Create a List", "/hz/wishlist/ls?new=1"], ["Find a List or Registry", "/hz/wishlist/ls"], ["Your Lists", "/hz/wishlist/ls"]];
const ACCOUNT = [["Account", "/your-account"], ["Orders", "/gp/css/order-history"], ["Recommendations", "/gp/history"], ["Browsing History", "/gp/history"], ["Your Shopping preferences", "/your-account"], ["Watchlist", "/hz/wishlist/ls"], ["Video Purchases & Rentals", "/gp/css/order-history"], ["Kindle Unlimited", "/your-account"], ["Content & Devices", "/your-account"], ["Subscribe & Save Items", "/your-account"], ["Memberships & Subscriptions", "/your-account"], ["Music Library", "/your-account"]];

/** "Hello, sign in / Account & Lists" with the hover flyout. */
export default function AccountMenu({ user }: { user: { name: string } | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link href={user ? "/your-account" : "/ap/signin"} className="nav-item" aria-haspopup="true" aria-expanded={open}>
        <span className="nav-line-1">Hello, {user ? user.name.split(" ")[0] : "sign in"}</span>
        <span className="nav-line-2">Account & Lists<span className="nav-caret" /></span>
      </Link>
      {open && (
        <div className="flyout">
          <div className="flyout-inner">
            {!user && (
              <div className="border-b border-line px-6 py-4 text-center">
                <Link href="/ap/signin" className="a-button a-button-primary a-button-pill mx-auto w-[220px] h-[33px]">Sign in</Link>
                <p className="mt-2 text-[12px]">New customer? <Link href="/ap/register" className="a-link">Start here.</Link></p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 px-6 py-4">
              <div className="flyout-col border-r border-line pr-6"><h3>Your Lists</h3>{LISTS.map(([l, h]) => <Link key={l} href={h}>{l}</Link>)}</div>
              <div className="flyout-col"><h3>Your Account</h3>{ACCOUNT.map(([l, h]) => <Link key={l} href={h}>{l}</Link>)}{user && <><span className="my-1 block border-t border-line" /><Link href="/ap/signin?switch=1">Switch Accounts</Link><a href="/api/auth/logout">Sign Out</a></>}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
