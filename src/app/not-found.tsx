import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[700px] px-5 py-16 text-center">
      <h1 className="text-[26px] font-normal">Looking for something?</h1>
      <p className="mt-2 text-[14px]">We&apos;re sorry. The Web address you entered is not a functioning page on our site.</p>
      <p className="mt-4 text-[14px]"><Link href="/" className="a-button a-button-primary a-button-pill hover:no-underline">Go to Amazon.com&apos;s Home Page</Link></p>
      <p className="mt-6 text-[60px]">🐕</p>
      <p className="text-[12px] text-muted">Sorry! Something went wrong on our end.</p>
    </div>
  );
}
