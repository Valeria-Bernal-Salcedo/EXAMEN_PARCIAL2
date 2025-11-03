const QUESTIONS = require("../data/preguntas");
const { sessions } = require("../middleware/auth.middleware");

const PDFDocument = require("pdfkit");

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
  let resultado;
  if(score<7){
    resultado = "Reprobado";  
  }else{
    resultado = "Aprobado";
  }

  const responseBody = {
    message: "Respuestas evaluadas.",
    resultado,
    score,
    total: examData.questions.length,
    details
  };

  // Log: mostramos en consola del servidor la respuesta completa antes de enviarla
  console.log("Respuesta del servidor (submit):", JSON.stringify(responseBody, null, 2));

  return res.status(200).json(responseBody);
};

async function generarCertificado(req, res) {
  const userId = req.userId;
  let { cert, score, total, nombre } = req.body;

  const companyName = req.body.companyName || 'SkillByte';
  const companyLogoUrl = req.body.companyLogoUrl || ''; 
  const instructorSignatureUrl = req.body.instructorSignatureUrl || '';
  const ceoSignatureUrl = req.body.ceoSignatureUrl || '';

  const INSTRUCTOR_NAME = 'Vanessa Carolina Torres Rojas';
  const CEO_NAME = 'Valeria Bernal Salcedo';

  nombre = typeof nombre === 'string' ? nombre : String(nombre || 'Usuario');
  score = Number(score) || 0;   // Verifica que sean numeros, si es cadena ("8") lo pasa a numero (8), pero si es como tal cadena (hola) deja el valor en 0
  total = Number(total) || 0;

  // Requisito para obtener certificado
  const aprobado = Number(score) >= 7;
  if (!aprobado) {
    return res.status(400).json({ message: 'No puedes generar un certificado sin aprobar el examen.' });
  }

  // --- Helpers para imágenes ---
  async function fetchImageBuffer(url) {
    if (!url) return null;  
    try {
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) {
        console.warn('No se pudo descargar imagen:', url, resp.status);
        return null;
      }
      const arrayBuffer = await resp.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.warn('Error descargando imagen:', url, err && err.message);
      return null;
    }
  }

  // Si el front envía base64 en el body, admite también:
  function bufferFromBase64DataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const m = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!m) return null;
    return Buffer.from(m[2], 'base64');
  }

  // Priorizar base64 si viene, sino descargar por URL
  const logoBufFromBase64 = bufferFromBase64DataUrl(req.body.companyLogoBase64);
  const instructorBufFromBase64 = bufferFromBase64DataUrl(req.body.instructorSignatureBase64);
  const ceoBufFromBase64 = bufferFromBase64DataUrl(req.body.ceoSignatureBase64);

  
  let logoTask;
  if (logoBufFromBase64) {
    // ya tenemos el Buffer, envolver en promesa resuelta para mantener la misma interfaz
    logoTask = Promise.resolve(logoBufFromBase64);
  } else {
    logoTask = fetchImageBuffer(companyLogoUrl);
  }

  let instructorTask;
  if (instructorBufFromBase64) {
    instructorTask = Promise.resolve(instructorBufFromBase64);
  } else {
    instructorTask = fetchImageBuffer(instructorSignatureUrl);
  }

  let ceoTask;
  if (ceoBufFromBase64) {
    ceoTask = Promise.resolve(ceoBufFromBase64);
  } else {
    ceoTask = fetchImageBuffer(ceoSignatureUrl);
  }  

  const logoBuf = await logoTask;
  const instructorSigBuf = await instructorTask;
  const ceoSigBuf = await ceoTask;

  // --- Crear PDF ---
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const safeName = String(nombre).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
  res.setHeader('Content-Disposition', `attachment; filename=Certificado_${safeName}.pdf`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --- Header: logo a la izquierda y companyName a la derecha ---
  if (logoBuf) {
    try {
      doc.image(logoBuf, doc.page.margins.left, 50, { width: 90 });
    } catch (e) {
      console.warn('No se pudo dibujar logo header:', e && e.message);
    }
  }

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(companyName, doc.page.margins.left, 70, {
    width: pageWidth,
    align: 'right'
  });

  // --- Título principal ---
  doc.moveDown(5);
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#0b3b93').text('CERTIFICADO DE APROBACIÓN', doc.page.margins.left, null, {
    width: pageWidth,
    align: 'center'
  });

  // --- Subtitulo y destinatario ---
  doc.moveDown(1.6);
  doc.font('Helvetica').fontSize(12).fillColor('#000').text('Otorgado a:', doc.page.margins.left, null, {
    width: pageWidth,
    align: 'center'
  });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(22).text(nombre, doc.page.margins.left, null, {
    width: pageWidth,
    align: 'center'
  });

  // --- Certificación y puntaje ---
  doc.moveDown(0.9);
  if (cert) {
    doc.font('Helvetica').fontSize(13).text(`Por haber aprobado la certificación: ${cert}`, doc.page.margins.left, null, {
      width: pageWidth,
      align: 'center'
    });
  }
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(12).text(`Puntaje obtenido: ${score}/${total}`, doc.page.margins.left, null, {
    width: pageWidth,
    align: 'center'
  });

  // --- Ciudad y fecha ---
  const today = new Date();
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const fechaFormateada = today.toLocaleDateString('es-ES', dateOptions);
  const ciudad = 'Aguascalientes, Aguascalientes';
  doc.moveDown(0.9);
  doc.font('Helvetica').fontSize(11).text(`${ciudad} — Fecha: ${fechaFormateada}`, doc.page.margins.left, null, {
    width: pageWidth,
    align: 'center'
  });

  // --- Mensaje descriptivo ---
  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(11).fillColor('#222').text(
    'Por haber demostrado los conocimientos y habilidades requeridas en la evaluación correspondiente.',
    doc.page.margins.left,
    null,
    {
      align: 'center',
      width: pageWidth,
      lineGap: 4
    }
  );

  // --- Firmas: dibujar línea separadora encima de las firmas ---
  const footerY = doc.page.height - doc.page.margins.bottom - 140;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;

  // Línea separadora (ligera)
  doc.moveTo(doc.page.margins.left, footerY - 20)
    .lineTo(doc.page.width - doc.page.margins.right, footerY - 20)
    .lineWidth(0.5)
    .strokeColor('#dddddd')
    .stroke();

  // Firma instructor (izquierda)
  const leftX = doc.page.margins.left;
  const sigWidth = 140;
  const sigY = footerY - 10;
  if (instructorSigBuf) {
    try {
      doc.image(instructorSigBuf, leftX + (colWidth - sigWidth) / 2, sigY, { width: sigWidth });
    } catch (e) {
      console.warn('Error dibujando firma instructor:', e && e.message);
    }
  }
  
  // Nombre y cargo instructor
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000').text(INSTRUCTOR_NAME, leftX, footerY + 48, {
    width: colWidth,
    align: 'center'
  });
  doc.font('Helvetica').fontSize(10).text('Instructor', leftX, footerY + 64, { width: colWidth, align: 'center' });

  // Firma CEO (derecha)
  const rightX = doc.page.margins.left + colWidth;
  if (ceoSigBuf) {
    try {
      doc.image(ceoSigBuf, rightX + (colWidth - sigWidth) / 2, sigY, { width: sigWidth });
    } catch (e) {
      console.warn('Error dibujando firma CEO:', e && e.message);
    }
  }

  // Nombre y cargo CEO
  doc.font('Helvetica-Bold').fontSize(11).text(CEO_NAME, rightX, footerY + 48, {
    width: colWidth,
    align: 'center'
  });
  doc.font('Helvetica').fontSize(10).text('CEO', rightX, footerY + 64, { width: colWidth, align: 'center' });   

  // --- Footer pequeño (opcional: repetir empresa) ---
  doc.moveTo(0, doc.page.height - doc.page.margins.bottom - 8); // no visible, solo para posicion
  // doc.font('Helvetica').fontSize(9).fillColor('#777').text(companyName, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 30, { align: 'left' });

  doc.end();
}

module.exports = {
  startQuiz,
  submitAnswers,
  generarCertificado
};