const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Possesso = require('../models/Possesso');
const Lattina = require('../models/Lattina');
const Variante = require('../models/Variante');



// GET - Statistiche dell'utente loggato
router.get('/', auth, async (req, res) => {
  try {
    // Conta varianti possedute
    const possessiRaw = await Possesso.find({
      utente_id: req.user.id,
      posseduta: true
    }).select('variante_id');

    const variantiPossedute = possessiRaw.length;

    // Conta mostri posseduti (lattine uniche)
    const lattinePossedute = new Set();
    
    for (let possesso of possessiRaw) {
      const variante = await Variante.findById(possesso.variante_id);
      if (variante) {
        lattinePossedute.add(variante.lattina_id.toString());
      }
    }

    const mostriPosseduti = lattinePossedute.size;

    // Conta totali
    const mostriTotali = await Lattina.countDocuments();
    const variantiTotali = await Variante.countDocuments();

    // Calcola percentuale
    const percentuale = mostriTotali > 0 ? Math.round((mostriPosseduti / mostriTotali) * 100) : 0;

    res.json({
      mostriPosseduti,
      variantiPossedute,
      mostriTotali,
      variantiTotali,
      percentuale
    });
  } catch (errore) {
    console.error('Errore statistiche:', errore);
    res.status(500).json({ errore: 'Errore nel calcolo statistiche' });
  }
});



// GET - Statistiche di un altro utente (per amici)
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Conta varianti possedute
    const possessiRaw = await Possesso.find({
      utente_id: userId,
      posseduta: true
    }).select('variante_id');

    const variantiPossedute = possessiRaw.length;

    // Conta mostri posseduti (lattine uniche)
    const lattinePossedute = new Set();
    
    for (let possesso of possessiRaw) {
      const variante = await Variante.findById(possesso.variante_id);
      if (variante) {
        lattinePossedute.add(variante.lattina_id.toString());
      }
    }

    const mostriPosseduti = lattinePossedute.size;

    // Conta totali
    const mostriTotali = await Lattina.countDocuments();
    const variantiTotali = await Variante.countDocuments();

    // Calcola percentuale
    const percentuale = mostriTotali > 0 ? Math.round((mostriPosseduti / mostriTotali) * 100) : 0;

    res.json({
      mostriPosseduti,
      variantiPossedute,
      mostriTotali,
      variantiTotali,
      percentuale
    });
  } catch (errore) {
    console.error('Errore statistiche amico:', errore);
    res.status(500).json({ errore: 'Errore nel calcolo statistiche' });
  }
});



module.exports = router;
