import { motion, type MotionValue, type Variants } from "motion/react";

// The 2.5D Siam Si: a lacquered cup seen from slightly above so you can look
// into its mouth. Layer order is what sells the depth:
//   back lip → dark interior → sticks → interior shade → cup body → front lip
// The body is drawn over the sticks, so anything below the front rim simply
// disappears "into" the cup.

/**
 * - `shaking`: a tap started a Shake; the cup plays a fixed shake.
 * - `live`: the phone itself is being shaken; the cup follows the phone (via
 *   `sway`) and the sticks swirl for as long as it lasts.
 */
export type CupPhase = "idle" | "shaking" | "live" | "risen" | "pulling";

/** Live offsets from the phone's motion, layered on top of the cup's own animation. */
export interface CupSway {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
}

export const SHAKE_MS = 1500;
export const PULL_MS = 600;

const CX = 160;
const RIM_Y = 190;
const RIM_RX = 100;
const RIM_RY = 28;
const IN_RX = 91;
const IN_RY = 23;
const BASE_Y = 440;
const BASE_RX = 90;
const BASE_RY = 24;

const STICK_W = 13;
const STICK_L = 320;
const STICK_BASE_Y = 425;
const RISE = 125;
const TIP = 34;

/** Fan of sticks in the cup: base x offset, lean in degrees, how much lower it sits. */
export const STICK_LAYOUT = [
  { dx: -14, angle: -12, lift: 10 },
  { dx: 6, angle: -4, lift: 28 },
  { dx: 16, angle: 7, lift: 4 },
  { dx: -4, angle: 13, lift: 18 },
  { dx: -20, angle: -8, lift: 0 },
  { dx: -8, angle: -1, lift: 14 },
  { dx: 10, angle: 3, lift: -2 },
  { dx: 22, angle: 10, lift: 8 },
  { dx: -16, angle: -15, lift: 22 },
  { dx: 4, angle: 15, lift: 30 },
];

// While shaking, the bundle swirls round inside the cup. Each stick's lean
// direction circles the cup's axis: seen from the front its lean swings
// between ±(its own lean), so it never leaves the rim, and it rides up as it
// passes the back and dips as it passes the front. Neighbours start at
// different points of the circle, so the fan looks stirred, not swayed.
const MIN_LEAN = 7;
const LIVE_TURN_MS = 700;

function swirl(i: number, turns: number, frames: number, spinUp: boolean) {
  const { angle } = STICK_LAYOUT[i];
  const lean = Math.max(Math.abs(angle), MIN_LEAN);
  const start = Math.acos(angle / lean) * (i % 2 ? -1 : 1);
  const x: number[] = [];
  const y: number[] = [];
  const rotate: number[] = [];
  for (let k = 0; k < frames; k++) {
    const t = k / (frames - 1);
    const progress = spinUp ? (1 - Math.cos(Math.PI * t)) / 2 : t;
    const a = start + progress * turns * 2 * Math.PI;
    const clatter = Math.sin(Math.PI * t) * ((i * 37 + k * 53) % 7);
    rotate.push(lean * Math.cos(a) - angle);
    x.push(4 * (Math.cos(a) - Math.cos(start)));
    y.push(-8 * (Math.sin(a) - Math.sin(start)) - clatter);
  }
  return { x, y, rotate };
}

/** Tap Shake: two turns that spin up and settle. */
const SWIRL = STICK_LAYOUT.map((_, i) => swirl(i, 2, 31, true));
/** Live Shake: one even turn that starts and ends at rest, looped while the phone shakes. */
const SWIRL_LOOP = STICK_LAYOUT.map((_, i) => swirl(i, 1, 21, false));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rxAt = (y: number) => lerp(RIM_RX, BASE_RX, (y - RIM_Y) / (BASE_Y - RIM_Y));
const ryAt = (y: number) => lerp(RIM_RY, BASE_RY, (y - RIM_Y) / (BASE_Y - RIM_Y));

/** The visible front strip of the (tapered) cup between two heights. */
function band(y1: number, y2: number) {
  const a = rxAt(y1);
  const b = rxAt(y2);
  return `M${CX - a} ${y1} A${a} ${ryAt(y1)} 0 0 0 ${CX + a} ${y1} L${CX + b} ${y2} A${b} ${ryAt(y2)} 0 0 1 ${CX - b} ${y2} Z`;
}

const FRONT_LIP = `M${CX - RIM_RX} ${RIM_Y} A${RIM_RX} ${RIM_RY} 0 0 0 ${CX + RIM_RX} ${RIM_Y} L${CX + IN_RX} ${RIM_Y} A${IN_RX} ${IN_RY} 0 0 1 ${CX - IN_RX} ${RIM_Y} Z`;

const cupVariants: Variants = {
  idle: {
    rotate: 0,
    x: 0,
    y: [0, -6, 0],
    transition: { y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  },
  shaking: {
    rotate: [0, -11, 10, -13, 12, -9, 11, -6, 5, -2, 0],
    x: [0, -10, 10, -12, 12, -9, 9, -5, 3, -1, 0],
    y: [0, -14, -4, -16, -6, -14, -4, -9, -2, 0, 0],
    transition: { duration: SHAKE_MS / 1000, ease: "easeInOut" },
  },
  live: { rotate: 0, x: 0, y: 0, transition: { duration: 0.2 } },
  risen: {
    rotate: 0,
    x: 0,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 12 },
  },
  pulling: { rotate: 0, x: 0, y: [0, 10, 0], transition: { duration: 0.45 } },
};

interface StickCustom {
  i: number;
  chosen: boolean;
}

const AT_REST = { x: 0, y: 0, rotate: 0 };

const stickVariants: Variants = {
  idle: AT_REST,
  shaking: ({ i }: StickCustom) => ({
    ...SWIRL[i],
    transition: { duration: SHAKE_MS / 1000, ease: "linear" },
  }),
  live: ({ i }: StickCustom) => ({
    ...SWIRL_LOOP[i],
    transition: { duration: LIVE_TURN_MS / 1000, ease: "linear", repeat: Infinity },
  }),
  risen: ({ chosen }: StickCustom) =>
    chosen
      ? { ...AT_REST, y: -RISE, transition: { type: "spring", stiffness: 260, damping: 11 } }
      : AT_REST,
  pulling: ({ chosen }: StickCustom) =>
    chosen
      ? { ...AT_REST, y: -1100, transition: { duration: PULL_MS / 1000, ease: [0.55, 0, 0.8, 0.2] } }
      : AT_REST,
};

function stickTransform(i: number) {
  const { dx, angle, lift } = STICK_LAYOUT[i];
  const x = CX + dx - STICK_W / 2;
  const y = STICK_BASE_Y + lift - STICK_L;
  return `translate(${x} ${y}) rotate(${angle} ${STICK_W / 2} ${STICK_L})`;
}

/** Where the pull hint sits: beside the risen stick, just below its tip. */
function hintPosition(i: number) {
  const { dx, angle, lift } = STICK_LAYOUT[i];
  const t = (angle * Math.PI) / 180;
  const along = RISE + STICK_L - 70;
  const bx = CX + dx;
  const by = STICK_BASE_Y + lift;
  return {
    x: bx + along * Math.sin(t) + 14 * Math.cos(t),
    y: by - along * Math.cos(t) + 14 * Math.sin(t),
  };
}

function CupStick({ number }: { number: number | null }) {
  const r = STICK_W / 2;
  return (
    <>
      <rect width={STICK_W} height={STICK_L} rx={r} fill="url(#ss-wood)" stroke="#7d4f17" strokeWidth={0.8} />
      <path d={`M0 ${r} A${r} ${r} 0 0 1 ${STICK_W} ${r} L${STICK_W} ${TIP} L0 ${TIP} Z`} fill="url(#ss-tip)" />
      <rect x={2.2} y={6} width={2.2} height={STICK_L - 14} rx={1.1} fill="#fff" opacity={0.3} />
      {number !== null && (
        <g>
          <rect x={1.5} y={STICK_L - 82} width={STICK_W - 3} height={52} rx={2} fill="#fff4dc" />
          <text
            x={STICK_W / 2}
            y={STICK_L - 50}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="#a10f1f"
          >
            {number}
          </text>
        </g>
      )}
    </>
  );
}

interface SiamSiProps {
  phase: CupPhase;
  /** Which stick in the fan rises (purely visual). */
  chosen: number;
  /** The drawn Stick number, painted low on the chosen stick. */
  stickNumber: number | null;
  label: string;
  sway?: CupSway;
}

const CUP_PIVOT = { transformBox: "view-box", transformOrigin: `${CX}px ${BASE_Y - 10}px` } as const;

export function SiamSi25D({ phase, chosen, stickNumber, label, sway }: SiamSiProps) {
  const order = STICK_LAYOUT.map((_, i) => i).filter((i) => i !== chosen);
  order.push(chosen); // the chosen stick draws over its neighbours
  const hint = hintPosition(chosen);

  return (
    <svg className="cup-svg" viewBox="0 -40 320 515" role="img" aria-label={label}>
      <defs>
        <linearGradient id="ss-lacquer" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4a0610" />
          <stop offset="0.12" stopColor="#8f0f1d" />
          <stop offset="0.3" stopColor="#d42a35" />
          <stop offset="0.5" stopColor="#b5141f" />
          <stop offset="0.78" stopColor="#7c0a17" />
          <stop offset="1" stopColor="#3c040c" />
        </linearGradient>
        <linearGradient id="ss-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7a4b06" />
          <stop offset="0.18" stopColor="#d9a21e" />
          <stop offset="0.32" stopColor="#fff0a8" />
          <stop offset="0.48" stopColor="#f0bf3a" />
          <stop offset="0.78" stopColor="#a8700c" />
          <stop offset="1" stopColor="#5e3a04" />
        </linearGradient>
        <linearGradient id="ss-sheen" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.17" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.26" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.36" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.84" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ss-interior" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7d1020" />
          <stop offset="0.45" stopColor="#3a0610" />
          <stop offset="1" stopColor="#12020a" />
        </linearGradient>
        <linearGradient id="ss-depth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#12020a" stopOpacity="0" />
          <stop offset="0.35" stopColor="#12020a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#12020a" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="ss-wood" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b8803d" />
          <stop offset="0.35" stopColor="#f3d49a" />
          <stop offset="0.65" stopColor="#e0b06a" />
          <stop offset="1" stopColor="#9c672a" />
        </linearGradient>
        <linearGradient id="ss-tip" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8d0d18" />
          <stop offset="0.4" stopColor="#e8333b" />
          <stop offset="1" stopColor="#8d0d18" />
        </linearGradient>
        <linearGradient id="ss-chip" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe07a" />
          <stop offset="1" stopColor="#f0a030" />
        </linearGradient>
        <radialGradient id="ss-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="ss-blur" x="-200%" y="-20%" width="500%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <ellipse cx={CX} cy={BASE_Y + 14} rx={128} ry={20} fill="url(#ss-shadow)" />

      {/* outer: live sway from the phone · inner: the cup's own phase animation */}
      <motion.g style={{ ...CUP_PIVOT, x: sway?.x, y: sway?.y, rotate: sway?.rotate }}>
      <motion.g style={CUP_PIVOT} variants={cupVariants} initial={false} animate={phase}>
        {/* back lip + mouth */}
        <ellipse cx={CX} cy={RIM_Y} rx={RIM_RX} ry={RIM_RY} fill="url(#ss-gold)" />
        <ellipse cx={CX} cy={RIM_Y} rx={IN_RX} ry={IN_RY} fill="url(#ss-interior)" />

        {order.map((i) => {
          const isChosen = i === chosen;
          return (
            <g key={i} transform={stickTransform(i)}>
              <motion.g
                // pivot at the stick's foot, deep in the cup
                style={{ transformOrigin: "50% 100%" }}
                variants={stickVariants}
                custom={{ i, chosen: isChosen } satisfies StickCustom}
                initial={false}
                animate={phase}
              >
                {isChosen && (
                  <motion.g
                    initial={false}
                    animate={phase === "risen" ? { opacity: [0.35, 0.95, 0.35] } : { opacity: 0 }}
                    transition={
                      phase === "risen"
                        ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                  >
                    <rect
                      x={-6}
                      y={-8}
                      width={STICK_W + 12}
                      height={170}
                      rx={12}
                      fill="#ffd54a"
                      filter="url(#ss-blur)"
                    />
                  </motion.g>
                )}
                <CupStick number={isChosen ? stickNumber : null} />
              </motion.g>
            </g>
          );
        })}

        <ellipse cx={CX} cy={RIM_Y} rx={IN_RX} ry={IN_RY} fill="url(#ss-depth)" />

        {/* body */}
        <path d={band(RIM_Y, BASE_Y)} fill="url(#ss-lacquer)" />
        <path d={band(BASE_Y - 14, BASE_Y)} fill="#2e0309" opacity={0.55} />
        <path d={band(RIM_Y + 16, RIM_Y + 30)} fill="url(#ss-gold)" />
        <path d={band(RIM_Y + 35, RIM_Y + 38)} fill="url(#ss-gold)" />
        <path d={band(BASE_Y - 48, BASE_Y - 36)} fill="url(#ss-gold)" />
        <path d={band(BASE_Y - 31, BASE_Y - 28)} fill="url(#ss-gold)" />

        {/* emblem: a nacho chip in a temple medallion */}
        <g transform={`translate(${CX} 318)`}>
          <circle r={47} fill="url(#ss-gold)" />
          <circle r={39} fill="#7d0a17" />
          <circle r={39} fill="none" stroke="#ffe39a" strokeOpacity={0.35} strokeWidth={1.5} />
          <path
            d="M0 -24 L24 18 L-24 18 Z"
            fill="url(#ss-chip)"
            stroke="url(#ss-chip)"
            strokeWidth={9}
            strokeLinejoin="round"
          />
          <circle cx={-6} cy={4} r={3} fill="#d9822b" opacity={0.7} />
          <circle cx={8} cy={10} r={2.4} fill="#d9822b" opacity={0.7} />
          <circle cx={1} cy={-9} r={2} fill="#d9822b" opacity={0.7} />
          <circle cx={-12} cy={15} r={2} fill="#d9822b" opacity={0.6} />
        </g>

        <path d={band(RIM_Y, BASE_Y)} fill="url(#ss-sheen)" />
        <path d={FRONT_LIP} fill="url(#ss-gold)" />

        {/* x/y stay on a wrapper: on a motion element they'd mean transforms */}
        <g transform={`translate(${hint.x} ${hint.y})`} aria-hidden>
          <motion.text
            fontSize={46}
            initial={false}
            animate={
              phase === "risen"
                ? { opacity: [0, 1, 1, 0], y: [26, 0, -22, -34] }
                : { opacity: 0, y: 26 }
            }
            transition={
              phase === "risen"
                ? { duration: 1.3, repeat: Infinity, delay: 0.35, ease: "easeOut" }
                : { duration: 0.15 }
            }
          >
            👆
          </motion.text>
        </g>
      </motion.g>
      </motion.g>
    </svg>
  );
}
