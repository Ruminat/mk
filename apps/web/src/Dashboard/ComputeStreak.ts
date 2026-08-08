import type { TMoodEntry } from "@mooduck/contracts";

/**
 * Consecutive calendar days — in the browser's local timezone — with at least one
 * check-in, counting back from today. If today has none but yesterday does, the
 * streak still counts from yesterday (so it doesn't read 0 all morning). Entries
 * with a null/unreadable timestamp are skipped.
 */
export function computeStreak(entries: readonly TMoodEntry[], now: Date = new Date()): number {
  const days = new Set<number>();
  for (const entry of entries) {
    if (entry.createdAt === null) {
      continue;
    }
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    days.add(startOfLocalDay(date));
  }
  if (days.size === 0) {
    return 0;
  }

  const today = startOfLocalDay(now);
  const yesterday = previousLocalDay(today);

  let cursor: number;
  if (days.has(today)) {
    cursor = today;
  } else if (days.has(yesterday)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousLocalDay(cursor);
  }
  return streak;
}

/** Local-midnight timestamp for the day a date falls in. */
function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Previous local day — via calendar math, so it's correct across DST changes. */
function previousLocalDay(dayStartMs: number): number {
  const date = new Date(dayStartMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).getTime();
}
