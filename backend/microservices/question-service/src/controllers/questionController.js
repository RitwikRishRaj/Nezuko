const { getQuestionsFromCodeforces } = require("../services/CodeforcesService");

exports.fetchQuestions = async (req, res) => {
  try {
    const { rating, tags, count } = req.query;

    // if (!count) {
    //   return res.status(400).json({ error: "count query param is required" });
    // }

    const problems = await getQuestionsFromCodeforces({
      rating: rating ? parseInt(rating) : null,
      tags: tags ? tags.split(",") : [],
      count: count? parseInt(count):10,
    });

    res.json({ problems });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};
