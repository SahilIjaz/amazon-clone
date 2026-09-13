"use client";
import { usePathname } from "next/navigation";

/** Amazon strips the site header/footer on sign-in, registration and checkout; everything else keeps them. */
export default function ChromeGate({ header, footer, children }: { header: React.ReactNode; footer: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith("/ap/") || path.startsWith("/checkout");
  return (
    <>
      {!bare && header}
      <main className="min-h-[60vh]">{children}</main>
      {!bare && footer}
    </>
  );
}
