const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ errore: 'Accesso negato. Token mancante.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ errore: 'Utente non trovato' });
    }
    
    // Controlla se è beta o admin
    if (user.ruolo !== 'beta' && user.ruolo !== 'admin') {
      return res.status(403).json({ errore: 'Accesso riservato a Beta Tester e Admin' });
    }
    
    req.user = { id: user._id, ruolo: user.ruolo };
    next();
  } catch (err) {
    console.error('Errore autenticazione beta:', err);
    res.status(401).json({ errore: 'Token non valido' });
  }
};
