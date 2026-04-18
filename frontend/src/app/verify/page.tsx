"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type Problem = { name: string; contest: string; index: string };

async function fetchChallengeProblem(): Promise<Problem> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/verify/challenge`
  );
  if (!res.ok) throw new Error("Failed to fetch challenge problem");
  return res.json();
}


type State = "idle" | "verifying" | "success" | "failed";

export default function VerifyPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [handle, setHandle] = useState("");
  const [state, setState] = useState<State>("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [dots, setDots] = useState(0);
  const [failReason, setFailReason] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Animated dots while verifying
  useEffect(() => {
    if (state !== "verifying") return;
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, [state]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollVerification = useCallback(
    async (currentHandle: string, currentProblem: Problem) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              handle: currentHandle,
              contestId: Number(currentProblem.contest),
              index: currentProblem.index,
            }),
          }
        );

        const data = await res.json() as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (res.ok && data.success) {
          stopPolling();
          setState("success");
          return;
        }

        // Timeout after 3 minutes
        if (Date.now() - startTimeRef.current > 3 * 60 * 1000) {
          stopPolling();
          setFailReason("timeout — no matching submission");
          setState("failed");
        }
      } catch {
        // Network errors — keep polling
      }
    },
    [stopPolling]
  );

  const handleSubmit = useCallback(async () => {
    if (!handle.trim()) return;
    setState("verifying");

    const selectedProblem = await fetchChallengeProblem();
    setProblem(selectedProblem);
    startTimeRef.current = Date.now();

    // Poll every 5 seconds
    pollingRef.current = setInterval(() => {
      pollVerification(handle.trim(), selectedProblem);
    }, 5000);

    // Immediate first check after 3s
    setTimeout(() => {
      pollVerification(handle.trim(), selectedProblem);
    }, 3000);
  }, [handle, pollVerification]);

  const handleRetry = useCallback(() => {
    stopPolling();
    setProblem(null);
    setState("idle");
  }, [stopPolling]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (state === "idle") handleSubmit();
      else if (state === "failed") handleRetry();
    }
  };

  const problemUrl = problem
    ? `https://codeforces.com/problemset/problem/${problem.contest}/${problem.index}`
    : "#";

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      {/* Main dialogue box */}
      <div
        className="w-full max-w-xs rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl"
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-5 py-3">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#2a2a2a]" />
            <div className="h-2 w-2 rounded-full bg-[#2a2a2a]" />
            <div className="h-2 w-2 rounded-full bg-[#2a2a2a]" />
          </div>
          <span className="ml-2 text-[11px] tracking-widest text-[#333] uppercase select-none">
            verify
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-7">
          {/* Handle input — visible in idle and failed states */}
          {(state === "idle" || state === "failed") && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#444]">
                Codeforces Handle
              </span>
              <div className="mt-3">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value);
                    if (state === "failed") setState("idle");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="tourist"
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                  className="w-2/3 bg-transparent text-sm text-white placeholder-[#222] outline-none border-b border-[#1a1a1a] focus:border-[#333] pb-1.5 transition-colors duration-300"
                />
              </div>
            </label>
          )}

          {/* Idle — Continue button */}
          {state === "idle" && (
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!handle.trim()}
                className="w-1/3 cursor-pointer rounded-sm border border-[#1a1a1a] bg-[#0e0e0e] py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#999] transition-all duration-300 hover:border-[#333] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-[#1a1a1a] disabled:hover:text-[#999]"
              >
                Continue
              </button>
            </div>
          )}

          {/* Verifying state */}
          {state === "verifying" && (
            <div className="space-y-5 pt-1">
              {/* Handle echo */}
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#333]">
                  Handle
                </span>
                <p className="text-sm text-[#888] pt-1">{handle}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#444]">
                  Submit a compilation error to
                </span>
                <div className="pt-1">
                  {problem ? (
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#c8c8c8] underline decoration-[#333] underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-[#666]"
                    >
                      {problem.contest}{problem.index} — {problem.name}
                    </a>
                  ) : (
                    <span className="text-sm text-[#555]">fetching problem…</span>
                  )}
                </div>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center gap-3 pt-2">
                <div className="relative h-3 w-3">
                  <div className="absolute inset-0 animate-ping rounded-full bg-[#333]" />
                  <div className="absolute inset-0.5 rounded-full bg-[#555]" />
                </div>
                <span className="text-[11px] tracking-wider text-[#333]">
                  waiting for submission{".".repeat(dots)}
                </span>
              </div>
            </div>
          )}

          {/* Success state */}
          {state === "success" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-[#4ade80]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#4ade80]/70">
                  Verified
                </span>
              </div>
              <div className="border-t border-[#1a1a1a] pt-4 space-y-1">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#333]">
                  Handle
                </span>
                <p className="text-sm text-white pt-0.5">{handle}</p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-2/3 cursor-pointer rounded-sm border border-[#1a1a1a] bg-[#0e0e0e] py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#999] transition-all duration-300 hover:border-[#333] hover:text-white"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Failed state */}
          {state === "failed" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-[#f87171]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#f87171]/70">
                  Failed
                </span>
              </div>
              <div className="border-t border-[#1a1a1a] pt-4">
                <span className="text-[11px] tracking-wider text-[#555]">
                  {failReason}
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleRetry}
                  className="w-1/3 cursor-pointer rounded-sm border border-[#1a1a1a] bg-[#0e0e0e] py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#999] transition-all duration-300 hover:border-[#333] hover:text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div className="border-t border-[#1a1a1a] px-5 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-[#222] tracking-wider select-none">
            codeforces.com
          </span>
          {state === "success" && (
            <span className="text-[10px] text-[#4ade80]/40 tracking-wider select-none">
              ● connected
            </span>
          )}
          {state === "verifying" && (
            <span className="text-[10px] text-[#333] tracking-wider select-none animate-pulse">
              ● listening
            </span>
          )}
          {state === "failed" && (
            <span className="text-[10px] text-[#f87171]/40 tracking-wider select-none">
              ● disconnected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
