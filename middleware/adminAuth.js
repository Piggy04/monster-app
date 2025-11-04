const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ errore: 'Accesso negato, token mancante' });
  }

  try {
    const verificato = jwt.verify(token, process.env.JWT_SECRET);
    
    if (verificato.ruolo !== 'admin') {
      return res.status(403).json({ errore: 'Accesso negato: solo admin' });
    }
    
    req.user = { id: verificato.id, ruolo: verificato.ruolo };  // ← CAMBIA QUI
    next();
  } catch (errore) {
    res.status(401).json({ errore: 'Token non valido' });
  }
};
