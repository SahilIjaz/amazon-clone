import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Registration" };

export default async function Register({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <AuthShell><RegisterForm presetEmail={sp.email} returnTo={sp.returnTo || "/"} /></AuthShell>;
}
