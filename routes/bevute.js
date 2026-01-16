const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Bevuta Schema semplice
const BevutaSchema = new mongoose.Schema({
  varianteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variante' },
  stato: { type: String, enum: ['bevuta', 'assaggiata', 'fatta-finta'], default: 'bevuta' },
  note: String,
  utenteId: { type: String, default: 'anonimo' },
  data: { type: Date, default: Date.now },
  ora: String
});

const Bevuta = mongoose.models.Bevuta || mongoose.model('Bevuta', BevutaSchema);

router.get('/', async (req, res) => {
  try {
    const bevute = await Bevuta.find()
      .populate('varianteId', 'nome')
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
    res.status(500).json({ error: 'Errore bevute' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { varianteId, stato, note } = req.body;
    const bevuta = new Bevuta({ varianteId, stato, note });
    await bevuta.save();
    res.json({ success: true });
  } catch(err) {
    console.error('Errore POST bevuta:', err);
    res.status(500).json({ error: 'Errore salvataggio' });
  }
});

module.exports = router;
