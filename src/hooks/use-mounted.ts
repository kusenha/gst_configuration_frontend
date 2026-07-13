import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** True only after client-side hydration, avoiding SSR/client markup mismatches for auth-gated UI. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
