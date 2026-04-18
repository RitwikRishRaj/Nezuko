import { Hono } from "hono";
import { verifyCodeforcesHandle } from "../services/codeforcesVerifyService";

const PROBLEMS = [
  { name: "Watermelon", contest: "4", index: "A" },
  { name: "Way Too Long Words", contest: "71", index: "A" },
  { name: "Next Round", contest: "158", index: "A" },
  { name: "Domino piling", contest: "50", index: "A" },
  { name: "Bit++", contest: "282", index: "A" },
  { name: "Beautiful Matrix", contest: "263", index: "A" },
  { name: "Petya and Strings", contest: "112", index: "A" },
  { name: "Helpful Maths", contest: "339", index: "A" },
];

const verify = new Hono();

// Returns a random challenge problem for the frontend to display
verify.get("/challenge", (c) => {
  const problem = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
  return c.json(problem);
});

verify.post("/", async (c) => {
  const body = await c.req.json<{
    handle?: string;
    contestId?: number;
    index?: string;
  }>();

  const { handle, contestId, index } = body;

  if (!handle) {
    return c.json({ error: "Codeforces handle is required" }, 400);
  }

  if (!contestId || !index) {
    return c.json({ error: "contestId and index are required" }, 400);
  }

  try {
    const result = await verifyCodeforcesHandle(handle, { contestId, index });
    return c.json(result);
  } catch (err: any) {
    const status = err.statusCode ?? 500;
    return c.json(
      { error: err.message ?? "Server error" },
      status as 400 | 429 | 500 | 503
    );
  }
});

export default verify;
