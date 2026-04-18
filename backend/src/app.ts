import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import verifyRoute from "./routes/verify";
import questionsRoute from "./routes/questions";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({ origin: "*" }));

// Health check
app.get("/health", (c) =>
  c.json({
    status: "healthy",
    service: "nezuko-backend",
    timestamp: new Date().toISOString(),
  })
);

// Routes
app.route("/api/verify", verifyRoute);
app.route("/api/questions", questionsRoute);

export default app;
