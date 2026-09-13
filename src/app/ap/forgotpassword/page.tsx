import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ForgotForm from "@/components/ForgotForm";

export const metadata: Metadata = { title: "Password assistance" };

export default async function Forgot({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <AuthShell><ForgotForm presetEmail={sp.email} /></AuthShell>;
}
