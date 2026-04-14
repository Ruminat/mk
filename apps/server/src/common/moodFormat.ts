export function parseMoodEntryCreatedAtMs(createdAt: string | null | undefined): number {
  if (!createdAt) {
    return Date.now();
  }

  const ts = Date.parse(createdAt);
  return Number.isNaN(ts) ? Date.now() : ts;
}

export function formatPaddedMoodScoreDenominator(score: number): string {
  return `${String(score).padStart(2, " ")}/10`;
}
