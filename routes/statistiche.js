const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Mostro = require('../models/Mostro');
const Variante = require('../models/Variante');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('collezione');
    
    // Conta mostri posseduti
    const mostriPosseduti = user.collezione.length;
    
    // Conta varianti totali dell'utente
    const varianti = await Variante.find({ 
      mostro: { $in: user.collezione } 
    });
    const variantiTotali = varianti.length;
    
    // Conta mostri totali nel gioco
    const mostriTotali = await Mostro.countDocuments();
    
    // Percentuale completamento
    const percentuale = Math.round((mostriPosseduti / mostriTotali) * 100);
    
    res.json({
      mostriPosseduti,
      mostriTotali,
      variantiTotali,
      percentuale
    });
  } catch (err) {
    res.status(500).json({ errore: 'Errore statistiche' });
  }
});

module.exports = router;
