"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENTS, PRODUCTS } from "@/lib/products";

/** Search box with the department dropdown and Amazon-style suggestions. */
export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("k") || "");
  const [dept, setDept] = useState(sp.get("i") || "All Departments");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setQ(sp.get("k") || ""); }, [sp]);
  useEffect(() => { const f = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);

  const terms = q.trim().toLowerCase();
  const suggestions = terms.length < 2 ? [] : Array.from(new Set([
    ...PRODUCTS.flatMap((p) => p.tags).filter((t) => t.toLowerCase().includes(terms)),
    ...PRODUCTS.map((p) => p.brand).filter((b) => b.toLowerCase().includes(terms)),
    ...PRODUCTS.map((p) => p.title.toLowerCase()).filter((t) => t.includes(terms)).map((t) => t.slice(0, 48)),
  ])).slice(0, 8);

  const go = (term: string) => { setOpen(false); const u = new URLSearchParams({ k: term }); if (dept !== "All Departments") u.set("i", dept); router.push(`/s?${u.toString()}`); };

  return (
    <form ref={box as unknown as React.RefObject<HTMLFormElement>} onSubmit={(e) => { e.preventDefault(); go(sel >= 0 && suggestions[sel] ? suggestions[sel]! : q); }} className="relative mx-2 flex h-[40px] flex-1 rounded-[4px] focus-within:shadow-[0_0_0_3px_#f90]" role="search">
      <label className="sr-only" htmlFor="twotabsearchtextbox">Search Amazon</label>
      <select aria-label="Search in" value={dept} onChange={(e) => setDept(e.target.value)} className="hidden h-full w-[52px] shrink-0 cursor-pointer rounded-l-[4px] border-r border-[#cdcdcd] bg-[#e6e6e6] pl-2 pr-1 text-[12px] text-[#555] hover:bg-[#dadada] md:block">
        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <input id="twotabsearchtextbox" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setSel(-1); }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(suggestions.length - 1, s + 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(-1, s - 1)); } if (e.key === "Escape") setOpen(false); }} placeholder="Search Amazon" autoComplete="off" className="h-full min-w-0 flex-1 rounded-l-[4px] px-[10px] text-[15px] text-[#111] outline-none placeholder:text-[#767676] md:rounded-l-none" />
      <button type="submit" aria-label="Go" className="grid h-full w-[45px] shrink-0 place-items-center rounded-r-[4px] bg-search-btn hover:bg-search-btn-hover">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1111" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
      </button>
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-[2px] rounded-b-md border border-[#bbb] bg-white py-1 text-[15px] text-ink shadow-lg" role="listbox">
          {suggestions.map((s, i) => <li key={s} role="option" aria-selected={i === sel} onMouseDown={() => go(s)} className={`cursor-pointer px-3 py-1.5 ${i === sel ? "bg-[#eee]" : "hover:bg-[#eee]"}`}><span className="text-muted">🔍</span> <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(`(${terms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"), "<b>$1</b>") }} /></li>)}
        </ul>
      )}
    </form>
  );
}
