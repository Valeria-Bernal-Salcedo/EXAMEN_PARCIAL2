/* API RUTAS */

const express = require("express");
const { login, logout, getProfile } = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Ruta pública: POST /api/login
router.post("/login", login);

// Rutas protegidas (requieren token)
// POST /api/logout - Cerrar sesión
router.post("/logout", verifyToken, logout);

// GET /api/profile - Obtener perfil del usuario autenticado
router.get("/profile", verifyToken, getProfile);

module.exports = router;