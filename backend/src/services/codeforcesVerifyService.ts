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
  try {
    const statusUrl = `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const statusRes = await fetch(statusUrl, {
      headers: { "User-Agent": "AlgoGym-VerifyService/1.0" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    const match = submissions.find(
      (sub) =>
        sub.problem.contestId === problem.contestId &&
        sub.problem.index === problem.index &&
        sub.verdict === "COMPILATION_ERROR"
    );

    if (!match) {
      return {
        success: false,
        message: `No compilation error found for problem ${problem.contestId}${problem.index}. Please submit a code that fails to compile.`,
      };
    }

    let rating = 0;
    try {
      const infoController = new AbortController();
      const infoTimeoutId = setTimeout(() => infoController.abort(), 5000);

      const infoRes = await fetch(
        `https://codeforces.com/api/user.info?handles=${handle}`,
        {
          headers: { "User-Agent": "AlgoGym-VerifyService/1.0" },
          signal: infoController.signal,
        }
      );

      clearTimeout(infoTimeoutId);

      const infoData = await infoRes.json() as { status: string; result: any[] };
      if (infoData.status === "OK" && infoData.result.length > 0) {
        rating = infoData.result[0].rating ?? 0;
      }
    } catch {
      // Non-critical
    }

    return {
      success: true,
      message: `Codeforces account verified via problem ${problem.contestId}${problem.index}`,
      submissionId: match.id,
      submissionTime: match.creationTimeSeconds,
      rating,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw Object.assign(
        new Error('Codeforces API request timed out. Please try again.'),
        { statusCode: 503 }
      );
    }
    
    throw error;
  }
}
