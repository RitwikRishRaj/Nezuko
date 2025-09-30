const express = require("express");
const { fetchQuestions } = require("../controllers/questionController");

const router = express.Router();

router.get("/fetch", fetchQuestions);

module.exports = router;
