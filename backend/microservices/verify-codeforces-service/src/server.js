const express = require("express");
const axios = require("axios");

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'verify-service',
    timestamp: new Date().toISOString()
  });
});

// Verification configuration
const VERIFICATION_PROBLEM = { contestId: 1000, index: "A" }; // Problem 1000A

// POST /api/verify
// body: { handle: "someUser" }
app.post("/api/verify", async (req, res) => {
  const { handle } = req.body;

  if (!handle) {
    return res.status(400).json({ error: "Codeforces handle is required" });
  }

  try {
    // Fetch recent submissions of the user
    let response;
    try {
      response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=20`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'AlgoGym-VerifyService/1.0'
          }
        }
      );
    } catch (apiError) {
      console.error('Codeforces API request failed:', apiError.message);
      
      if (apiError.code === 'ECONNABORTED') {
        return res.status(503).json({ 
          error: "Codeforces API request timed out. Please try again later." 
        });
      } else if (apiError.response && apiError.response.status === 429) {
        return res.status(429).json({ 
          error: "Too many requests to Codeforces API. Please wait a moment and try again." 
        });
      } else if (apiError.response) {
        return res.status(503).json({ 
          error: `Codeforces API returned ${apiError.response.status}. Please try again later.` 
        });
      } else {
        return res.status(503).json({ 
          error: "Unable to reach Codeforces API. Please check your internet connection and try again." 
        });
      }
    }

    if (response.data.status !== "OK") {
      return res.status(400).json({ 
        error: `Codeforces API error: ${response.data.comment || 'Unable to fetch submissions'}` 
      });
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
      // Fetch user info to get rating
      let rating = null;
      try {
        const userInfoResponse = await axios.get(
          `https://codeforces.com/api/user.info?handles=${handle}`,
          {
            timeout: 10000,
            headers: {
              'User-Agent': 'AlgoGym-VerifyService/1.0'
            }
          }
        );
        if (userInfoResponse.data.status === "OK" && userInfoResponse.data.result.length > 0) {
          rating = userInfoResponse.data.result[0].rating || null;
        }
      } catch (ratingError) {
        console.error("Failed to fetch rating:", ratingError.message);
        // Continue without rating if fetch fails - this is not critical for verification
      }

      return res.json({
        success: true,
        message: `Codeforces account verified via problem ${VERIFICATION_PROBLEM.contestId}${VERIFICATION_PROBLEM.index}`,
        submissionId: match.id,
        submissionTime: match.creationTimeSeconds,
        rating: rating,
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

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Verification service running on port ${PORT}`));
