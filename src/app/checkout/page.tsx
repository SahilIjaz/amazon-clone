import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import CheckoutForm from "@/components/CheckoutForm";
import { currentUser } from "@/lib/auth";
import { cartLines, currentCartId } from "@/lib/cart";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export type Address = { id: string; full_name: string; phone: string | null; line1: string; line2: string | null; city: string; state: string; zip: string; country: string; is_default: number };
export type Card = { id: string; brand: string; last4: string; name_on_card: string; exp_month: number; exp_year: number; is_default: number };

export default async function Checkout() {
  const user = await currentUser();
  if (!user) redirect("/ap/signin?returnTo=/checkout");
  const lines = (await cartLines(await currentCartId(user))).filter((l) => !l.saved);
  if (!lines.length) redirect("/cart");
  const d = await db();
  const addresses = await d.prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, created_at").all<Address>(user.id);
  const cards = await d.prepare("SELECT * FROM payment_methods WHERE user_id=? ORDER BY is_default DESC, created_at").all<Card>(user.id);
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-line bg-[#f0f2f2]"><div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2"><Link href="/" aria-label="Amazon"><Logo dark /></Link><span className="text-[26px] font-normal">Checkout <span className="text-[14px] text-muted">({lines.reduce((s, l) => s + l.qty, 0)} items)</span></span><Link href="/cart" className="text-muted" aria-label="Cart">🔒</Link></div></div>
      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <CheckoutForm user={{ name: user.name, email: user.email, prime: !!user.prime }} lines={lines.map((l) => ({ id: l.product.id, title: l.product.title, price: l.product.price, qty: l.qty, thumb: l.product.thumb, prime: l.product.prime }))} addresses={addresses} cards={cards} />
      </div>
    </div>
  );
}
