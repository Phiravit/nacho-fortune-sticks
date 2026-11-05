import { useEffect, useRef, useSyncExternalStore } from "react";

// The phone's real motion drives the Siam Si: every motion sample sways the
// cup on screen, and shaking it long enough makes a Stick rise.
//
// Motion access may need DeviceMotionEvent.requestPermission(): iOS only
// answers it after a tap, so the homepage offers a "turn on phone shake" button
// (and a tap on the cup asks too). Chromium (Android) has the same function but
// grants without a tap.

/** "denied" also covers browsers that allow access but never deliver readings (Brave, desktops). */
export type MotionPermission = "unknown" | "granted" | "denied";

const VERIFY_MS = 2500;

interface PermissionedMotionEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const ask =
  typeof DeviceMotionEvent !== "undefined"
    ? (DeviceMotionEvent as unknown as PermissionedMotionEvent).requestPermission
    : undefined;

let permission: MotionPermission =
  typeof DeviceMotionEvent === "undefined" ? "denied" : ask ? "unknown" : "granted";
let asking = false;
const listeners = new Set<() => void>();

function settle(result: "granted" | "denied") {
  permission = result === "granted" ? "granted" : "denied";
  listeners.forEach((l) => l());
  if (permission === "granted") verifySensor();
}

/**
 * "Granted" isn't proof: Brave on Android and desktop browsers send one empty
 * reading and then nothing. If no real reading arrives soon, treat motion as
 * blocked so the page tells people to tap instead.
 */
function verifySensor() {
  let timer = 0;
  const onSample = (e: DeviceMotionEvent) => {
    const a = e.acceleration;
    const g = e.accelerationIncludingGravity;
    if ((a && a.x != null) || (g && g.x != null)) stop();
  };
  const stop = () => {
    clearTimeout(timer);
    window.removeEventListener("devicemotion", onSample);
  };
  window.addEventListener("devicemotion", onSample);
  timer = window.setTimeout(() => {
    stop();
    if (permission === "granted") settle("denied");
  }, VERIFY_MS);
}

if (permission === "granted") verifySensor();

// Ask once silently. Android says yes straight away; iOS rejects without a
// tap, which leaves "unknown" so only iPhones show the button.
ask?.call(DeviceMotionEvent).then(settle, () => {});

/** Call from a click handler. Safe to call repeatedly; only asks once. */
export function requestMotionPermission() {
  if (permission !== "unknown" || asking || !ask) return;
  asking = true;
  ask
    .call(DeviceMotionEvent)
    .then(settle, () => settle("denied"))
    .finally(() => {
      asking = false;
    });
}

export function useMotionPermission(): MotionPermission {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => permission,
  );
}

export type Vec = { x: number; y: number; z: number };

const START_JOLT = 12; // m/s²: a deliberate swing (walking stays under ~5)
const START_JOLTS = 2; // two swings close together start a Shake…
const START_WINDOW_MS = 600;
const MIN_GAP_MS = 80; // …one swing is one jolt, not several samples
const KEEP_SHAKING = 7; // m/s² that still counts as shaking once started
const STOP_AFTER_MS = 500; // still this long → the Shake is abandoned
const GOAL_MS = 1200; // this much real shaking makes a Stick rise
const GRAVITY_SMOOTHING = 0.92;

export interface PhoneShakeHandlers {
  /** Every motion sample: gravity-free acceleration in the phone's axes, m/s². */
  onMove?: (a: Vec, magnitude: number) => void;
  /** A real shake began. */
  onStart?: () => void;
  /** 0 → 1 towards a Stick rising. */
  onProgress?: (progress: number) => void;
  /** Shaking stopped before a Stick rose. */
  onStop?: () => void;
  /** Shaken long enough: a Stick rises. */
  onComplete?: () => void;
}

/** Feeds live phone motion to `handlers`; Shake detection runs only while `detect`. */
export function usePhoneShake(handlers: PhoneShakeHandlers, detect: boolean) {
  const granted = useMotionPermission() === "granted";
  const h = useRef(handlers);
  const detecting = useRef(detect);
  useEffect(() => {
    h.current = handlers;
    detecting.current = detect;
  });

  useEffect(() => {
    if (!granted) return;

    let gravity: Vec | null = null;
    let lastSample = 0;
    let jolts: number[] = [];
    let lastJolt = 0;
    let active = false;
    let shakenMs = 0;
    let lastActive = 0;

    const reset = () => {
      active = false;
      shakenMs = 0;
      jolts = [];
    };

    const onMotion = (e: DeviceMotionEvent) => {
      const now = performance.now();
      const dt = lastSample ? Math.min(now - lastSample, 100) : 0;
      lastSample = now;

      // Prefer the phone's gravity-free reading; some phones lack it (or report
      // zeros), so also estimate gravity with a slow low-pass filter and
      // subtract it, and use whichever reading moved more.
      let linear: Vec | null = null;
      let magnitude = 0;
      const a = e.acceleration;
      if (a && a.x != null && a.y != null && a.z != null) {
        linear = { x: a.x, y: a.y, z: a.z };
        magnitude = Math.hypot(a.x, a.y, a.z);
      }
      const g = e.accelerationIncludingGravity;
      if (g && g.x != null && g.y != null && g.z != null) {
        const k = GRAVITY_SMOOTHING;
        gravity = gravity
          ? { x: gravity.x * k + g.x * (1 - k), y: gravity.y * k + g.y * (1 - k), z: gravity.z * k + g.z * (1 - k) }
          : { x: g.x, y: g.y, z: g.z };
        const est = { x: g.x - gravity.x, y: g.y - gravity.y, z: g.z - gravity.z };
        const estMagnitude = Math.hypot(est.x, est.y, est.z);
        if (estMagnitude > magnitude) {
          linear = est;
          magnitude = estMagnitude;
        }
      }
      if (!linear) return;

      h.current.onMove?.(linear, magnitude);

      if (!detecting.current) {
        if (active) reset();
        return;
      }

      if (!active) {
        if (magnitude > START_JOLT && now - lastJolt > MIN_GAP_MS) {
          jolts.push(now);
          lastJolt = now;
        }
        jolts = jolts.filter((t) => now - t < START_WINDOW_MS);
        if (jolts.length >= START_JOLTS) {
          active = true;
          shakenMs = 0;
          lastActive = now;
          jolts = [];
          h.current.onStart?.();
        }
        return;
      }

      if (magnitude > KEEP_SHAKING) lastActive = now;
      if (now - lastActive > STOP_AFTER_MS) {
        reset();
        h.current.onStop?.();
        return;
      }
      if (now - lastActive < 200) shakenMs += dt; // only time spent actually moving counts
      h.current.onProgress?.(Math.min(shakenMs / GOAL_MS, 1));
      if (shakenMs >= GOAL_MS) {
        reset();
        h.current.onComplete?.();
      }
    };

    // Phones normally keep sending samples while still, but don't rely on it
    // to notice that shaking stopped.
    const watchdog = window.setInterval(() => {
      if (active && performance.now() - lastActive > STOP_AFTER_MS) {
        reset();
        h.current.onStop?.();
      }
    }, 100);

    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      clearInterval(watchdog);
    };
  }, [granted]);
}
