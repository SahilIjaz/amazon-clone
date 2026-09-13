import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChromeGate from "@/components/ChromeGate";

export const metadata: Metadata = {
  title: { default: "Amazon.com. Spend less. Smile more.", template: "Amazon.com: %s" },
  description: "Free shipping on millions of items. Get the best of Shopping and Entertainment with Prime. Enjoy low prices and great deals on the largest selection of everyday essentials and other products.",
  icons: { icon: "/favicon.ico" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#131921" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-us">
      <body className="min-h-screen bg-bg">
        <ChromeGate header={<Suspense fallback={<div className="h-[99px] bg-nav" />}><Header /></Suspense>} footer={<Footer />}>{children}</ChromeGate>
      </body>
    </html>
  );
}
