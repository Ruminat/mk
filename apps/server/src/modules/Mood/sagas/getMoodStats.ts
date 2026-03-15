import { TSelectMoodEntry } from "../model";
import type { TMoodScore, TMoodStats, TMoodStatsEntry } from "../utils";
import { getMoodInterest } from "../utils";

type TGetMoodStatsParams = {
  entries: TSelectMoodEntry[];
  topEntries?: number;
  lastCommentedEntries?: number;
};

function parseCreatedAt(createdAt: string | null): number {
  if (!createdAt) return Date.now();
  const ts = Date.parse(createdAt);
  return Number.isNaN(ts) ? Date.now() : ts;
}

function toMoodEntry(entry: TSelectMoodEntry): TMoodStatsEntry {
  return {
    score: entry.value as TMoodScore,
    comment: entry.comment ?? undefined,
    created: parseCreatedAt(entry.createdAt),
  };
}

export function getMoodStats(params: TGetMoodStatsParams): TMoodStats | undefined {
  const allMoodEntries = params.entries.map(toMoodEntry);

  if (allMoodEntries.length === 0) {
    return undefined;
  }

  const topEntriesCount = params.topEntries ?? 10;
  const lastEntriesCount = params.lastCommentedEntries ?? 5;
  const scores: Record<TMoodScore, number | undefined> = {} as Record<TMoodScore, number | undefined>;

  let scoresSum = 0;
  let std = 0;
  const withComments: TMoodStatsEntry[] = [];
  const interestingEntries: (TMoodStatsEntry & { interest: number })[] = [];

  for (const mood of allMoodEntries) {
    scoresSum += mood.score;
    scores[mood.score] = (scores[mood.score] ?? 0) + 1;
    if (mood.comment) {
      withComments.push(mood);
    }
  }

  const avg = scoresSum / allMoodEntries.length;

  for (const mood of allMoodEntries) {
    std += (mood.score - avg) ** 2;
  }
  std = Math.sqrt(std / allMoodEntries.length);

  const goodInterest = Math.max(std / 2, 1.1);

  for (const mood of withComments) {
    const interest = getMoodInterest({ avgMood: avg, mood: mood.score });
    if (interest >= goodInterest) {
      interestingEntries.push({ ...mood, interest });
    }
  }

  const lastCommentedEntries = withComments.slice(-lastEntriesCount);

  const interestingEntriesSorted = [...interestingEntries].sort((a, b) => {
    const byInterest = b.interest - a.interest;
    return byInterest !== 0 ? byInterest : b.created - a.created;
  });

  const goodEntries = interestingEntriesSorted.filter((e) => e.score > avg);
  const badEntries = interestingEntriesSorted.filter((e) => e.score < avg);
  const halfCount = Math.ceil(topEntriesCount / 2);
  const topEntriesGood = goodEntries.slice(0, halfCount);
  const topEntriesBad = badEntries.slice(0, halfCount);
  const topEntries: (TMoodStatsEntry & { comment: string })[] = [...topEntriesGood, ...topEntriesBad]
    .map(({ interest: _, ...e }) => e)
    .filter((e): e is TMoodStatsEntry & { comment: string } => typeof e.comment === "string")
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.created - a.created));

  return { scores, avg, std, topEntries, lastCommentedEntries };
}
