const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ⬇️ AGGIUNGI questa import

module.exports = async function(req, res, next) { // ⬇️ AGGIUNGI async
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ errore: 'Accesso negato, token mancante' });
  }

  try {
    const verificato = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: verificato.id, ruolo: verificato.ruolo };
    
    // ⬇️ AGGIUNGI queste 2 righe - aggiorna ultimo accesso
    await User.findByIdAndUpdate(verificato.id, { lastSeen: new Date() });
    
    next();
  } catch (errore) {
    res.status(401).json({ errore: 'Token non valido' });
  }
};
