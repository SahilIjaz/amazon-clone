import Image from "next/image";
import Link from "next/link";
import HeroCarousel, { type Slide } from "@/components/HeroCarousel";
import { GridCard } from "@/components/ProductCard";
import { byCategory, CATEGORY_LABEL, deals, productUrl, topRated, type Product } from "@/lib/products";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { product as getProduct } from "@/lib/products";

const SLIDES: Slide[] = [
  { title: "Get your game on", sub: "Gaming and PC", cta: "Shop gaming", href: "/s?k=laptop", from: "#a938fa", to: "#132563", images: ["/products/78-thumb.webp", "/products/79-thumb.webp", "/products/82-thumb.webp"] },
  { title: "Kitchen essentials under $50", sub: "Home & Kitchen", cta: "Shop kitchen", href: "/s?i=Home+%26+Kitchen&priceMax=50", from: "#0f5e56", to: "#2fb39a", images: ["/products/33-thumb.webp", "/products/41-thumb.webp", "/products/49-thumb.webp"] },
  { title: "Shop the latest in fashion", sub: "New arrivals", cta: "Shop fashion", href: "/s?i=Women%27s+Fashion", from: "#7a1f4d", to: "#e2557a", images: ["/products/165-thumb.webp", "/products/169-thumb.webp", "/products/175-thumb.webp"] },
  { title: "Beauty picks you'll love", sub: "Beauty & Personal Care", cta: "Shop beauty", href: "/s?i=Beauty+%26+Personal+Care", from: "#3d2b6b", to: "#c56bb0", images: ["/products/1-thumb.webp", "/products/6-thumb.webp", "/products/9-thumb.webp"] },
];

function QuadCard({ title, items, cta, href }: { title: string; items: { label: string; p: Product }[]; cta: string; href: string }) {
  return (
    <div className="gw-card">
      <h2>{title}</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {items.slice(0, 4).map(({ label, p }) => (
          <Link key={p.id} href={productUrl(p)} className="block text-ink hover:text-ink hover:no-underline">
            <div className="relative h-[116px] w-full bg-white"><Image src={p.thumb} alt={label} fill sizes="150px" className="object-contain p-1" /></div>
            <span className="mt-1 block text-[12px] leading-4 truncate">{label}</span>
          </Link>
        ))}
      </div>
      <Link href={href} className="cta">{cta}</Link>
    </div>
  );
}

function SingleCard({ title, p, cta, href }: { title: string; p: Product; cta: string; href: string }) {
  return (
    <div className="gw-card">
      <h2>{title}</h2>
      <Link href={href} className="relative block h-[280px] w-full bg-white"><Image src={p.images[0] || p.thumb} alt={p.title} fill sizes="300px" className="object-contain p-2" /></Link>
      <Link href={href} className="cta">{cta}</Link>
    </div>
  );
}

function Row({ title, items, href }: { title: string; items: Product[]; href?: string }) {
  return (
    <section className="bg-white p-5">
      <div className="flex items-baseline gap-4"><h2 className="a-section-head">{title}</h2>{href && <Link href={href} className="text-[13px]">See more</Link>}</div>
      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">{items.map((p) => <GridCard key={p.id} p={p} eager />)}</div>
    </section>
  );
}

export default async function Home() {
  const user = await currentUser();
  let history: Product[] = [];
  if (user) {
    const rows = await (await db()).prepare("SELECT product_id FROM browsing_history WHERE user_id=? ORDER BY viewed_at DESC LIMIT 12").all<{ product_id: number }>(user.id);
    history = rows.map((r) => getProduct(r.product_id)!).filter(Boolean);
  }
  const pick = (cat: string, labels: string[]) => byCategory(cat, 4).map((p, i) => ({ label: labels[i] || CATEGORY_LABEL[cat] || cat, p }));
  return (
    <div className="bg-bg pb-8">
      <HeroCarousel slides={SLIDES} />
      <div className="container-amz relative z-10 -mt-[250px] grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SingleCard title="Get your game on" p={byCategory("laptops", 1)[0]!} cta="Shop gaming" href="/s?k=laptop" />
        <QuadCard title="Top categories in Kitchen appliances" items={pick("kitchen-accessories", ["Cooker", "Coffee", "Pots and Pans", "Kettles"])} cta="Explore all products in Kitchen" href="/s?i=Home+%26+Kitchen" />
        <QuadCard title="Shop Fashion for less" items={[...pick("womens-dresses", ["Dresses under $30"]).slice(0, 1), ...pick("tops", ["Tops under $20"]).slice(0, 1), ...pick("womens-bags", ["Bags under $50"]).slice(0, 1), ...pick("womens-shoes", ["Shoes under $40"]).slice(0, 1)]} cta="See all deals" href="/deals" />
        <QuadCard title="Elevate your Electronics" items={[...pick("smartphones", ["Smartphones"]).slice(0, 1), ...pick("tablets", ["Tablets"]).slice(0, 1), ...pick("laptops", ["Laptops"]).slice(0, 1), ...pick("mobile-accessories", ["Accessories"]).slice(0, 1)]} cta="Discover more" href="/s?i=Electronics" />
      </div>
      <div className="container-amz mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <QuadCard title="New home arrivals under $50" items={pick("home-decoration", ["Wall art", "Decor", "Lighting", "Plants"])} cta="Shop the latest from Home" href="/s?i=Home+%26+Kitchen&priceMax=50" />
        <QuadCard title="Gear up to get fit" items={pick("sports-accessories", ["Training", "Balls", "Rackets", "Outdoor"])} cta="Discover more" href="/s?i=Sports+%26+Outdoors" />
        <QuadCard title="Most-loved watches" items={[...pick("mens-watches", ["Men's watches", "Chronographs"]).slice(0, 2), ...pick("womens-watches", ["Women's watches", "Classic"]).slice(0, 2)]} cta="Discover more" href="/s?k=watch" />
        <QuadCard title="Level up your beauty routine" items={[...pick("beauty", ["Makeup", "Mascara"]).slice(0, 2), ...pick("skin-care", ["Skin care"]).slice(0, 1), ...pick("fragrances", ["Fragrances"]).slice(0, 1)]} cta="See more" href="/s?i=Beauty+%26+Personal+Care" />
      </div>
      <div className="container-amz mt-5 space-y-5">
        {history.length > 0 && <Row title="Pick up where you left off" items={history} href="/gp/history" />}
        <Row title="Today's Deals" items={deals().slice(0, 12)} href="/deals" />
        <Row title="Top rated by customers" items={topRated(12)} href="/s?sort=review" />
        <Row title="Groceries and everyday essentials" items={byCategory("groceries", 12)} href="/s?i=Grocery+%26+Gourmet+Food" />
        <Row title="Shop smartphones and accessories" items={[...byCategory("smartphones", 6), ...byCategory("mobile-accessories", 6)]} href="/s?i=Electronics" />
      </div>
      <div className="container-amz mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <QuadCard title="Wireless Tech" items={pick("mobile-accessories", ["Chargers", "Cases", "Audio", "Wearables"])} cta="Discover more" href="/s?k=wireless" />
        <QuadCard title="Finds for Home" items={pick("furniture", ["Sofas", "Beds", "Desks", "Chairs"])} cta="See more" href="/s?k=furniture" />
        <QuadCard title="Ride in style" items={[...pick("motorcycle", ["Motorcycles", "Sport"]).slice(0, 2), ...pick("vehicle", ["Cars", "Classics"]).slice(0, 2)]} cta="Explore all in Automotive" href="/s?i=Automotive" />
        <SingleCard title="Sign in for the best experience" p={byCategory("sunglasses", 1)[0]!} cta={user ? "See your recommendations" : "Sign in securely"} href={user ? "/gp/history" : "/ap/signin"} />
      </div>
    </div>
  );
}
