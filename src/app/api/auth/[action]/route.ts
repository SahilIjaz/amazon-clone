import { NextRequest, NextResponse } from "next/server";
import { checkPassword, clearSession, consumeCode, currentUser, hashPassword, issueCode, setSessionCookie, userByEmail } from "@/lib/auth";
import { db, uid } from "@/lib/db";
import { mergeGuestCart } from "@/lib/cart";

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const safeReturn = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action === "logout") { await clearSession(); return NextResponse.redirect(new URL("/", req.url)); }
  return bad("Unknown action", 404);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  let b: Record<string, string> = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const email = (b.email || "").trim().toLowerCase();
  const d = await db();
  switch (action) {
    case "lookup": {
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return bad("Enter a valid email address.");
      return NextResponse.json({ ok: true, exists: !!(await userByEmail(email)) });
    }
    case "register": {
      const name = (b.name || "").trim();
      if (!name) return bad("Enter your name.");
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return bad("Enter a valid email address.");
      if ((b.password || "").length < 6) return bad("Passwords must be at least 6 characters.");
      const existing = await userByEmail(email);
      if (existing?.email_verified) return bad("You indicated you're a new customer, but an account already exists with that email. Sign in instead.");
      if (existing) await d.prepare("UPDATE users SET name=?, password_hash=? WHERE id=?").run(name, hashPassword(b.password!), existing.id);
      else await d.prepare("INSERT INTO users (id,email,password_hash,name) VALUES (?,?,?,?)").run(uid(), email, hashPassword(b.password!), name);
      const delivery = await issueCode(email, "signup");
      return NextResponse.json({ ok: true, delivery });
    }
    case "resend": { if (!email) return bad("Missing email"); const delivery = await issueCode(email, "signup"); return NextResponse.json({ ok: true, delivery }); }
    case "verify": {
      const u = await userByEmail(email);
      if (!u || !(await consumeCode(email, String(b.code || ""), "signup"))) return bad("The OTP you entered is invalid or has expired.");
      await d.prepare("UPDATE users SET email_verified=1 WHERE id=?").run(u.id);
      await setSessionCookie(u.id);
      await mergeGuestCart(u);
      await d.prepare("INSERT INTO lists (id,user_id,name,is_default) SELECT ?,?, 'Shopping List', 1 WHERE NOT EXISTS (SELECT 1 FROM lists WHERE user_id=?)").run(uid(), u.id, u.id);
      return NextResponse.json({ ok: true, next: safeReturn(b.returnTo) });
    }
    case "login": {
      const u = await userByEmail(email);
      if (!u || !checkPassword(b.password || "", u.password_hash)) return bad("Your password is incorrect", 401);
      if (!u.email_verified) { const delivery = await issueCode(email, "signup"); return NextResponse.json({ ok: false, needsVerification: true, delivery }, { status: 403 }); }
      await setSessionCookie(u.id);
      await mergeGuestCart(u);
      return NextResponse.json({ ok: true, next: safeReturn(b.returnTo) });
    }
    case "forgot": {
      const u = await userByEmail(email);
      if (!u) return bad("We cannot find an account with that email address.");
      const delivery = await issueCode(email, "recovery");
      return NextResponse.json({ ok: true, delivery });
    }
    case "reset": {
      const u = await userByEmail(email);
      if (!u || !(await consumeCode(email, String(b.code || ""), "recovery"))) return bad("The OTP you entered is invalid or has expired.");
      if ((b.password || "").length < 6) return bad("Passwords must be at least 6 characters.");
      await d.prepare("UPDATE users SET password_hash=?, email_verified=1 WHERE id=?").run(hashPassword(b.password!), u.id);
      return NextResponse.json({ ok: true });
    }
    case "profile": {
      const u = await currentUser(); if (!u) return bad("Unauthorized", 401);
      const name = (b.name || "").trim(); if (!name) return bad("Enter your name.");
      await d.prepare("UPDATE users SET name=?, phone=? WHERE id=?").run(name, (b.phone || "").trim() || null, u.id);
      return NextResponse.json({ ok: true });
    }
    case "password": {
      const u = await currentUser(); if (!u) return bad("Unauthorized", 401);
      if (!checkPassword(b.current || "", u.password_hash)) return bad("Your current password is incorrect.");
      if ((b.password || "").length < 6) return bad("Passwords must be at least 6 characters.");
      await d.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(b.password!), u.id);
      return NextResponse.json({ ok: true });
    }
    default: return bad("Unknown action", 404);
  }
}
