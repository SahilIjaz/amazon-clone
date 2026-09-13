/** "amazon" wordmark with the smile arrow, drawn as an SVG so no trademark sprite is copied. */
export default function Logo({ className = "", dark = false, suffix = "" }: { className?: string; dark?: boolean; suffix?: string }) {
  const c = dark ? "#0f1111" : "#fff";
  return (
    <svg className={className} viewBox="0 0 120 36" width="120" height="36" aria-label="Amazon" role="img">
      <text x="2" y="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="24" letterSpacing="-1.2" fill={c}>amazon</text>
      <text x="92" y="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="400" fontSize="12" fill={c}>{suffix}</text>
      <path d="M7 27.5c14 8 40 8 60 1" stroke="#ff9900" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M62.5 25.3l5.4 2.6-3.4 4.8" stroke="#ff9900" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
