import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, uid } from "@/lib/db";

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Addresses and payment methods (demo: only the card's last four digits are stored). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const user = await currentUser(); if (!user) return bad("Unauthorized", 401);
  const b = (await req.json().catch(() => ({}))) as Record<string, string | number>;
  const d = await db();
  switch (action) {
    case "address": {
      if (!b.full_name || !b.line1 || !b.city || !b.zip) return bad("Please fill in the required fields.");
      const id = uid();
      const count = await d.prepare("SELECT COUNT(*) AS n FROM addresses WHERE user_id=?").get<{ n: number }>(user.id);
      await d.prepare("INSERT INTO addresses (id,user_id,full_name,phone,line1,line2,city,state,zip,country,is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id, user.id, String(b.full_name), b.phone ? String(b.phone) : null, String(b.line1), b.line2 ? String(b.line2) : null, String(b.city), String(b.state || "NY"), String(b.zip), "United States", Number(count?.n ?? 0) === 0 ? 1 : 0);
      return NextResponse.json({ ok: true, id });
    }
    case "address-delete": { await d.prepare("DELETE FROM addresses WHERE id=? AND user_id=?").run(String(b.id), user.id); return NextResponse.json({ ok: true }); }
    case "address-default": { await d.prepare("UPDATE addresses SET is_default=CASE WHEN id=? THEN 1 ELSE 0 END WHERE user_id=?").run(String(b.id), user.id); return NextResponse.json({ ok: true }); }
    case "payment": {
      const num = String(b.number || "").replace(/\D/g, "");
      if (num.length < 12 || !b.name_on_card || !b.exp_month || !b.exp_year) return bad("Enter a valid card.");
      const brand = num.startsWith("4") ? "Visa" : num.startsWith("5") ? "Mastercard" : num.startsWith("3") ? "American Express" : "Card";
      const id = uid();
      const count = await d.prepare("SELECT COUNT(*) AS n FROM payment_methods WHERE user_id=?").get<{ n: number }>(user.id);
      await d.prepare("INSERT INTO payment_methods (id,user_id,brand,last4,name_on_card,exp_month,exp_year,is_default) VALUES (?,?,?,?,?,?,?,?)").run(id, user.id, brand, num.slice(-4), String(b.name_on_card), Number(b.exp_month), Number(b.exp_year), Number(count?.n ?? 0) === 0 ? 1 : 0);
      return NextResponse.json({ ok: true, id });
    }
    case "payment-delete": { await d.prepare("DELETE FROM payment_methods WHERE id=? AND user_id=?").run(String(b.id), user.id); return NextResponse.json({ ok: true }); }
    case "prime": { await d.prepare("UPDATE users SET prime=? WHERE id=?").run(b.on ? 1 : 0, user.id); return NextResponse.json({ ok: true }); }
    default: return bad("Unknown action", 404);
  }
}
