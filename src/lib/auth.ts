import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, uid } from "./db";
import { codeEmail, sendMail, type MailDelivery } from "./mail";

export type User = { id: string; email: string; password_hash: string | null; name: string; phone: string | null; email_verified: number; prime: number; created_at: string };

const COOKIE = "az_session";
export const CART_COOKIE = "az_cart";

export function hashPassword(p: string) { return bcrypt.hashSync(p, 10); }
export function checkPassword(p: string, hash: string | null) { return !!hash && bcrypt.compareSync(p, hash); }

export async function setSessionCookie(userId: string) {
  const token = uid() + uid().replace(/-/g, "");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await (await db()).prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)").run(token, userId, expires.toISOString());
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", expires });
}

export async function clearSession() {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (t) await (await db()).prepare("DELETE FROM sessions WHERE token=?").run(t);
  c.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (!t) return null;
  const row = await (await db()).prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > datetime('now')`).get<User>(t);
  return row ?? null;
}

export async function userByEmail(email: string): Promise<User | null> {
  return (await (await db()).prepare("SELECT * FROM users WHERE lower(email)=lower(?)").get<User>(email)) ?? null;
}

/** 6-digit one-time password, e-mailed (or kept in the local outbox when no mail provider is configured). */
export async function issueCode(email: string, purpose: "signup" | "recovery" | "signin" = "signup"): Promise<MailDelivery> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const d = await db();
  await d.prepare("UPDATE verification_codes SET used=1 WHERE email=? AND purpose=?").run(email, purpose);
  await d.prepare("INSERT INTO verification_codes (email,code,purpose,expires_at) VALUES (?,?,?,datetime('now','+15 minutes'))").run(email, code, purpose);
  const m = codeEmail(code, purpose);
  return sendMail(email, m.subject, m.text, m.html);
}

export async function consumeCode(email: string, code: string, purpose = "signup") {
  const d = await db();
  const row = await d.prepare("SELECT id FROM verification_codes WHERE email=? AND code=? AND purpose=? AND used=0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1").get<{ id: number }>(email, code, purpose);
  if (!row) return false;
  await d.prepare("UPDATE verification_codes SET used=1 WHERE id=?").run(row.id);
  return true;
}
