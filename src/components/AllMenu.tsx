"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const Chevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;

const DIGITAL = [["Amazon Music", "/s?k=music"], ["Kindle E-readers & Books", "/s?k=book"], ["Amazon Appstore", "/s?k=app"]];
const SHOP = [["Electronics", "/s?i=Electronics"], ["Computers", "/s?k=laptop"], ["Smart Home", "/s?k=home"], ["Arts & Crafts", "/s?k=decor"], ["Automotive", "/s?i=Automotive"], ["Baby", "/s?k=baby"], ["Beauty and Personal Care", "/s?i=Beauty+%26+Personal+Care"], ["Women's Fashion", "/s?i=Women%27s+Fashion"], ["Men's Fashion", "/s?i=Men%27s+Fashion"], ["Health and Household", "/s?i=Grocery+%26+Gourmet+Food"], ["Home and Kitchen", "/s?i=Home+%26+Kitchen"], ["Sports and Outdoors", "/s?i=Sports+%26+Outdoors"], ["Toys and Games", "/s?k=toy"]];
const PROGRAMS = [["Gift Cards", "/s?k=gift"], ["Shop By Interest", "/deals"], ["Amazon Live", "/deals"], ["International Shopping", "/gp/help/customer/display.html"]];
const HELP = [["Your Account", "/your-account"], ["Customer Service", "/gp/help/customer/display.html"]];

/** The "☰ All" drawer that slides in from the left. */
export default function AllMenu({ user }: { user: { name: string } | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); }; }, [open]);
  const Item = ({ l, h }: { l: string; h: string }) => <Link href={h} className="hmenu-item" onClick={() => setOpen(false)}>{l}<Chevron /></Link>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="nav-a mr-1 inline-flex items-center gap-1 font-bold" aria-label="Open All menu" aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>All
      </button>
      {open && <div className="hmenu-backdrop" onClick={() => setOpen(false)} />}
      <nav className={`hmenu ${open ? "open" : ""}`} aria-label="All categories" aria-hidden={!open}>
        <Link href={user ? "/your-account" : "/ap/signin"} className="hmenu-head hover:no-underline" onClick={() => setOpen(false)}><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0Z" /></svg>Hello, {user ? user.name.split(" ")[0] : "sign in"}</Link>
        <div className="py-2">
          <div className="hmenu-title">Digital Content & Devices</div>{DIGITAL.map(([l, h]) => <Item key={l} l={l} h={h} />)}
          <div className="hmenu-sep" />
          <div className="hmenu-title">Shop by Department</div>{SHOP.map(([l, h]) => <Item key={l} l={l} h={h} />)}
          <div className="hmenu-sep" />
          <div className="hmenu-title">Programs & Features</div>{PROGRAMS.map(([l, h]) => <Item key={l} l={l} h={h} />)}
          <div className="hmenu-sep" />
          <div className="hmenu-title">Help & Settings</div>{HELP.map(([l, h]) => <Item key={l} l={l} h={h} />)}
          <Link href="/customer-preferences/edit" className="hmenu-item" onClick={() => setOpen(false)}>🇺🇸 United States<Chevron /></Link>
          {user ? <a href="/api/auth/logout" className="hmenu-item">Sign Out</a> : <Link href="/ap/signin" className="hmenu-item" onClick={() => setOpen(false)}>Sign in<Chevron /></Link>}
        </div>
      </nav>
      {open && <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed left-[375px] top-[8px] z-[90] text-[30px] leading-none text-white">×</button>}
    </>
  );
}
