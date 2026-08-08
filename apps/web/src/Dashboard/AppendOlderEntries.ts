import type { TMoodEntry } from "@mooduck/contracts";

/**
 * Appends an older page to the list, skipping anything already held.
 *
 * Pages are addressed by offset, so a check-in written while the list is open
 * pushes every later row one place down and the next page repeats the entry at
 * the seam. Ids are stable, so filtering on them is enough — and it costs
 * nothing in the usual case where nothing was written mid-scroll.
 */
export function appendOlderEntries(current: readonly TMoodEntry[], older: readonly TMoodEntry[]): TMoodEntry[] {
  const known = new Set(current.map((entry) => entry.id));
  return [...current, ...older.filter((entry) => !known.has(entry.id))];
}
