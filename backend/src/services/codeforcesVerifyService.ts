export interface VerificationProblem {
  contestId: number;
  index: string;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  submissionId?: number;
  submissionTime?: number;
  rating?: number;
}

export async function verifyCodeforcesHandle(
  handle: string,
  problem: VerificationProblem
): Promise<VerifyResult> {
  // Fetch recent submissions (last 30 to have a good window)
  const statusRes = await fetch(
    `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30`,
    {
      headers: { "User-Agent": "AlgoGym-VerifyService/1.0" },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!statusRes.ok) {
    throw Object.assign(
      new Error(`Codeforces API returned ${statusRes.status}`),
      { statusCode: 503 }
    );
  }

  const statusData = await statusRes.json() as {
    status: string;
    comment?: string;
    result: any[];
  };

  if (statusData.status !== "OK") {
    throw Object.assign(
      new Error(
        `Codeforces API error: ${statusData.comment ?? "Unable to fetch submissions"}`
      ),
      { statusCode: 400 }
    );
  }

  const submissions: any[] = statusData.result;

  // Find a compilation error on the given problem
  const match = submissions.find(
    (sub) =>
      sub.problem.contestId === problem.contestId &&
      sub.problem.index === problem.index &&
      sub.verdict === "COMPILATION_ERROR"
  );

  if (!match) {
    return {
      success: false,
      message: `No compilation error found for problem ${problem.contestId}${problem.index}`,
    };
  }

  // Fetch rating (non-critical)
  let rating = 0;
  try {
    const infoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`,
      {
        headers: { "User-Agent": "AlgoGym-VerifyService/1.0" },
        signal: AbortSignal.timeout(10000),
      }
    );
    const infoData = await infoRes.json() as { status: string; result: any[] };
    if (infoData.status === "OK" && infoData.result.length > 0) {
      rating = infoData.result[0].rating ?? 0;
    }
  } catch {
    // Non-critical — continue without rating
  }

  return {
    success: true,
    message: `Codeforces account verified via problem ${problem.contestId}${problem.index}`,
    submissionId: match.id,
    submissionTime: match.creationTimeSeconds,
    rating,
  };
}
