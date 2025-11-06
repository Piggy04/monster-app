const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Possesso = require('../models/Possesso');
const Lattina = require('../models/Lattina');
const Variante = require('../models/Variante');

router.get('/', auth, async (req, res) => {
  try {
    console.log('1. req.user.id:', req.user.id);
    
    // Conta i possessi dell'utente (varianti possedute)
    const possessiUtente = await Possesso.find({
      utente_id: req.user.id,
      posseduta: true
    });
    
    console.log('2. Possessi trovati:', possessiUtente.length);
    
    const variantiPosseduteCount = possessiUtente.length;
    
    // Conta le lattine uniche possedute (dai possessi)
    const variantiIds = possessiUtente.map(p => p.variante_id);
    const varianti = await Variante.find({ _id: { $in: variantiIds } });
    
    // Estrai le lattine_id uniche dalle varianti
    const lattineIds = [...new Set(varianti.map(v => v.lattina_id.toString()))];
    const mostriPossedutiCount = lattineIds.length;
    
    // Conta i mostri totali
    const mostriTotali = await Lattina.countDocuments();
    console.log('3. Mostri totali:', mostriTotali);
    
    const percentuale = mostriTotali > 0
      ? Math.round((mostriPossedutiCount / mostriTotali) * 100)
      : 0;
    
    console.log('4. Mostri posseduti:', mostriPossedutiCount);
    console.log('5. Varianti possedute:', variantiPosseduteCount);
    console.log('6. Percentuale:', percentuale);
    
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
