import app from "./src/app";

const PORT = parseInt(process.env.PORT ?? "8080");

Bun.serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🚀 Backend running on http://localhost:${PORT}`);