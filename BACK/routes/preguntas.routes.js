const express = require("express");
const router = express.Router();
const { startQuiz, submitAnswers } = require("../controllers/preguntas.controller");
const { generarCertificado } = require("../controllers/preguntas.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// POST /api/start - envía preguntas
router.post("/start", verifyToken, startQuiz);

// POST /api/submit - recibe y evalúa respuestas
router.post("/submit", verifyToken, submitAnswers);

// POST /api/certificado - devuelve le pdf del certificado
router.post("/certificado", verifyToken, generarCertificado);

module.exports = router;