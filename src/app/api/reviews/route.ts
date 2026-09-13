import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, uid } from "@/lib/db";
import { product } from "@/lib/products";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to write a review" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { productId?: number; rating?: number; title?: string; body?: string };
  const p = product(b.productId || 0);
  const rating = Math.round(Number(b.rating));
  if (!p || rating < 1 || rating > 5 || !(b.title || "").trim() || (b.body || "").trim().length < 10) return NextResponse.json({ ok: false, error: "Add a star rating, a headline and at least a short review." }, { status: 400 });
  await (await db()).prepare("INSERT INTO reviews (id,user_id,product_id,rating,title,body) VALUES (?,?,?,?,?,?)").run(uid(), user.id, p.id, rating, b.title!.trim(), b.body!.trim());
  return NextResponse.json({ ok: true });
}
