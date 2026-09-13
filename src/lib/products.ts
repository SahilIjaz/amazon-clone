import raw from "@/data/products.json";

export type Review = { name: string; rating: number; comment: string; date: string };
export type Product = {
  id: number; slug: string; title: string; brand: string; category: string; department: string;
  price: number; listPrice: number | null; rating: number; reviewCount: number; stock: number;
  description: string; bullets: string[]; tags: string[]; thumb: string; images: string[]; prime: boolean;
  reviews: Review[]; dimensions?: { width: number; height: number; depth: number } | null; sku?: string;
};

export const PRODUCTS = raw as Product[];
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

export const DEPARTMENTS = ["All Departments", "Arts & Crafts", "Automotive", "Baby", "Beauty & Personal Care", "Books", "Boys' Fashion", "Computers", "Deals", "Digital Music", "Electronics", "Girls' Fashion", "Health & Household", "Home & Kitchen", "Industrial & Scientific", "Kindle Store", "Luggage", "Men's Fashion", "Movies & TV", "Music, CDs & Vinyl", "Pet Supplies", "Prime Video", "Software", "Sports & Outdoors", "Tools & Home Improvement", "Toys & Games", "Video Games", "Women's Fashion"];

/** Departments that actually have products in the catalog, with counts. */
export const CATALOG_DEPARTMENTS = Array.from(PRODUCTS.reduce((m, p) => m.set(p.department, (m.get(p.department) || 0) + 1), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

export const CATEGORY_LABEL: Record<string, string> = {
  beauty: "Beauty", fragrances: "Fragrances", "skin-care": "Skin Care", furniture: "Furniture", "home-decoration": "Home Decor", "kitchen-accessories": "Kitchen Accessories", groceries: "Groceries", laptops: "Laptops", smartphones: "Smartphones", tablets: "Tablets", "mobile-accessories": "Mobile Accessories", "mens-shirts": "Men's Shirts", "mens-shoes": "Men's Shoes", "mens-watches": "Men's Watches", "womens-dresses": "Women's Dresses", "womens-shoes": "Women's Shoes", "womens-watches": "Women's Watches", "womens-bags": "Women's Bags", "womens-jewellery": "Women's Jewelry", tops: "Tops", sunglasses: "Sunglasses", "sports-accessories": "Sports Accessories", motorcycle: "Motorcycle", vehicle: "Vehicles",
};

export function product(id: number | string): Product | undefined { return byId.get(Number(id)); }
export function productUrl(p: Product) { return `/dp/${p.id}/${p.slug}`; }
export function money(n: number) { return n.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
export function priceParts(n: number) { const [whole, frac] = n.toFixed(2).split("."); return { whole: Number(whole).toLocaleString("en-US"), frac: frac! }; }
export function discountPct(p: Product) { return p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0; }

export type SortKey = "featured" | "price-asc" | "price-desc" | "review" | "newest" | "bestsellers";
export type SearchParams = { q?: string; dept?: string; category?: string; sort?: SortKey; minRating?: number; prime?: boolean; priceMin?: number; priceMax?: number; brand?: string; page?: number; deals?: boolean };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

function score(p: Product, terms: string[]) {
  if (!terms.length) return 1;
  const hay = { title: p.title.toLowerCase(), brand: p.brand.toLowerCase(), cat: (p.category + " " + CATEGORY_LABEL[p.category] + " " + p.department).toLowerCase(), tags: p.tags.join(" ").toLowerCase(), desc: p.description.toLowerCase() };
  let s = 0;
  for (const t of terms) {
    if (hay.title.includes(t)) s += 10; if (hay.brand.includes(t)) s += 6; if (hay.cat.includes(t)) s += 5; if (hay.tags.includes(t)) s += 4; if (hay.desc.includes(t)) s += 1;
    // singular/plural leniency
    const t2 = t.endsWith("s") ? t.slice(0, -1) : t + "s"; if (hay.title.includes(t2) || hay.cat.includes(t2) || hay.tags.includes(t2)) s += 3;
  }
  return s;
}

export const PAGE_SIZE = 16;

export function search(sp: SearchParams) {
  const terms = norm(sp.q || "");
  let list = PRODUCTS.map((p) => ({ p, s: score(p, terms) })).filter((x) => x.s > 0);
  if (sp.dept && sp.dept !== "All Departments") list = list.filter((x) => x.p.department === sp.dept);
  if (sp.category) list = list.filter((x) => x.p.category === sp.category);
  if (sp.brand) list = list.filter((x) => x.p.brand === sp.brand);
  if (sp.minRating) list = list.filter((x) => x.p.rating >= sp.minRating!);
  if (sp.prime) list = list.filter((x) => x.p.prime);
  if (sp.deals) list = list.filter((x) => !!x.p.listPrice);
  if (sp.priceMin != null) list = list.filter((x) => x.p.price >= sp.priceMin!);
  if (sp.priceMax != null) list = list.filter((x) => x.p.price <= sp.priceMax!);
  const sort = sp.sort || "featured";
  list.sort((a, b) => {
    switch (sort) {
      case "price-asc": return a.p.price - b.p.price;
      case "price-desc": return b.p.price - a.p.price;
      case "review": return b.p.rating - a.p.rating || b.p.reviewCount - a.p.reviewCount;
      case "newest": return b.p.id - a.p.id;
      case "bestsellers": return b.p.reviewCount - a.p.reviewCount;
      default: return b.s - a.s || b.p.reviewCount - a.p.reviewCount;
    }
  });
  const total = list.length;
  const page = Math.max(1, sp.page || 1);
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((x) => x.p);
  const brands = Array.from(new Set(list.map((x) => x.p.brand))).sort().slice(0, 12);
  const categories = Array.from(list.reduce((m, x) => m.set(x.p.category, (m.get(x.p.category) || 0) + 1), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), brands, categories };
}

export function related(p: Product, n = 8) {
  return PRODUCTS.filter((x) => x.id !== p.id && (x.category === p.category || x.department === p.department)).sort((a, b) => (a.category === p.category ? -1 : 1) - (b.category === p.category ? -1 : 1) || b.rating - a.rating).slice(0, n);
}

export function deals() { return PRODUCTS.filter((p) => p.listPrice).sort((a, b) => discountPct(b) - discountPct(a)); }
export function byCategory(cat: string, n = 12) { return PRODUCTS.filter((p) => p.category === cat).slice(0, n); }
export function topRated(n = 12) { return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, n); }

/** Estimated delivery date text like Amazon: "Tuesday, September 22". */
export function deliveryDate(daysFromNow = 2) {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
export function deliveryISO(daysFromNow = 2) { const d = new Date(); d.setDate(d.getDate() + daysFromNow); return d.toISOString(); }
