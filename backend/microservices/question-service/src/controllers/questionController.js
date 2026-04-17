const { getQuestionsFromCodeforces } = require("../services/CodeforcesService");

exports.fetchQuestions = async (req, res) => {
  try {
    const { rating, minRating, maxRating, tags, count } = req.query;

    console.log('Received query params:', { rating, minRating, maxRating, tags, count });

    const params = {
      rating: rating ? parseInt(rating) : null,
      minRating: minRating ? parseInt(minRating) : null,
      maxRating: maxRating ? parseInt(maxRating) : null,
      tags: tags ? tags.split(",") : [],
      count: count ? parseInt(count) : 10,
    };

    console.log('Parsed params:', params);

    const problems = await getQuestionsFromCodeforces(params);

    console.log(`Returning ${problems.length} problems`);
    
    res.json({ problems });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};
