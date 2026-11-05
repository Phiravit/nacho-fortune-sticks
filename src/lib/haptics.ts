import { isMuted } from "./sound";

// Android only: iOS Safari has no Vibration API, so this is a silent no-op there.
// Mute silences vibration too, so one toggle makes the phone fully quiet.
export function vibrate(pattern: number | number[]) {
  if (isMuted()) return;
  // Before any tap, Chrome blocks vibration (and logs a warning); live phone
  // shaking can come before the first tap, so skip quietly.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw without a user gesture; vibration is optional.
  }
}
