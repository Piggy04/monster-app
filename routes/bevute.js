const express = require('express');
const router = express.Router();
const Bevuta = require('../models/Bevuta');
const authenticateToken = require('../middleware/auth');

// ===== GET - Bevute dell'utente loggato =====
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bevute = await Bevuta.find({ utenteId: req.user.id })
      .populate({
        path: 'varianteId',
        select: 'nome immagine lattina_id caffeina_mg calorie_kcal zuccheri_g', // ← AGGIUNGI campi nutrizionali
        populate: {
          path: 'lattina_id',
          select: 'nome'
        }
      })
      .sort({ data: -1 });
    
    res.json(bevute);
  } catch(err) {
    console.error('Errore GET bevute:', err);
    res.status(500).json({ errore: 'Errore caricamento bevute' });
  }
});

// ===== POST - Aggiungi bevuta per utente loggato =====
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { varianteId, note } = req.body; // ← RIMOSSO stato
    
    if (!varianteId) {
      return res.status(400).json({ errore: 'varianteId mancante' });
    }
    
    const bevuta = new Bevuta({ 
      varianteId, 
      note: note || '',
      utenteId: req.user.id,
      ora: new Date().toLocaleTimeString('it-IT')
    });
    
    await bevuta.save();
    
    // Log attività
    const Log = require('../models/Log');
    await Log.create({
      utente_id: req.user.id,
      azione: 'aggiunto',
      tipo: 'collezione',
      descrizione: 'Ha bevuto una Monster',
      dettagli: {
        variante_id: varianteId
      }
    }).catch(err => console.log('Errore log:', err));
    
    res.json({ success: true, bevuta });
  } catch(err) {
    console.error('Errore POST bevuta:', err);
    res.status(500).json({ errore: 'Errore salvataggio bevuta' });
  }
});

// ===== DELETE - Rimuovi bevuta =====
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const bevuta = await Bevuta.findOne({ 
      _id: req.params.id, 
      utenteId: req.user.id
    });
    
    if (!bevuta) {
      return res.status(404).json({ errore: 'Bevuta non trovata o non autorizzato' });
    }
    
    await bevuta.deleteOne();
    
    // Log attività
    const Log = require('../models/Log');
    await Log.create({
      utente_id: req.user.id,
      azione: 'rimosso',
      tipo: 'collezione',
      descrizione: 'Ha rimosso una bevuta'
    }).catch(err => console.log('Errore log:', err));
    
    res.json({ success: true });
  } catch(err) {
    console.error('Errore DELETE bevuta:', err);
    res.status(500).json({ errore: 'Errore eliminazione bevuta' });
  }
});

// ===== GET - Statistiche nutrizionali =====
router.get('/statistiche', authenticateToken, async (req, res) => {
  try {
    const bevute = await Bevuta.find({ utenteId: req.user.id })
      .populate('varianteId', 'caffeina_mg calorie_kcal zuccheri_g');
    
    const totali = bevute.length;
    
    let caffeinaTotale = 0;
    let calorieTotali = 0;
    let zuccheriTotali = 0;
    
    bevute.forEach(b => {
      if (b.varianteId) {
        caffeinaTotale += b.varianteId.caffeina_mg || 0;
        calorieTotali += b.varianteId.calorie_kcal || 0;
        zuccheriTotali += b.varianteId.zuccheri_g || 0;
      }
    });
    
    res.json({
      totali,
      caffeinaTotale,
      calorieTotali,
      zuccheriTotali
    });
  } catch(err) {
    console.error('Errore statistiche bevute:', err);
    res.status(500).json({ errore: 'Errore caricamento statistiche' });
  }
});

module.exports = router;
