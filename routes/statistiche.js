const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Mostro = require('../models/Lattina');
const Variante = require('../models/Variante');

router.get('/', auth, async (req, res) => {
  try {
    console.log('1. req.user.id:', req.user.id);
    
    const user = await User.findById(req.user.id).populate('collezione');
    console.log('2. User trovato:', user);
    console.log('3. Collezione:', user?.collezione);
    
    const mostriPosseduti = user.collezione.length;
    console.log('4. Mostri posseduti:', mostriPosseduti);
    
    const varianti = await Variante.find({ 
      lattina: { $in: user.collezione }
    });
    console.log('5. Varianti trovate:', varianti.length);
    
    const variantiTotali = varianti.length;
    
    const mostriTotali = await Mostro.countDocuments();
    console.log('6. Mostri totali:', mostriTotali);
    
    const percentuale = mostriTotali > 0 ? Math.round((mostriPosseduti / mostriTotali) * 100) : 0;
    console.log('7. Percentuale:', percentuale);
    
    res.json({
      mostriPosseduti,
      mostriTotali,
      variantiTotali,
      percentuale
    });
  } catch (err) {
    console.error('❌ ERRORE STATISTICHE:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ errore: 'Errore statistiche', dettagli: err.message });
  }
});

module.exports = router;
