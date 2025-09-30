const axios = require("axios");

exports.getQuestionsFromCodeforces = async ({ rating, tags, count }) => {
  const url = "https://codeforces.com/api/problemset.problems";

  const { data } = await axios.get(url);

  if (data.status !== "OK") {
    throw new Error("Codeforces API error");
  }

  let problems = data.result.problems;

  // Filter by rating
  if (rating) {
    problems = problems.filter((p) => p.rating === rating);
  }

  // Filter by tags
  if (tags.length > 0) {
    problems = problems.filter((p) =>
      tags.every((tag) => p.tags.includes(tag))
    );
  }

  // Shuffle and limit count
  problems = problems.sort(() => 0.5 - Math.random()).slice(0, count);

  return problems;
};
