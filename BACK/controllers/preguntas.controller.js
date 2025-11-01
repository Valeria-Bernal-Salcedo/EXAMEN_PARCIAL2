const QUESTIONS = require("../data/preguntas");

const startQuiz = (req, res) => {
  const name = req.body && req.body.name ? req.body.name : "PONER OTRO NOMBRE";
  console.log(`Acceso al /api/preguntas/start  ${name}`);
  console.log("Request body (start):", JSON.stringify(req.body, null, 2));

  // Crea una copia de todas las preguntas SIN el campo 'correct'
  const publicQuestions = QUESTIONS.map(({ id, text, options }) => ({ id, text, options }));

  // Creamos el objeto de respuesta **antes** de loguearlo
  const responseBody = {
    message: "Preguntas listas. ¡Éxito!",
    questions: publicQuestions
  };

  // Log correcto: imprimimos la respuesta completa que vamos a enviar
  console.log("Respuesta del servidor (start):", JSON.stringify(responseBody, null, 2));

  return res.status(200).json(responseBody);
};

const submitAnswers = (req, res) => {
  const name = req.body && req.body.name ? req.body.name : "PONER OTRO NOMBRE";

  console.log(`Acceso al /api/preguntas/submit y ${name}`);
  console.log("Request body (submit) recibido del front (JSON con respuestas):", JSON.stringify(req.body, null, 2));

  const userAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];

  let score = 0;
  const details = [];

  for (const q of QUESTIONS) {
    const user = userAnswers.find(a => a.id === q.id);
    const isCorrect = !!user && user.answer === q.correct;
    if (isCorrect) score++;

    details.push({
      id: q.id,
      text: q.text,
      yourAnswer: user ? user.answer : null,
      correctAnswer: q.correct,
      correct: isCorrect
    });
  }

  const responseBody = {
    message: "Respuestas evaluadas.",
    score,
    total: QUESTIONS.length,
    details
  };

  // Log: mostramos en consola del servidor la respuesta completa antes de enviarla
  console.log("Respuesta del servidor (submit):", JSON.stringify(responseBody, null, 2));

  return res.status(200).json(responseBody);
};

module.exports = {
  startQuiz,
  submitAnswers
};