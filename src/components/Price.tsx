import { discountPct, money, priceParts, type Product } from "@/lib/products";

/** Amazon's split price: small superscript symbol, big whole, small superscript cents. */
export function Price({ value, size = "md", className = "" }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const { whole, frac } = priceParts(value);
  const big = size === "lg" ? "text-[28px]" : size === "sm" ? "text-[17px]" : "text-[21px]";
  const small = size === "lg" ? "text-[13px] top-[-0.8em]" : size === "sm" ? "text-[10px] top-[-0.6em]" : "text-[12px] top-[-0.7em]";
  return (
    <span className={`inline-flex items-start leading-none text-price ${className}`} aria-label={money(value)}>
      <span className={`relative ${small}`}>$</span><span className={big}>{whole}</span><span className={`relative ${small}`}>{frac}</span>
    </span>
  );
}

export function PriceBlock({ p, size = "md", showDeal = true }: { p: Product; size?: "sm" | "md" | "lg"; showDeal?: boolean }) {
  const pct = discountPct(p);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {showDeal && pct > 0 && <span className="deal-badge">-{pct}%</span>}
      <Price value={p.price} size={size} />
      {p.listPrice && <span className="text-[12px] text-muted">List: <s>{money(p.listPrice)}</s></span>}
    </div>
  );
}
