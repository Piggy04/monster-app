const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Mostro = require('../models/Lattina');
const Variante = require('../models/Variante');

router.get('/', auth, async (req, res) => {
  try {
    console.log('1. req.user.id:', req.user.id);
    // Carica utente con popolamento
    const user = await User.findById(req.user.id)
      .populate('mostriPosseduti')
      .populate('variantiPossedute');

    console.log('2. User trovato:', user);
    console.log('3. Mostri posseduti:', user?.mostriPosseduti);
    console.log('4. Varianti possedute:', user?.variantiPossedute);

    const mostriPossedutiCount = user?.mostriPosseduti ? user.mostriPosseduti.length : 0;
    const variantiPosseduteCount = user?.variantiPossedute ? user.variantiPossedute.length : 0;

    const mostriTotali = await Mostro.countDocuments();
    console.log('5. Mostri totali:', mostriTotali);

    const percentuale = mostriTotali > 0
      ? Math.round((mostriPossedutiCount / mostriTotali) * 100)
      : 0;

    res.json({
      mostriPosseduti: mostriPossedutiCount,
      variantiPossedute: variantiPosseduteCount,
      mostriTotali,
      percentuale
    });
  } catch (err) {
    console.error('❌ ERRORE STATISTICHE:', err.message);
    res.status(500).json({ errore: 'Errore statistiche', dettagli: err.message });
  }
});

module.exports = router;
