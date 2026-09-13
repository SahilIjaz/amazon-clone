import Link from "next/link";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import AccountMenu from "./AccountMenu";
import AllMenu from "./AllMenu";
import { currentUser } from "@/lib/auth";
import { cartCount, currentCartId } from "@/lib/cart";

const NAV_LINKS: [string, string][] = [["Prime Video", "/gp/help/customer/display.html"], ["Coupons", "/deals"], ["Customer Service", "/gp/help/customer/display.html"], ["Today's Deals", "/deals"], ["Registry", "/hz/wishlist/ls"], ["Gift Cards", "/s?k=gift"], ["Sell", "/gp/help/customer/display.html"]];

/** Amazon's two-row header: 60px belt (logo, location, search, account, orders, cart) and 39px navigation strip. */
export default async function Header() {
  const user = await currentUser();
  const count = await cartCount(await currentCartId(user));
  const first = user ? user.name.split(" ")[0] : null;
  return (
    <header id="top" className="sticky top-0 z-50 text-white">
      <div className="flex h-[60px] items-center bg-nav px-[5px]">
        <Link href="/" className="nav-item h-[50px] px-[6px] pt-[5px]" aria-label="Amazon.com"><Logo /></Link>
        <Link href="/your-account/addresses" className="nav-item hidden lg:inline-flex">
          <span className="flex items-end gap-0.5"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="mb-0.5" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg><span><span className="nav-line-1 block">Deliver to {first ?? ""}</span><span className="nav-line-2 block">{user ? "New York 10001" : "United States"}</span></span></span>
        </Link>
        <SearchBar />
        <Link href="/customer-preferences/edit" className="nav-item hidden md:inline-flex"><span className="flex items-center gap-1"><span className="inline-block h-[13px] w-[20px] bg-[linear-gradient(#b22234_0_15%,#fff_15%_30%,#b22234_30%_45%,#fff_45%_60%,#b22234_60%_75%,#fff_75%_90%,#b22234_90%)] relative overflow-hidden"><span className="absolute left-0 top-0 h-[55%] w-[45%] bg-[#3c3b6e]" /></span><span className="nav-line-2 font-bold">EN</span><span className="nav-caret" /></span></Link>
        <AccountMenu user={user ? { name: user.name } : null} />
        <Link href={user ? "/gp/css/order-history" : "/ap/signin?returnTo=/gp/css/order-history"} className="nav-item"><span className="nav-line-1">{user ? "Returns" : "Returns"}</span><span className="nav-line-2">& Orders</span></Link>
        <Link href="/cart" className="nav-item flex-row items-end gap-1" aria-label={`Cart, ${count} items`}>
          <span className="relative block">
            <svg width="40" height="34" viewBox="0 0 40 34" aria-hidden="true"><path d="M3 4h5l5 18h18l4-12H11" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" /><circle cx="15" cy="28" r="2.6" fill="#fff" /><circle cx="29" cy="28" r="2.6" fill="#fff" /></svg>
            <span className="absolute left-[15px] top-[-2px] w-[16px] text-center text-[16px] font-bold leading-[16px] text-[#f08804]">{count}</span>
          </span>
          <span className="nav-line-2 pb-1">Cart</span>
        </Link>
      </div>
      <div className="flex h-[39px] items-center bg-nav2 pl-[11px]">
        <AllMenu user={user ? { name: user.name } : null} />
        {NAV_LINKS.map(([l, h]) => <Link key={l} href={h} className="nav-a hidden md:inline-block">{l}</Link>)}
        <Link href="/deals" className="nav-a ml-auto mr-2 hidden lg:inline-block font-bold">Shop deals in Electronics</Link>
      </div>
    </header>
  );
}
