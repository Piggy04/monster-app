const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const betaAuth = require('../middleware/betaAuth'); // ← AGGIUNGI QUESTO
const Log = require('../models/Log');

// GET - Ultimi log dell'utente (SOLO BETA/ADMIN)
router.get('/', betaAuth, async (req, res) => {  // ← CAMBIATO DA auth A betaAuth
  try {
    const limite = req.query.limite || 50;
    
    const log = await Log.find({ utente_id: req.user.id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limite));
    
    res.json(log);
  } catch (errore) {
    console.error('Errore caricamento log:', errore);
    res.status(500).json({ errore: 'Errore nel recupero log' });
  }
});

// POST - Crea nuovo log (interno, chiamato da altre route)
router.post('/crea', auth, async (req, res) => {  // ← QUESTO RESTA auth
  try {
    const { azione, tipo, descrizione, dettagli } = req.body;
    
    const log = new Log({
      utente_id: req.user.id,
      azione,
      tipo,
      descrizione,
      dettagli
    });
    
    await log.save();
    res.status(201).json(log);
  } catch (errore) {
    console.error('Errore creazione log:', errore);
    res.status(500).json({ errore: 'Errore nel salvataggio log' });
  }
});

// GET - Conta log non letti (SOLO BETA/ADMIN)
router.get('/non-letti', betaAuth, async (req, res) => {  // ← CAMBIATO DA auth A betaAuth
  try {
    const ultimoAccesso = req.user.ultimoAccesso || new Date(0);
    
    const nonLetti = await Log.countDocuments({
      utente_id: req.user.id,
      timestamp: { $gt: ultimoAccesso }
    });
    
    res.json({ nonLetti });
  } catch (errore) {
    console.error('Errore conteggio log:', errore);
    res.status(500).json({ errore: 'Errore nel conteggio' });
  }
});

module.exports = router;
