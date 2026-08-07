export function formatPaddedMoodScoreDenominator(score: number): string {
  return `${String(score).padStart(2, " ")}/10`;
}
