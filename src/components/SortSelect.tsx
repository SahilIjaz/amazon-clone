"use client";
import { useRouter, useSearchParams } from "next/navigation";

const SORTS: [string, string][] = [["featured", "Featured"], ["price-asc", "Price: Low to High"], ["price-desc", "Price: High to Low"], ["review", "Avg. Customer Review"], ["newest", "Newest Arrivals"], ["bestsellers", "Best Sellers"]];

/** "Sort by: Featured ▾" dropdown that rewrites the query string. */
export default function SortSelect() {
  const router = useRouter(); const sp = useSearchParams();
  const current = sp.get("sort") || "featured";
  return (
    <label className="a-select inline-flex h-[29px] items-center gap-1 pr-1 text-[12px]">
      <span>Sort by:</span>
      <select value={current} onChange={(e) => { const u = new URLSearchParams(sp.toString()); u.set("sort", e.target.value); u.delete("page"); router.push(`/s?${u.toString()}`); }} className="bg-transparent font-normal outline-none" aria-label="Sort by">
        {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}
