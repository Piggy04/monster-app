// routes/bevute.js
const express = require('express');
const Bevuta = require('../models/Bevuta');
const Variante = require('../models/Variante');
const router = express.Router();

// GET /api/bevute - Lista bevute (solo admin/beta)
router.get('/', async (req, res) => {
  try {
    if (!['admin', 'beta'].includes(req.user?.ruolo)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    const bevute = await Bevuta.find()
      .populate('varianteId', 'nome')
      .sort({ data: -1 })
      .limit(100);
    
    res.json(bevute.map(b => ({
      _id: b._id,
      nome: b.varianteId.nome,
      stato: b.stato,
      data: b.data.toISOString().split('T')[0],
      ora: b.data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      note: b.note,
      utenteId: b.utenteId
    })));
  } catch(err) {
    res.status(500).json({ error: 'Errore bevute' });
  }
});

// POST /api/bevute - Nuova bevuta
router.post('/', async (req, res) => {
  try {
    const { varianteId, stato, note } = req.body;
    
    if (!['admin', 'beta'].includes(req.user?.ruolo)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    const bevuta = new Bevuta({
      varianteId,
      stato,
      note: note || '',
      utenteId: req.user._id,
      data: new Date()
    });
    
    await bevuta.save();
    
    // Aggiorna contatore bevute variante
    await Variante.findByIdAndUpdate(varianteId, { 
      $inc: { contatoreBevute: 1 } 
    });
    
    res.json({ success: true, message: 'Bevuta salvata!' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Errore salvataggio' });
  }
});

module.exports = router;
