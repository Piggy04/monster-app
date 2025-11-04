const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ errore: 'Accesso negato, token mancante' });
  }

  try {
    const verificato = jwt.verify(token, process.env.JWT_SECRET);
    req.utente_id = verificato.id;
    next();
  } catch (errore) {
    res.status(401).json({ errore: 'Token non valido' });
  }
};
