import { useSyncExternalStore } from "react";

// Three routes don't justify a router dependency: this is history.pushState
// plus a subscription so React re-renders on navigation and back/forward.

export interface NavState {
  /** Set when a Slip was reached by Shake → Pull on the homepage (not by Scan). */
  fromShake?: boolean;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

export function navigate(
  path: string,
  opts: { replace?: boolean; state?: NavState } = {},
) {
  const state = opts.state ?? null;
  if (opts.replace) history.replaceState(state, "", path);
  else history.pushState(state, "", path);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function getNavState(): NavState {
  return (history.state as NavState | null) ?? {};
}
