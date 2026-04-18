export interface FetchQuestionsParams {
  rating?: number | null;
  minRating?: number | null;
  maxRating?: number | null;
  tags?: string[];
  count?: number;
}

export interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

// Seeded random for better shuffle distribution
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function getQuestionsFromCodeforces(
  params: FetchQuestionsParams
): Promise<CFProblem[]> {
  const { rating, minRating, maxRating, tags = [], count = 10 } = params;

  const res = await fetch("https://codeforces.com/api/problemset.problems", {
    headers: { "User-Agent": "AlgoGym-QuestionService/1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Codeforces API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json() as { status: string; comment?: string; result: { problems: CFProblem[] } };

  if (data.status !== "OK") {
    throw new Error(`Codeforces API error: ${data.comment ?? "Unknown error"}`);
  }

  let problems: CFProblem[] = data.result.problems;

  // Filter by rating
  if (rating != null) {
    problems = problems.filter((p) => p.rating === rating);
  } else if (minRating != null || maxRating != null) {
    const min = minRating ?? 0;
    const max = maxRating ?? 9999;
    problems = problems.filter((p) => p.rating != null && p.rating >= min && p.rating <= max);
  }

  // Filter by tags
  if (tags.length > 0) {
    problems = problems.filter((p) => tags.every((tag) => p.tags.includes(tag)));
  }

  // Fisher-Yates shuffle with seeded random
  let seed = Date.now() + Math.random() * 1_000_000;
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed++) * (i + 1));
    const tmp = problems[i]!;
    problems[i] = problems[j]!;
    problems[j] = tmp;
  }

  const selected = problems.slice(0, count);

  // Extra shuffle passes for randomness
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = selected[i]!;
    selected[i] = selected[j]!;
    selected[j] = tmp;
  }

  selected.sort(() => Math.random() + (Date.now() % 1000) / 1000 - 0.5);

  return selected;
}
