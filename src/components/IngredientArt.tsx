import type { JSX } from "react";
import type { IngredientKey } from "../data/sticks";

// Hand-drawn SVG per Ingredient (emoji don't exist for most of these and look
// different on every phone). All share a 200×200 canvas with a soft shadow.

function Shadow({ y = 172, rx = 70 }: { y?: number; rx?: number }) {
  return <ellipse cx={100} cy={y} rx={rx} ry={10} fill="#5b0a14" opacity={0.18} />;
}

function Cheese() {
  return (
    <>
      <Shadow />
      <g stroke="#c98a00" strokeWidth={2.5} strokeLinejoin="round">
        {/* rind side */}
        <path d="M150 62 L178 96 L178 150 L150 118 Z" fill="#f0a800" />
        {/* front */}
        <path d="M26 128 L178 96 L178 150 L26 168 Z" fill="#ffc81e" />
        {/* top */}
        <path d="M26 128 L150 62 L178 96 Z" fill="#ffe066" />
        {/* melty drip */}
        <path
          d="M84 158 C84 168 82 178 88 182 C94 186 98 176 97 166 L98 156 Z"
          fill="#ffc81e"
          strokeWidth={0}
        />
      </g>
      <g fill="#e0a000">
        <ellipse cx={66} cy={145} rx={9} ry={7} />
        <ellipse cx={122} cy={128} rx={12} ry={9} />
        <ellipse cx={156} cy={140} rx={6} ry={5} />
        <ellipse cx={104} cy={150} rx={5} ry={4} />
      </g>
      <g fill="#f2c430">
        <ellipse cx={112} cy={95} rx={10} ry={4} />
        <ellipse cx={78} cy={112} rx={6} ry={3} />
        <ellipse cx={142} cy={82} rx={5} ry={2.5} />
      </g>
      <path d="M36 128 L148 70" stroke="#fff6c0" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    </>
  );
}

function Sausage() {
  return (
    <>
      <defs>
        <linearGradient id="sausage" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2563f" />
          <stop offset="0.5" stopColor="#b8321f" />
          <stop offset="1" stopColor="#7e1e12" />
        </linearGradient>
      </defs>
      <Shadow />
      <g transform="rotate(-20 100 96)">
        <circle cx={26} cy={100} r={6} fill="#7e1e12" />
        <circle cx={174} cy={100} r={6} fill="#7e1e12" />
        <rect x={28} y={78} width={144} height={44} rx={22} fill="url(#sausage)" />
        <rect x={46} y={85} width={100} height={8} rx={4} fill="#fff" opacity={0.35} />
        <g stroke="#5e140b" strokeWidth={4} strokeLinecap="round" opacity={0.55}>
          <path d="M70 84 L60 116" />
          <path d="M100 82 L90 118" />
          <path d="M130 84 L120 116" />
        </g>
      </g>
      {[
        { x: 66, y: 150 },
        { x: 110, y: 158 },
      ].map(({ x, y }) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 6} rx={24} ry={18} fill="#7e1e12" />
          <ellipse cx={x} cy={y} rx={24} ry={18} fill="#b8321f" />
          <ellipse cx={x} cy={y} rx={19} ry={14} fill="#f29b8e" />
          <circle cx={x - 7} cy={y - 3} r={2} fill="#ffd3c9" />
          <circle cx={x + 6} cy={y + 4} r={1.6} fill="#ffd3c9" />
          <circle cx={x + 3} cy={y - 6} r={1.4} fill="#d96d5e" />
        </g>
      ))}
    </>
  );
}

function CrabStick() {
  const sticks = [
    { y: 74, peel: true },
    { y: 116, peel: false },
  ];
  return (
    <>
      <defs>
        <linearGradient id="crab" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e8432a" />
          <stop offset="0.45" stopColor="#ff6a3d" />
          <stop offset="0.62" stopColor="#ff6a3d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Shadow />
      <g transform="rotate(-18 100 100)">
        {sticks.map(({ y, peel }) => (
          <g key={y}>
            {peel && (
              <g strokeLinecap="round" fill="none">
                <path d={`M34 ${y + 8} q-14 -10 -20 -26`} stroke="#ff6a3d" strokeWidth={6} />
                <path d={`M34 ${y + 16} q-18 -2 -28 -14`} stroke="#fff3ea" strokeWidth={6} />
                <path d={`M34 ${y + 24} q-16 6 -24 2`} stroke="#ffb59c" strokeWidth={6} />
              </g>
            )}
            <rect x={30} y={y} width={146} height={34} rx={17} fill="#fff8f2" stroke="#e8d3c2" strokeWidth={2} />
            <rect x={30} y={y} width={146} height={34} rx={17} fill="url(#crab)" />
            <path d={`M50 ${y + 24} H156`} stroke="#ecdccd" strokeWidth={2} strokeLinecap="round" />
            <path d={`M56 ${y + 29} H150`} stroke="#ecdccd" strokeWidth={2} strokeLinecap="round" />
            <ellipse cx={168} cy={y + 17} rx={8} ry={16} fill="#fff3ea" stroke="#e8d3c2" strokeWidth={2} />
            <path d={`M168 ${y + 3} a7 14 0 0 1 0 14 a4 7 0 0 0 0 -7`} stroke="#ff6a3d" strokeWidth={2.5} fill="none" />
          </g>
        ))}
      </g>
    </>
  );
}

function Seaweed() {
  return (
    <>
      <defs>
        <linearGradient id="nori" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3a6b45" />
          <stop offset="0.5" stopColor="#1f3d29" />
          <stop offset="1" stopColor="#13281a" />
        </linearGradient>
        <linearGradient id="nori-sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0.25" stopColor="#9fd0a8" stopOpacity="0" />
          <stop offset="0.4" stopColor="#9fd0a8" stopOpacity="0.35" />
          <stop offset="0.55" stopColor="#9fd0a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Shadow />
      {[
        "M54 118 Q108 96 162 102 Q172 128 186 152 Q130 160 76 176 Q70 146 54 118 Z",
        "M28 96 Q84 70 140 70 Q152 98 172 124 Q114 134 58 152 Q48 122 28 96 Z",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} fill="url(#nori)" stroke="#0e1f14" strokeWidth={2} strokeLinejoin="round" />
          <path d={d} fill="url(#nori-sheen)" />
        </g>
      ))}
      <g stroke="#ffffff" strokeOpacity={0.08} strokeWidth={1.5}>
        <path d="M50 100 L150 82" />
        <path d="M58 116 L156 96" />
        <path d="M64 132 L162 112" />
      </g>
      <g fill="none" stroke="#2c5a37" strokeWidth={5} strokeLinecap="round">
        <path d="M78 96 q10 -18 26 -10 t22 -6" />
        <path d="M98 110 q14 -12 28 -4" />
      </g>
      <g fill="#fff1d0">
        <ellipse cx={90} cy={104} rx={3} ry={1.8} transform="rotate(-20 90 104)" />
        <ellipse cx={122} cy={92} rx={3} ry={1.8} transform="rotate(30 122 92)" />
        <ellipse cx={108} cy={124} rx={3} ry={1.8} transform="rotate(10 108 124)" />
        <ellipse cx={70} cy={120} rx={3} ry={1.8} transform="rotate(-40 70 120)" />
      </g>
    </>
  );
}

const ART: Record<IngredientKey, () => JSX.Element> = {
  cheese: Cheese,
  sausage: Sausage,
  crabStick: CrabStick,
  seaweed: Seaweed,
};

export function IngredientArt({ ingredient, label }: { ingredient: IngredientKey; label: string }) {
  const Art = ART[ingredient];
  return (
    <svg className="ingredient-art" viewBox="0 0 200 200" role="img" aria-label={label}>
      <Art />
    </svg>
  );
}
