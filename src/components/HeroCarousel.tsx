"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Slide = { title: string; sub: string; cta: string; href: string; from: string; to: string; images: string[] };

/** 600px hero banner with arrows and auto-advance; the card grid overlaps its lower half like amazon.com. */
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000); return () => clearInterval(t); }, [slides.length]);
  const s = slides[i]!;
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);
  return (
    <div className="relative h-[600px] w-full overflow-hidden" aria-roledescription="carousel">
      <div className="absolute inset-0 transition-colors duration-700" style={{ background: `linear-gradient(120deg, ${s.from} 0%, ${s.to} 100%)` }} />
      <div className="container-amz relative flex h-[380px] items-center justify-between">
        <div className="max-w-[520px] text-white">
          <p className="text-[14px] font-bold uppercase tracking-[.2em] opacity-90">{s.sub}</p>
          <h1 className="mt-2 text-[44px] font-bold leading-[1.05] drop-shadow-sm">{s.title}</h1>
          <Link href={s.href} className="a-button a-button-primary a-button-pill mt-6 hover:no-underline">{s.cta}</Link>
        </div>
        <div className="hidden items-end gap-4 md:flex">
          {s.images.map((src, k) => <div key={src} className={`relative rounded-md bg-white/90 p-3 shadow-xl ${k === 1 ? "h-[260px] w-[260px]" : "h-[200px] w-[200px]"}`}><Image src={src} alt="" fill sizes="260px" className="object-contain p-3 mix-blend-multiply" /></div>)}
        </div>
      </div>
      <div className="hero-fade absolute inset-x-0 bottom-0 h-[220px]" />
      <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute left-0 top-0 h-[380px] w-[80px] text-white/90 hover:outline hover:outline-2 hover:outline-white/70"><span className="text-[54px] font-thin">‹</span></button>
      <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute right-0 top-0 h-[380px] w-[80px] text-white/90 hover:outline hover:outline-2 hover:outline-white/70"><span className="text-[54px] font-thin">›</span></button>
    </div>
  );
}
