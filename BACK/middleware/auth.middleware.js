/* MIDDLEWARE SESIONES */

// Estructura: { token: userId }
const sessions = new Map();

exports.verifyToken = (req, res, next) => {
  // Obtener el header Authorization
  const authHeader = req.headers.authorization;

  // Verificar que exista y tenga el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Token no proporcionado o formato incorrecto',
      formato_esperado: 'Authorization: Bearer <token>' 
    });
  }

  // Extraer el token (remover 'Bearer ')
  const token = authHeader.substring(7);

  // Verificar si el token existe en las sesiones activas
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }

  // Agregar la información del usuario al request para uso posterior
  req.userId = userId;
  req.token = token;

  // Continuar con la siguiente función
  next();
};

exports.createSession = (userId) => {
  const crypto = require('crypto');
  // Usar crypto.randomUUID cuando esté disponible (Node 14.17+).
  // Si no está disponible, hacer fallback a randomBytes para compatibilidad.
  const token = (typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);
  return token;
};
 
exports.deleteSession = (token) => {
  return sessions.delete(token);
};

exports.getActiveSessions = () => {
  return sessions.size;
};

exports.clearAllSessions = () => {
  sessions.clear();
};

exports.sessions = sessions;


