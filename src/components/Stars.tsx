const Star = ({ fill }: { fill: string }) => (
  <svg viewBox="0 0 80 16" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => <path key={i} transform={`translate(${i * 16} 0)`} d="M8 1.2l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.5l-4.2 2.3 1-4.6L1.3 6l4.7-.5z" fill={fill} stroke="#de7921" strokeWidth=".9" strokeLinejoin="round" />)}
  </svg>
);

/** Amazon-style rating stars: rounded to halves, orange fill on outlined stars. */
export default function Stars({ rating, small = false, className = "" }: { rating: number; small?: boolean; className?: string }) {
  const pct = Math.max(0, Math.min(100, (Math.round(rating * 2) / 2 / 5) * 100));
  return (
    <span className={`stars ${small ? "stars-sm" : ""} ${className}`} title={`${rating.toFixed(1)} out of 5 stars`}>
      <Star fill="#fff" />
      <span className="fill" style={{ width: `${pct}%` }}><Star fill="#de7921" /></span>
    </span>
  );
}
