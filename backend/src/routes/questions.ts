import { Hono } from "hono";
import { getQuestionsFromCodeforces } from "../services/questionService";

const questions = new Hono();

// GET /api/questions/fetch?rating=&minRating=&maxRating=&tags=&count=
questions.get("/fetch", async (c) => {
  const query = c.req.query();

  const params = {
    rating: query.rating ? parseInt(query.rating) : null,
    minRating: query.minRating ? parseInt(query.minRating) : null,
    maxRating: query.maxRating ? parseInt(query.maxRating) : null,
    tags: query.tags ? query.tags.split(",") : [],
    count: query.count ? parseInt(query.count) : 10,
  };

  try {
    const problems = await getQuestionsFromCodeforces(params);
    return c.json({ problems });
  } catch (err: any) {
    console.error(err.message);
    return c.json({ error: "Failed to fetch questions", details: err.message }, 500);
  }
});

export default questions;
