import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Fixed problem for verification
const VERIFICATION_PROBLEM = { contestId: 1000, index: "A" }; // Problem 1000A

// POST /verify-codeforces
// body: { handle: "someUser" }
app.post("/verify-codeforces", async (req, res) => {
  const { handle } = req.body;

  if (!handle) {
    return res.status(400).json({ error: "Codeforces handle is required" });
  }

  try {
    // Fetch recent submissions of the user
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=20`
    );

    if (response.data.status !== "OK") {
      return res.status(400).json({ error: "Unable to fetch submissions" });
    }

    const submissions = response.data.result;

    // Find compilation error on fixed problem (1A)
    const match = submissions.find(
      (sub) =>
        sub.problem.contestId === VERIFICATION_PROBLEM.contestId &&
        sub.problem.index === VERIFICATION_PROBLEM.index &&
        sub.verdict === "COMPILATION_ERROR"
    );

    if (match) {
      return res.json({
        success: true,
        message: `Codeforces account verified via problem ${VERIFICATION_PROBLEM.contestId}${VERIFICATION_PROBLEM.index}`,
        submissionId: match.id,
        submissionTime: match.creationTimeSeconds,
      });
    } else {
      return res.json({
        success: false,
        message: `No compilation error found for problem ${VERIFICATION_PROBLEM.contestId}${VERIFICATION_PROBLEM.index}`,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Verification service running on port ${PORT}`));
