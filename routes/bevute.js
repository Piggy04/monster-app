const express = require('express');
const router = express.Router();
const Bevuta = require('../models/Bevuta');
const authenticateToken = require('../middleware/auth'); // ← Usa il tuo middleware esistente

// ===== GET - Bevute dell'utente loggato =====
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bevute = await Bevuta.find({ utenteId: req.user.id }) // ← FILTRO per utente
      .populate('varianteId', 'nome immagine')
      .sort({ data: -1 })
      .limit(100);
    
    // Aggiungi nome variante
    const conNome = bevute.map(b => ({
      ...b._doc,
      nome: b.varianteId?.nome || 'Sconosciuta'
    }));
    
    res.json(conNome);
  } catch(err) {
    console.error('Errore GET bevute:', err);
    res.status(500).json({ errore: 'Errore caricamento bevute' });
  }
});

// ===== POST - Aggiungi bevuta per utente loggato =====
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { varianteId, stato, note } = req.body;
    
    // Validazione
    if (!varianteId) {
      return res.status(400).json({ errore: 'varianteId mancante' });
    }
    
    // Crea bevuta con ID utente autenticato
    const bevuta = new Bevuta({ 
      varianteId, 
      stato: stato || 'bevuta',
      note: note || '',
      utenteId: req.user.id, // ← SALVA ID utente dal token JWT
      ora: new Date().toLocaleTimeString('it-IT')
    });
    
    await bevuta.save();
    
    // Log attività
    const Log = require('../models/Log');
    await Log.create({
      utente_id: req.user.id,
      azione: 'aggiunto',
      tipo: 'collezione',
      descrizione: `Ha segnato una bevuta come ${stato || 'bevuta'}`,
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
      utenteId: req.user.id // ← VERIFICA che sia dell'utente
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

// GET - Bevute raggruppate per variante (con contatore)
router.get('/raggruppate', authenticateToken, async (req, res) => {
  try {
    const bevute = await Bevuta.aggregate([
      { $match: { utenteId: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$varianteId',
          conteggio: { $sum: 1 },
          ultimaBevuta: { $max: '$data' },
          stati: { $push: '$stato' }
        }
      },
      {
        $lookup: {
          from: 'variantes',
          localField: '_id',
          foreignField: '_id',
          as: 'variante'
        }
      },
      { $unwind: { path: '$variante', preserveNullAndEmptyArrays: true } },
      { $sort: { ultimaBevuta: -1 } }
    ]);

    res.json(bevute);
  } catch (err) {
    console.error('Errore bevute raggruppate:', err);
    res.status(500).json({ errore: 'Errore caricamento' });
  }
});


// ===== GET - Statistiche bevute utente =====
router.get('/statistiche', authenticateToken, async (req, res) => {
  try {
    const totali = await Bevuta.countDocuments({ utenteId: req.user.id });
    const bevute = await Bevuta.countDocuments({ utenteId: req.user.id, stato: 'bevuta' });
    const assaggiate = await Bevuta.countDocuments({ utenteId: req.user.id, stato: 'assaggiata' });
    const finteBevute = await Bevuta.countDocuments({ utenteId: req.user.id, stato: 'fatta-finta' });
    
    res.json({
      totali,
      bevute,
      assaggiate,
      finteBevute
    });
  } catch(err) {
    console.error('Errore statistiche bevute:', err);
    res.status(500).json({ errore: 'Errore caricamento statistiche' });
  }
});

module.exports = router;
