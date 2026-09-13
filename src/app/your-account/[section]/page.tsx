import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AccountSection from "@/components/AccountSection";

export const dynamic = "force-dynamic";
const TITLES: Record<string, string> = { addresses: "Your Addresses", payments: "Your Payments", security: "Login & security", prime: "Prime membership" };
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> { const { section } = await params; return { title: TITLES[section] || "Your Account" }; }

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!TITLES[section]) notFound();
  const user = await currentUser(); if (!user) redirect(`/ap/signin?returnTo=/your-account/${section}`);
  const d = await db();
  const addresses = await d.prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, created_at").all<{ id: string; full_name: string; phone: string | null; line1: string; line2: string | null; city: string; state: string; zip: string; country: string; is_default: number }>(user.id);
  const cards = await d.prepare("SELECT id, brand, last4, name_on_card, exp_month, exp_year, is_default FROM payment_methods WHERE user_id=? ORDER BY is_default DESC, created_at").all<{ id: string; brand: string; last4: string; name_on_card: string; exp_month: number; exp_year: number; is_default: number }>(user.id);
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-5">
      <p className="text-[12px]"><Link href="/your-account">Your Account</Link> › <span className="text-danger">{TITLES[section]}</span></p>
      <h1 className="text-[28px] font-normal">{TITLES[section]}</h1>
      <AccountSection section={section as "addresses" | "payments" | "security" | "prime"} user={{ name: user.name, email: user.email, phone: user.phone, prime: !!user.prime }} addresses={addresses} cards={cards} />
    </div>
  );
}
