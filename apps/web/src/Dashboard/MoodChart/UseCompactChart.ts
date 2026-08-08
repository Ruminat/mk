import { useSyncExternalStore } from "react";

/**
 * Below this width the chart is drawn smaller — thinner line, smaller dots and
 * labels, tighter margins — so a phone gets a readable plot instead of a desktop
 * one crammed into a third of the space.
 */
const COMPACT_QUERY = "(max-width: 560px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Reads a primitive, so React can compare snapshots without tearing. */
function getSnapshot(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

/**
 * `useSyncExternalStore` rather than state synced by an effect: the media query
 * is an external store, and this reads it during render, so there is no first
 * paint at the wrong size and no cascading re-render to correct it.
 */
export function useCompactChart(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
