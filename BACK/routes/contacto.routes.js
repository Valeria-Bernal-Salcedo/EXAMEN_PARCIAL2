const express = require('express');
const router = express.Router();
const { enviarMensaje } = require('../controllers/contacto.controller');

// Ruta pública: POST /api/contacto
router.post('/', enviarMensaje);

module.exports = router;