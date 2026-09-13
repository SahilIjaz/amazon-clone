import Link from "next/link";
import Logo from "./Logo";

/** The narrow centered card layout used by Amazon's sign-in, registration and password pages. */
export default function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex flex-col items-center px-4 pb-10 pt-4">
        <Link href="/" aria-label="Amazon" className="mb-4"><Logo dark /></Link>
        <div className={`w-full ${wide ? "max-w-[500px]" : "max-w-[350px]"} rounded-lg border border-[#ddd] px-[26px] py-[20px] text-[13px]`}>{children}</div>
        <div className="mt-8 w-full max-w-[350px] border-t border-line-soft pt-4 text-center text-[11px] text-muted">
          <div className="space-x-4"><Link href="/gp/help/customer/display.html" className="text-link">Conditions of Use</Link><Link href="/gp/help/customer/display.html" className="text-link">Privacy Notice</Link><Link href="/gp/help/customer/display.html" className="text-link">Help</Link></div>
          <p className="mt-2">© 1996-{new Date().getFullYear()}, Amazon.com, Inc. or its affiliates</p>
        </div>
      </div>
    </div>
  );
}

export const LABEL = "mb-0.5 block text-[13px] font-bold";
export const INPUT = "a-input";
export const PRIMARY = "a-button a-button-primary a-button-block h-[31px] text-[13px]";
