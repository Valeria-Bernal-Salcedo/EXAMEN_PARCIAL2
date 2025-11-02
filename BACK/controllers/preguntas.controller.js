const QUESTIONS = require("../data/preguntas");
const { sessions } = require("../middleware/auth.middleware");

// Guardar que usuarios ya hicieron el examen
const usuarioExamen = new Map();

// Funcion para seleccionar preguntas aleatorias
function preguntasAleatorias(preguntas, N){
  // Mezclar las preguntas
  const mezcladas = [...preguntas].sort(() => Math.random() -0.5);
  // Tomar las primeras "N" preguntas
  const seleccionadas = mezcladas.slice(0,N);
  // Mezclar las opciones dentro de cada pregunta
  seleccionadas.forEach(q => q.options.sort(() => Math.random() - 0.5));
  return seleccionadas;
}

// Inciar examen
const startQuiz = (req, res) => {
  const name = req.body && req.body.name ? req.body.name : "PONER OTRO NOMBRE";
  const userId = req.userId;
  console.log(`Acceso al /api/preguntas/start  ${name}`);
  console.log("Request body (start):", JSON.stringify(req.body, null, 2));

   // Verificar si ya realizó el examen
  if (usuarioExamen.has(userId) && usuarioExamen.get(userId).answered) {
    return res.status(403).json({
      message: "El examen solo se puede aplicar una vez"
    });
  }
  
  // Generar 8 preguntas aleatorias
  const preguntasSeleccionadas = preguntasAleatorias(QUESTIONS, 8);

  // Guardar las preguntas seleccionadas para este usuario
  usuarioExamen.set(userId, {
    answered: false,
    questions: preguntasSeleccionadas
  });

  // Devolver preguntas sin respuestas correctas
  const preguntasPublicas = preguntasSeleccionadas.map(({ id, text, options }) => ({
    id,
    text,
    options
  }));

  console.log(`Examen iniciado por usuario: ${userId}`);
  return res.status(200).json({
    message: "Preguntas listas. ¡Éxito!",
    questions: preguntasPublicas
  });
};

// Recibir y evaluar respuestas
const submitAnswers = (req, res) => {
  const name = req.body && req.body.name ? req.body.name : "PONER OTRO NOMBRE";
  const userId = req.userId;
  const examData = usuarioExamen.get(userId);

  console.log(`Acceso al /api/preguntas/submit y ${name}`);
  console.log("Request body (submit) recibido del front (JSON con respuestas):", JSON.stringify(req.body, null, 2));

  if (!examData) {
    return res.status(400).json({ message: "No hay examen activo para este usuario." });
  }

  if (examData.answered) {
    return res.status(403).json({ message: "El examen solo se puede aplicar una vez" });
  }

  const userAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];

  let score = 0;
  const details = [];

  for (const q of examData.questions) {
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

  // Marcar examen como respondido
  examData.answered = true;

  const responseBody = {
    message: "Respuestas evaluadas.",
    score,
    total: examData.questions.length,
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