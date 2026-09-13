import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Language & Currency Settings" };

export default function Preferences() {
  return (
    <div className="mx-auto max-w-[700px] px-5 py-6 text-[14px]">
      <h1 className="text-[28px] font-normal">Language Settings</h1>
      <p className="text-muted">Select the language you prefer for browsing, shopping, and communications.</p>
      <div className="mt-4 space-y-2">{["English - EN", "español - ES", "العربية - AR", "Deutsch - DE", "עברית - HE", "한국어 - KO", "português - PT", "中文 (简体) - ZH", "中文 (繁體) - ZH"].map((l, i) => <label key={l} className="flex items-center gap-2"><input type="radio" name="lang" defaultChecked={i === 0} /> {l}</label>)}</div>
      <h2 className="mt-8 text-[20px] font-bold">Currency Settings</h2>
      <p className="text-muted">Select the currency you want to shop with.</p>
      <select className="a-select mt-2" defaultValue="USD"><option>$ - USD - US Dollar (Default)</option><option>€ - EUR - Euro</option><option>£ - GBP - British Pound</option><option>₨ - PKR - Pakistani Rupee</option></select>
      <div className="mt-6"><Link href="/" className="a-button a-button-primary a-button-pill hover:no-underline">Save Changes</Link> <Link href="/" className="a-button a-button-base a-button-pill ml-2 hover:no-underline">Cancel</Link></div>
    </div>
  );
}
