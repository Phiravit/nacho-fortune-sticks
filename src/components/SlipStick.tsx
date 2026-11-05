/** The pulled Stick, lying sideways across the top of its Slip with its number painted large. */
export function SlipStick({ number, label }: { number: number; label: string }) {
  return (
    <svg viewBox="0 0 360 84" role="img" aria-label={label}>
      <defs>
        <linearGradient id="slip-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6dba6" />
          <stop offset="0.45" stopColor="#e3b46e" />
          <stop offset="1" stopColor="#a56c2c" />
        </linearGradient>
        <linearGradient id="slip-tip" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f0444b" />
          <stop offset="1" stopColor="#8d0d18" />
        </linearGradient>
      </defs>
      <rect x={4} y={12} width={352} height={60} rx={12} fill="url(#slip-wood)" stroke="#7d4f17" strokeWidth={2} />
      <path d="M296 12 H344 A12 12 0 0 1 356 24 V60 A12 12 0 0 1 344 72 H296 Z" fill="url(#slip-tip)" />
      <g stroke="#a56c2c" strokeWidth={1.5} opacity={0.45} strokeLinecap="round">
        <path d="M20 30 H86" />
        <path d="M30 52 H92" />
        <path d="M214 28 H282" />
        <path d="M222 54 H284" />
      </g>
      <rect x={12} y={17} width={276} height={6} rx={3} fill="#fff" opacity={0.35} />
      <rect x={102} y={15} width={96} height={54} rx={9} fill="#fff4dc" stroke="#a10f1f" strokeWidth={3} />
      <text
        x={150}
        y={43}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={50}
        fontWeight={600}
        fill="#a10f1f"
      >
        {number}
      </text>
    </svg>
  );
}
