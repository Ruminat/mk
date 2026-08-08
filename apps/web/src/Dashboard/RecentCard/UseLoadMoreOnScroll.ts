import { useEffect, useRef, type RefObject } from "react";

/**
 * Watches a sentinel at the end of a list and calls `onLoadMore` when it comes
 * into view.
 *
 * The observer's root is the viewport, not the list. That covers both layouts
 * with one code path: intersection accounts for clipping by ancestors, so inside
 * the desktop card the sentinel only counts as visible once it's scrolled into
 * the card's 600px box, while on a stacked phone layout the page scroll is what
 * reveals it.
 *
 * Passing `enabled: false` while a page is in flight (or after one failed) both
 * throttles the fetch and stops a failing request from being retried forever.
 */
export function useLoadMoreOnScroll(enabled: boolean, onLoadMore: () => void): RefObject<HTMLLIElement | null> {
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return sentinelRef;
}
