import Link from "next/link";
import Logo from "./Logo";

const COLS = [
  { head: "Get to Know Us", links: ["Careers", "Blog", "About Amazon", "Investor Relations", "Amazon Devices", "Amazon Science"] },
  { head: "Make Money with Us", links: ["Sell products on Amazon", "Sell on Amazon Business", "Sell apps on Amazon", "Become an Affiliate", "Advertise Your Products", "Self-Publish with Us", "Host an Amazon Hub", "See More Make Money with Us"] },
  { head: "Amazon Payment Products", links: ["Amazon Business Card", "Shop with Points", "Reload Your Balance", "Amazon Currency Converter"] },
  { head: "Let Us Help You", links: [["Your Account", "/your-account"], ["Your Orders", "/gp/css/order-history"], ["Shipping Rates & Policies", "/gp/help/customer/display.html"], ["Returns & Replacements", "/gp/help/customer/display.html"], ["Manage Your Content and Devices", "/your-account"], ["Help", "/gp/help/customer/display.html"]] as (string | [string, string])[] },
];

const BOTTOM = [
  ["Amazon Music", "Stream millions of songs"], ["Amazon Ads", "Reach customers wherever they spend their time"], ["6pm", "Score deals on fashion brands"], ["AbeBooks", "Books, art & collectibles"], ["ACX", "Audiobook Publishing Made Easy"], ["Sell on Amazon", "Start a Selling Account"], ["Veeqo", "Shipping Software Inventory Management"],
  ["Amazon Business", "Everything For Your Business"], ["AmazonGlobal", "Ship Orders Internationally"], ["Amazon Web Services", "Scalable Cloud Computing Services"], ["Audible", "Listen to Books & Original Audio Performances"], ["Box Office Mojo", "Find Movie Box Office Data"], ["Goodreads", "Book reviews & recommendations"], ["IMDb", "Movies, TV & Celebrities"],
  ["IMDbPro", "Get Info Entertainment Professionals Need"], ["Kindle Direct Publishing", "Indie Digital & Print Publishing Made Easy"], ["Prime Video Direct", "Video Distribution Made Easy"], ["Shopbop", "Designer Fashion Brands"], ["Woot!", "Deals and Shenanigans"], ["Zappos", "Shoes & Clothing"], ["Ring", "Smart Home Security Systems"],
  ["eero WiFi", "Stream 4K Video in Every Room"], ["Blink", "Smart Security for Every Home"], ["Neighbors App", "Real-Time Crime & Safety Alerts"], ["Amazon Subscription Boxes", "Top subscription boxes – right to your door"], ["PillPack", "Pharmacy Simplified"],
];

export default function Footer() {
  return (
    <footer className="mt-10 text-white">
      <a href="#top" className="block bg-[#37475a] py-[15px] text-center text-[13px] text-white hover:bg-[#485769] hover:no-underline hover:text-white">Back to top</a>
      <div className="bg-footer">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-x-6 gap-y-8 px-4 pb-10 pt-11 md:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.head}>
              <h3 className="mb-3 text-[16px] font-bold leading-[1.05]">{c.head}</h3>
              <ul className="space-y-[7px]">{c.links.map((l) => { const [label, href] = Array.isArray(l) ? l : [l, "/gp/help/customer/display.html"]; return <li key={label}><Link href={href} className="text-[14px] leading-[1.2] text-[#ddd] hover:underline hover:text-[#ddd]">{label}</Link></li>; })}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#3a4553]">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-5 py-7 md:flex-row md:justify-center md:gap-12">
            <Link href="/" aria-label="Amazon home"><Logo /></Link>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
              <span className="rounded-sm border border-[#848688] px-3 py-1.5 text-[#ccc]">🌐 English</span>
              <span className="rounded-sm border border-[#848688] px-3 py-1.5 text-[#ccc]">$ USD - U.S. Dollar</span>
              <span className="rounded-sm border border-[#848688] px-3 py-1.5 text-[#ccc]">🇺🇸 United States</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-footer-dark">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-x-6 gap-y-4 px-4 py-8 sm:grid-cols-4 lg:grid-cols-7">
          {BOTTOM.map(([a, b]) => <Link key={a} href="/gp/help/customer/display.html" className="text-[11px] leading-[1.25] text-[#ddd] hover:underline hover:text-[#ddd]"><span className="block">{a}</span><span className="block text-[#999]">{b}</span></Link>)}
        </div>
        <div className="pb-8 text-center text-[11px] text-[#ddd]">
          <div className="space-x-3"><Link href="/gp/help/customer/display.html" className="text-[#ddd] hover:underline">Conditions of Use</Link><Link href="/gp/help/customer/display.html" className="text-[#ddd] hover:underline">Privacy Notice</Link><Link href="/gp/help/customer/display.html" className="text-[#ddd] hover:underline">Consumer Health Data Privacy Disclosure</Link><Link href="/gp/help/customer/display.html" className="text-[#ddd] hover:underline">Your Ads Privacy Choices</Link></div>
          <div className="mt-2">© 1996-{new Date().getFullYear()}, Amazon.com, Inc. or its affiliates</div>
        </div>
      </div>
    </footer>
  );
}
