import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { PULL_MS, SHAKE_MS, STICK_LAYOUT, SiamSi25D, type CupPhase } from "../components/SiamSi25D";
import { drawStickNumber } from "../data/sticks";
import { markActivated, useActivated } from "../lib/activation";
import { requestMotionPermission, useMotionPermission, usePhoneShake } from "../lib/deviceShake";
import { vibrate } from "../lib/haptics";
import { useLang } from "../lib/i18n";
import { navigate } from "../lib/router";
import { playClack, playRattle, playSwoosh, playTick } from "../lib/sound";

const SWIPE_PX = 36;
const SWAY_SPRING = { stiffness: 280, damping: 14, mass: 0.6 };
const TICK_GAP_MS = 55; // clatter at most this often while the phone shakes
const BUZZ_GAP_MS = 110;
const BUZZ_MS = 28; // per swing; shorter buzzes are hard to feel on most phones

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));

const IS_ANDROID = /Android/i.test(navigator.userAgent);
/** Opens this page in Chrome from another Android browser (e.g. Brave, which blocks motion). */
const OPEN_IN_CHROME = `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;

interface Draw {
  number: number;
  /** Which stick in the cup's fan rises; only affects the picture. */
  chosen: number;
}

/**
 * The homepage: Shake → one Stick rises → Pull → its Slip.
 * A Shake comes from tapping the cup (a fixed shake) or from really shaking
 * the phone, which the cup follows live until a Stick rises.
 */
export function Home() {
  const { t } = useLang();
  const reduceMotion = useReducedMotion();
  const activated = useActivated();
  const [phase, setPhase] = useState<CupPhase>("idle");
  const [draw, setDraw] = useState<Draw | null>(null);

  // Gestures fire faster than React re-renders (a swipe also ends in a click),
  // so the guards read refs, not state.
  const phaseRef = useRef<CupPhase>("idle");
  const drawRef = useRef<Draw | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const lastTick = useRef(0);
  const lastBuzz = useRef(0);

  // Live motion goes straight into motion values: no React render per sample.
  const swayX = useSpring(0, SWAY_SPRING);
  const swayY = useSpring(0, SWAY_SPRING);
  const swayRotate = useSpring(0, SWAY_SPRING);
  const shakeProgress = useMotionValue(0);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const goTo = (next: CupPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const newDraw = () => {
    const next: Draw = {
      number: drawStickNumber(),
      chosen: Math.floor(Math.random() * STICK_LAYOUT.length),
    };
    drawRef.current = next;
    setDraw(next);
  };

  const rise = () => {
    goTo("risen");
    playClack();
    vibrate([50, 40, 110]);
  };

  const tapShake = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    newDraw();
    goTo("shaking");
    playRattle(SHAKE_MS / 1000);
    vibrate([40, 30, 40, 30, 40, 30, 40, 30, 60]);
    timers.current.push(window.setTimeout(rise, SHAKE_MS));
  }, []);

  const pull = useCallback(() => {
    const current = drawRef.current;
    if (phaseRef.current !== "risen" || !current) return;
    goTo("pulling");
    playSwoosh();
    vibrate(15);
    timers.current.push(
      window.setTimeout(() => {
        navigate(`/s/${current.number}`, { state: { fromShake: true } });
      }, PULL_MS),
    );
  }, []);

  usePhoneShake(
    {
      onMove: (a, magnitude) => {
        const current = phaseRef.current;
        if (!reduceMotion && current !== "pulling") {
          // The cup lags behind the hand, like a real cup held loosely.
          swayX.set(clamp(-a.x * 2.4, 30));
          swayY.set(clamp(a.y * 1.6, 18));
          swayRotate.set(clamp(-a.x * 1.1, 14));
        }
        if (current === "live" && magnitude > 9) {
          const at = performance.now();
          if (at - lastTick.current > TICK_GAP_MS) {
            lastTick.current = at;
            playTick(Math.min(magnitude / 25, 1));
          }
          if (at - lastBuzz.current > BUZZ_GAP_MS) {
            lastBuzz.current = at;
            vibrate(BUZZ_MS);
          }
        }
      },
      onStart: () => {
        if (phaseRef.current !== "idle") return;
        newDraw();
        shakeProgress.set(0);
        goTo("live");
      },
      onProgress: (p) => shakeProgress.set(p),
      onStop: () => {
        if (phaseRef.current === "live") goTo("idle");
      },
      onComplete: () => {
        if (phaseRef.current === "live") rise();
      },
    },
    // Not before the first tap: without it the browser would mute the clatter and the buzz.
    activated && (phase === "idle" || phase === "live"),
  );
  const motionPermission = useMotionPermission();

  const onActivate = () => {
    if (phaseRef.current === "idle") {
      requestMotionPermission(); // iOS asks once, on this first tap
      tapShake();
    } else if (phaseRef.current === "risen") {
      pull();
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    swipeStartY.current = e.clientY;
  };
  const onPointerMove = (e: PointerEvent) => {
    const start = swipeStartY.current;
    if (start !== null && start - e.clientY > SWIPE_PX) {
      swipeStartY.current = null;
      pull();
    }
  };
  const onPointerEnd = () => {
    swipeStartY.current = null;
  };

  const start = () => {
    markActivated();
    requestMotionPermission(); // iPhone: this tap is the one that may ask
    vibrate(30);
  };

  return (
    <main className="home">
      <AnimatePresence>
        {!activated && (
          <motion.button
            type="button"
            className="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={start}
          >
            <motion.span
              className="start-ring"
              aria-hidden
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            >
              👆
            </motion.span>
            <span className="start-label">{t("tapToStart")}</span>
            <span className="start-icons" aria-hidden>
              🔊 📳
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {/* iPhone only: motion needs a tap to allow; this tap allows without shaking */}
        {activated && phase === "idle" && motionPermission === "unknown" && (
          <motion.button
            type="button"
            className="motion-btn"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={requestMotionPermission}
          >
            <span aria-hidden>📳</span> {t("enableShake")}
          </motion.button>
        )}
        {/* Android browser that blocks motion (e.g. Brave): offer the same page in Chrome */}
        {activated && phase === "idle" && motionPermission === "denied" && IS_ANDROID && (
          <motion.a
            className="motion-btn"
            href={OPEN_IN_CHROME}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span aria-hidden>📱</span> {t("openInChrome")}
          </motion.a>
        )}
      </AnimatePresence>
      <div
        className="stage"
        role="button"
        tabIndex={0}
        aria-label={phase === "risen" ? t("pull") : phase === "live" ? t("keepShaking") : t("shake")}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="rays" aria-hidden />
        <div className="halo" aria-hidden />
        <SiamSi25D
          phase={phase}
          chosen={draw?.chosen ?? 5}
          stickNumber={draw?.number ?? null}
          label={t("cup")}
          sway={{ x: swayX, y: swayY, rotate: swayRotate }}
        />
      </div>

      <div className="hint" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="shake"
              className="hint-inner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <motion.div
                className="hint-big"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                {t("shake")}
              </motion.div>
              {motionPermission === "denied" ? (
                <div className="hint-small">{t("tapHow")}</div>
              ) : (
                <div className="hint-small">
                  <motion.span
                    className="hint-phone"
                    aria-hidden
                    animate={{ rotate: [0, -18, 18, -18, 18, 0, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    📱
                  </motion.span>
                  {t("shakeHow")}
                </div>
              )}
            </motion.div>
          )}
          {phase === "live" && (
            <motion.div
              key="live"
              className="hint-inner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="hint-big">{t("keepShaking")}</div>
              <div className="shake-bar" aria-hidden>
                <motion.div className="shake-fill" style={{ scaleX: shakeProgress }} />
              </div>
            </motion.div>
          )}
          {phase === "risen" && (
            <motion.div
              key="pull"
              className="hint-inner"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 380, damping: 16 }}
            >
              <div className="hint-big">{t("pull")}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
