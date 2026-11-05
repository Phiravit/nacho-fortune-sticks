import { useSyncExternalStore } from "react";

// Browsers only allow sound and vibration after the person has tapped the page
// at least once ("user activation"). Track whether that tap has happened, so
// the homepage can ask for one before the first Shake.

let activated =
  typeof navigator !== "undefined" && navigator.userActivation
    ? navigator.userActivation.hasBeenActive
    : false;
const listeners = new Set<() => void>();

export function markActivated() {
  if (activated) return;
  activated = true;
  listeners.forEach((l) => l());
}

// `click`, not `pointerup`: hiding the start screen on pointerup would let the
// same tap's click land on the cup underneath and start a Shake.
for (const type of ["click", "keydown"]) {
  document.addEventListener(type, markActivated, { passive: true });
}

export function useActivated(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => activated,
  );
}
