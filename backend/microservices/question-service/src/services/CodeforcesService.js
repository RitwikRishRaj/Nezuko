const axios = require("axios");

// Seeded random function for better randomization
const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

exports.getQuestionsFromCodeforces = async ({ rating, minRating, maxRating, tags, count }) => {
  const url = "https://codeforces.com/api/problemset.problems";

  const { data } = await axios.get(url);

  if (data.status !== "OK") {
    throw new Error("Codeforces API error");
  }

  let problems = data.result.problems;
  
  // Use timestamp + random for seed to ensure different results each time
  const seed = Date.now() + Math.random() * 1000000;

  // Filter by rating (exact match or range)
  if (rating) {
    problems = problems.filter((p) => p.rating === rating);
  } else if (minRating !== null && minRating !== undefined || maxRating !== null && maxRating !== undefined) {
    const min = minRating || 0;
    const max = maxRating || 9999;
    console.log(`Filtering problems by rating range: ${min} - ${max}`);
    problems = problems.filter((p) => {
      if (!p.rating) return false;
      return p.rating >= min && p.rating <= max;
    });
    console.log(`Problems after rating filter: ${problems.length}`);
  }

  // Filter by tags (if provided)
  if (tags && tags.length > 0) {
    problems = problems.filter((p) =>
      tags.every((tag) => p.tags.includes(tag))
    );
  }

  // Fisher-Yates shuffle with seeded random for true randomization
  let currentSeed = seed;
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    [problems[i], problems[j]] = [problems[j], problems[i]];
  }

  // Take random count
  const selectedProblems = problems.slice(0, count);

  // Shuffle selected problems again with Math.random for extra randomness
  for (let i = selectedProblems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedProblems[i], selectedProblems[j]] = [selectedProblems[j], selectedProblems[i]];
  }

  // Final shuffle with timestamp-based randomness
  selectedProblems.sort(() => {
    const randomValue = Math.random() + (Date.now() % 1000) / 1000;
    return randomValue - 0.5;
  });

  return selectedProblems;
};
