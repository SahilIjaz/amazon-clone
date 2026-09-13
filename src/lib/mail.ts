import nodemailer from "nodemailer";
import { db } from "./db";

export type MailDelivery = "email" | "outbox";

/**
 * Sends an e-mail over SMTP (SMTP_HOST/PORT/USER/PASS) with nodemailer. A copy is always kept in the local outbox
 * (/dev/inbox) so sign-up and OTP flows can be exercised without a mail provider.
 */
export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<MailDelivery> {
  await (await db()).prepare("INSERT INTO outbox (to_email,subject,text,html) VALUES (?,?,?,?)").run(to, subject, text, html ?? null);
  const from = process.env.MAIL_FROM || "Amazon <no-reply@amazon.local>";
  if (process.env.SMTP_HOST) {
    try {
      const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "1", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
      await transport.sendMail({ from, to, subject, text, html });
      return "email";
    } catch (e) { console.error("[mail] delivery failed, kept in local outbox", e); }
  }
  return "outbox";
}

export const mailConfigured = () => !!process.env.SMTP_HOST;

export function codeEmail(code: string, purpose: "signup" | "recovery" | "signin") {
  const title = purpose === "recovery" ? "Password assistance" : "Verify your new Amazon account";
  const lead = purpose === "recovery"
    ? "To authenticate, please use the following One Time Password (OTP):"
    : purpose === "signin" ? "To sign in, please use the following One Time Password (OTP):" : "To verify your email address, please use the following One Time Password (OTP):";
  const text = `${title}\n\n${lead}\n\n${code}\n\nDon't share this OTP with anyone. Our customer service team will never ask you for your password, OTP, credit card, or banking info.\n\nWe hope to see you again soon.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0F1111"><div style="font-size:28px;font-weight:700;color:#131921">amazon<span style="color:#FF9900">.com</span></div><h1 style="font-size:20px;margin:20px 0 8px">${title}</h1><p style="font-size:14px;line-height:1.5;color:#333">${lead}</p><p style="font-size:34px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p><p style="font-size:13px;color:#555;line-height:1.5">Don't share this OTP with anyone. Our customer service team will never ask you for your password, OTP, credit card, or banking info.</p><p style="font-size:13px;color:#555">We hope to see you again soon.</p></div>`;
  return { subject: `${code} is your Amazon OTP`, text, html };
}
