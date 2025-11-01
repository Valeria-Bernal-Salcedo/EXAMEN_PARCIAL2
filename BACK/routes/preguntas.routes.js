const express = require("express");
const router = express.Router();
const { startQuiz, submitAnswers } = require("../controllers/preguntas.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// POST /api/start - envía preguntas
router.post("/start", verifyToken, startQuiz);

// POST /api/submit - recibe y evalúa respuestas
router.post("/submit", verifyToken, submitAnswers);

module.exports = router;