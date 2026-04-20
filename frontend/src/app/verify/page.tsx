"use client";

import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

interface Problem {
  name: string;
  contest: string;
  index: string;
}

type VerifyStatus = "loading" | "success" | "fail";

async function fetchChallengeProblem(): Promise<Problem> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/verify/challenge`
  );
  if (!res.ok) throw new Error("Failed to fetch challenge problem");
  return res.json();
}

async function checkVerification(handle: string, problem: Problem): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('/api/verify-cf', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        contestId: Number(problem.contest),
        index: problem.index,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const data = await res.json() as { success?: boolean; error?: string };
    
    if (!res.ok) {
      console.error('Verification failed:', data.error);
      return false;
    }
    
    return !!data.success;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Request timeout');
    } else {
      console.error('Verification error:', error);
    }
    return false;
  }
}

/* ─── tiny icon components ─── */

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5.25" stroke={color} strokeWidth="0.5" />
      <path d="M3.5 6l2 2 3-3" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5.25" stroke={color} strokeWidth="0.5" />
      <path d="M4 4l4 4M8 4l-4 4" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ─── styles ─── */

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    padding: "2rem",
  },
  dialog: {
    background: "#000",
    border: "0.5px solid #2a2a2a",
    borderRadius: "10px",
    width: "340px",
    padding: "28px",
    fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.4s, opacity 0.4s",
  } as CSSProperties,
  title: {
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    transition: "color 0.4s",
  },
  label: {
    fontSize: "10px",
    color: "#444",
    display: "block",
    marginBottom: "6px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0d0d0d",
    border: "0.5px solid #222",
    borderRadius: "6px",
    padding: "9px 12px",
    fontFamily: "inherit",
    fontSize: "13px",
    color: "#e0e0e0",
    outline: "none",
    marginBottom: "20px",
    transition: "border-color 0.2s",
  },
  problemCard: {
    background: "#0d0d0d",
    border: "0.5px solid #1e1e1e",
    borderRadius: "6px",
    padding: "12px 14px",
    marginBottom: "20px",
  },
  problemCardLabel: {
    fontSize: "10px",
    color: "#444",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  problemLink: {
    fontSize: "13px",
    color: "#7aa2f7",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 500,
  },
  problemHint: {
    fontSize: "10px",
    color: "#444",
    marginTop: "5px",
    lineHeight: 1.5,
  },
  button: {
    width: "100%",
    background: "transparent",
    color: "#888",
    border: "0.5px solid #2a2a2a",
    borderRadius: "6px",
    padding: "10px",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    marginBottom: "14px",
    transition: "opacity 0.15s, border-color 0.2s, color 0.2s",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "11px",
  },
  statusLoading: {
    background: "#0d0d0d",
    border: "0.5px solid #2a2a2a",
    color: "#555",
  },
  statusSuccess: {
    background: "#051a0e",
    border: "0.5px solid #0f3d1f",
    color: "#4ade80",
  },
  statusFail: {
    background: "#1a0505",
    border: "0.5px solid #3d0f0f",
    color: "#f87171",
  },
  loadingDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#333",
    flexShrink: 0,
  },
};

/* ─── main page ─── */

export default function VerifyPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { setVerified } = useUserStore();

  const [handle, setHandle] = useState<string>("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [inputError, setInputError] = useState<boolean>(false);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }
    
    if (isLoaded && isSignedIn) {
      fetch('/api/sync-user', { method: 'POST' })
        .catch(err => console.error('Sync failed:', err));
    }
  }, [isLoaded, isSignedIn, router]);

  // Redirect to /home after success
  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => router.push("/home"), 1500);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setHandle(e.target.value);
    // Clear any previous fail status so the error doesn't linger while typing
    if (status === "fail") setStatus(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") handleVerify();
  };

  const handleVerify = async (): Promise<void> => {
    if (!handle.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 1200);
      return;
    }

    // Fetch and lock a problem on first click
    let assigned = problem;
    if (!assigned) {
      try {
        assigned = await fetchChallengeProblem();
        setProblem(assigned);
      } catch {
        setStatus("fail");
        return;
      }
    }

    setStatus("loading");
    phaseRef.current += 1;
    const myPhase = phaseRef.current;

    const ok = await checkVerification(handle.trim(), assigned);
    if (phaseRef.current !== myPhase) return;

    if (ok) {
      // Verification successful - API already updated Supabase
      if (user) {
      }
      setVerified(true); // update Zustand so the landing button reflects it
    }

    setStatus(ok ? "success" : "fail");
  };

  if (!isLoaded || !isSignedIn) return null;

  const verified = status === "success";
  const problemUrl = problem
    ? `https://codeforces.com/problemset/problem/${problem.contest}/${problem.index}`
    : "#";
  const problemLabel = problem
    ? `CF ${problem.contest}${problem.index} — ${problem.name}`
    : "";

  return (
    <div style={styles.page}>
      <div style={styles.dialog}>
        {/* Header */}
        <div style={styles.header}>
          <div
            style={{
              ...styles.dot,
              background: verified ? "#4ade80" : "#fff",
              opacity: verified ? 1 : 0.15,
            }}
          />
          <span style={{ ...styles.title, color: verified ? "#4ade80" : "#aaa" }}>
            Verify Codeforces Account
          </span>
        </div>

        {/* Handle input — hidden after success */}
        {!verified && (
          <div>
            <label style={styles.label}>Handle</label>
            <input
              type="text"
              placeholder="e.g. tourist"
              value={handle}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              style={{
                ...styles.input,
                borderColor: inputError ? "#3d0f0f" : "#222",
              }}
            />
          </div>
        )}

        {/* Problem card — shown only after first Verify click, hidden after success */}
        {problem && !verified && (
          <div style={styles.problemCard}>
            <div style={styles.problemCardLabel}>Submit a compile error on</div>
            <a href={problemUrl} target="_blank" rel="noreferrer" style={styles.problemLink}>
              {problemLabel}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="#7aa2f7" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </a>
            <div style={styles.problemHint}>Submit any code that fails to compile.</div>
          </div>
        )}

        {/* Verify button — hidden after success */}
        {!verified && (
          <button
            onClick={handleVerify}
            disabled={status === "loading"}
            style={{ ...styles.button, opacity: status === "loading" ? 0.4 : 1 }}
          >
            {status === "loading" ? "Checking…" : "Verify"}
          </button>
        )}

        {/* Status bar */}
        {status === "loading" && (
          <div style={{ ...styles.statusBox, ...styles.statusLoading }}>
            <span style={styles.loadingDot} />
            Checking last submission…
          </div>
        )}
        {status === "success" && (
          <div style={{ ...styles.statusBox, ...styles.statusSuccess }}>
            <CheckIcon color="#4ade80" />
            Identity confirmed. Redirecting…
          </div>
        )}
        {status === "fail" && (
          <div style={{ ...styles.statusBox, ...styles.statusFail }}>
            <CrossIcon color="#f87171" />
            No compile error found. Try again.
          </div>
        )}
      </div>
    </div>
  );
}
