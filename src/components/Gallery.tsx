"use client";
import { useState } from "react";
import Image from "next/image";

/** Thumbnail strip on the left, large image on the right, like the product page. */
export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex gap-3">
      <ul className="flex flex-col gap-2">
        {images.map((src, k) => <li key={src}><button type="button" onMouseEnter={() => setI(k)} onClick={() => setI(k)} aria-label={`Image ${k + 1}`} className={`relative block h-[46px] w-[46px] rounded-md border bg-white ${k === i ? "border-[#e77600] shadow-[0_0_3px_2px_rgba(228,121,17,.5)]" : "border-line"}`}><Image src={src} alt="" fill sizes="46px" className="object-contain p-1" /></button></li>)}
      </ul>
      <div className="relative h-[480px] flex-1 bg-white"><Image src={images[i]!} alt={title} fill sizes="(min-width: 1024px) 40vw, 100vw" priority className="object-contain" /></div>
    </div>
  );
}
