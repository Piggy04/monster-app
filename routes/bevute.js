const express = require('express');
const Bevuta = require('../models/Bevuta');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const bevute = await Bevuta.find()
      .populate('varianteId', 'nome')
      .sort({ data: -1 })
      .limit(100);
    res.json(bevute);
  } catch(err) {
    res.status(500).json({ error: 'Errore' });
  }
});

router.post('/', async (req, res) => {
  try {
    const bevuta = new Bevuta({
      ...req.body,
      utenteId: req.user?._id || 'anonimo', // Funziona anche senza login
      data: new Date()
    });
    await bevuta.save();
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Errore' });
  }
});

module.exports = router;
