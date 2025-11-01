const express = require("express");
const authRoutes = require("./routes/auth.routes");
const preguntasRoutes = require("./routes/preguntas.routes");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares mínimos
app.use(express.json());
// app.use(cors());

const ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

app.use(cors({ 
  origin: function (origin, callback) {
    
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true); // null = sin error, true = permitido
    }
    // Si el origen no está permitido, se rechaza la solicitud con un mensaje de error.
    return callback(new Error('Not allowed by CORS: ' + origin));
  },

  // Especifica los métodos HTTP que este servidor aceptará.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

  // Algunos navegadores antiguos esperan un código 200 (en lugar de 204) en respuestas "preflight".
  optionsSuccessStatus: 200
}));


// Montar rutas bajo /api
app.use("/api/auth", authRoutes);
app.use("/api/preguntas", preguntasRoutes);

// Para verificar que el servidor responde
app.get("/", (req, res) => {
    res.send("✅ Servidor Node.js funcionando correctamente");
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;