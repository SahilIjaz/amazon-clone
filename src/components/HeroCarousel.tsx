"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Slide = { title: string; sub: string; cta: string; href: string; from: string; to: string; images: string[] };

/**
 * amazon.com's hero: a 600px full-bleed banner whose lower half fades into the grey page so the card grid can overlap it.
 * Product photography is spread across the banner (no boxes) with the headline set directly on the image.
 */
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000); return () => clearInterval(t); }, [slides.length]);
  const s = slides[i]!;
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);
  const spots = [{ left: "44%", top: "40px", size: 250 }, { left: "60%", top: "-10px", size: 330 }, { left: "80%", top: "60px", size: 230 }];
  return (
    <div className="relative h-[600px] w-full overflow-hidden" aria-roledescription="carousel">
      <div className="absolute inset-0 transition-all duration-700" style={{ background: `radial-gradient(900px 420px at 72% 20%, rgba(255,255,255,.35), transparent 60%), linear-gradient(105deg, ${s.from} 0%, ${s.to} 100%)` }} />
      <div className="absolute inset-0 opacity-[.18]" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0 2px, transparent 3px), radial-gradient(circle at 70% 30%, #fff 0 1.5px, transparent 2.5px)", backgroundSize: "140px 140px, 90px 90px" }} aria-hidden="true" />
      {s.images.map((src, k) => (
        <div key={src} className="absolute hidden md:block drop-shadow-[0_30px_40px_rgba(0,0,0,.35)] transition-all duration-700" style={{ left: spots[k]!.left, top: spots[k]!.top, width: spots[k]!.size, height: spots[k]!.size, transform: `rotate(${k === 1 ? 0 : k === 0 ? -6 : 7}deg)` }}>
          <Image src={src} alt="" fill sizes="330px" priority={k === 1} className="object-contain" style={{ mixBlendMode: "normal" }} />
        </div>
      ))}
      <div className="container-amz relative flex h-[380px] items-center">
        <div className="max-w-[560px] text-white">
          <p className="text-[15px] font-bold uppercase tracking-[.18em] drop-shadow">{s.sub}</p>
          <h1 className="mt-2 text-[52px] font-bold leading-[1.02] drop-shadow-md">{s.title}</h1>
          <Link href={s.href} className="a-button a-button-primary a-button-pill mt-6 hover:no-underline">{s.cta}</Link>
        </div>
      </div>
      <div className="hero-fade absolute inset-x-0 bottom-0 h-[260px]" />
      <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute left-0 top-0 h-[380px] w-[80px] text-white/90 hover:outline hover:outline-2 hover:outline-white/70"><span className="text-[54px] font-thin">‹</span></button>
      <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute right-0 top-0 h-[380px] w-[80px] text-white/90 hover:outline hover:outline-2 hover:outline-white/70"><span className="text-[54px] font-thin">›</span></button>
      <div className="absolute bottom-[270px] left-1/2 flex -translate-x-1/2 gap-2" aria-hidden="true">{slides.map((_, k) => <span key={k} className={`h-2 w-2 rounded-full ${k === i ? "bg-white" : "bg-white/40"}`} />)}</div>
    </div>
  );
}
