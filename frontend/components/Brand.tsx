export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#f5d27a" />
          <stop offset="55%" stopColor="#c69a2c" />
          <stop offset="100%" stopColor="#7a5c14" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="#070b1a" stroke="url(#g1)" strokeWidth="1.5" />
      <path
        d="M14 44 L14 22 L24 22 L32 34 L40 22 L50 22 L50 44 L42 44 L42 32 L34 44 L30 44 L22 32 L22 44 Z"
        fill="url(#g1)"
      />
    </svg>
  );
}

export function BrandWord({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      <span className="text-ink-100">My</span>
      <span className="bg-gold-sheen bg-clip-text text-transparent">Person</span>
      <span className="text-ink-100">Wallets</span>
    </span>
  );
}
