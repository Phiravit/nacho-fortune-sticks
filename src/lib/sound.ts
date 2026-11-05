import { useSyncExternalStore } from "react";
import { load, save } from "./storage";

// Every sound is synthesised with Web Audio, so there are no audio files to
// license or download. Swap a function body for a recorded sample later if wanted.

const MUTE_KEY = "siamsi.muted";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let muted = load(MUTE_KEY) === "1";
const muteListeners = new Set<() => void>();

/** Browsers only start audio after a tap; call this from any user gesture. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  save(MUTE_KEY, next ? "1" : "0");
  muteListeners.forEach((l) => l());
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (l) => {
      muteListeners.add(l);
      return () => muteListeners.delete(l);
    },
    () => muted,
  );
}

function ready(): AudioContext | null {
  if (muted || !ctx || ctx.state !== "running") return null;
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** A short filtered noise burst: the "click" of wood on wood. */
function burst(ac: AudioContext, at: number, freq: number, gain: number, len: number) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = 6;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(at, Math.random() * 0.5, len + 0.02);
}

/** A resonant knock with a falling pitch: the body of a wooden hit. */
function knock(ac: AudioContext, at: number, freq: number, gain: number, len: number) {
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, at + len);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + len + 0.02);
}

/** Sticks clattering inside the cup for `seconds`. */
export function playRattle(seconds: number) {
  const ac = ready();
  if (!ac) return;
  const start = ac.currentTime;
  let t = start;
  while (t < start + seconds) {
    burst(ac, t, 1800 + Math.random() * 2600, 0.25 + Math.random() * 0.3, 0.03);
    if (Math.random() < 0.5) knock(ac, t, 700 + Math.random() * 900, 0.12, 0.04);
    t += 0.025 + Math.random() * 0.05;
  }
}

/** A few sticks knocking together once; `intensity` 0–1. Played live per swing of the phone. */
export function playTick(intensity: number) {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  const hits = 1 + Math.round(intensity * 3);
  for (let i = 0; i < hits; i++) {
    const at = t + i * (0.012 + Math.random() * 0.02);
    burst(ac, at, 1800 + Math.random() * 2600, 0.15 + intensity * 0.35, 0.03);
    if (Math.random() < 0.5) knock(ac, at, 700 + Math.random() * 900, 0.08 + intensity * 0.08, 0.04);
  }
}

/** One stick knocking up out of the others. */
export function playClack() {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 520, 0.5, 0.12);
  burst(ac, t, 2400, 0.4, 0.05);
  knock(ac, t + 0.09, 640, 0.25, 0.08);
}

/** The stick sliding out of the cup. */
export function playSwoosh() {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(350, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t, 0, 0.5);
}

/** A small temple-bell "ting" for the Slip reveal. */
export function playChime() {
  const ac = ready();
  if (!ac) return;
  const t = ac.currentTime;
  [
    { f: 1046.5, at: 0, gain: 0.22 },
    { f: 1568, at: 0.09, gain: 0.16 },
    { f: 2093, at: 0.18, gain: 0.1 },
  ].forEach(({ f, at, gain }) => {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(gain, t + at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + 1.4);
    osc.connect(g).connect(ac.destination);
    osc.start(t + at);
    osc.stop(t + at + 1.5);
  });
}
