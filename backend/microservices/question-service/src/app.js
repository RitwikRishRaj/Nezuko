const express = require("express");
const questionRoutes = require("./routes/questionRoutes");

const app = express();
app.use(express.json());

app.use("/questions", questionRoutes);

module.exports = app;
