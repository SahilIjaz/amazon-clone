import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import SignInForm from "@/components/SignInForm";

export const metadata: Metadata = { title: "Sign-In" };

export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <AuthShell><SignInForm returnTo={sp.returnTo || "/"} presetEmail={sp.email} /></AuthShell>;
}
