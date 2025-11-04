const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET lista tutti gli utenti (solo admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const utenti = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(utenti);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore recupero utenti' });
  }
});

// PUT aggiorna ruolo utente (solo admin)
router.put('/:id/ruolo', adminAuth, async (req, res) => {
  try {
    const { ruolo } = req.body;
    
    if (!['user', 'admin'].includes(ruolo)) {
      return res.status(400).json({ errore: 'Ruolo non valido' });
    }
    
    const utente = await User.findByIdAndUpdate(
      req.params.id,
      { ruolo },
      { new: true }
    ).select('-password');
    
    if (!utente) {
      return res.status(404).json({ errore: 'Utente non trovato' });
    }
    
    res.json(utente);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore aggiornamento ruolo' });
  }
});

// DELETE elimina utente (solo admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const utente = await User.findByIdAndDelete(req.params.id);
    if (!utente) {
      return res.status(404).json({ errore: 'Utente non trovato' });
    }
    res.json({ messaggio: 'Utente eliminato' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore eliminazione utente' });
  }
});

// PUT aggiorna tema utente (tutti gli utenti per se stessi)
router.put('/me/tema', auth, async (req, res) => {
  try {
    const { tema } = req.body;
    
    if (!['light', 'dark', 'green', 'purple'].includes(tema)) {
      return res.status(400).json({ errore: 'Tema non valido' });
    }
    
    const utente = await User.findByIdAndUpdate(
      req.utente_id,
      { tema },
      { new: true }
    ).select('-password');
    
    res.json(utente);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore aggiornamento tema' });
  }
});

// GET info utente corrente
router.get('/me', auth, async (req, res) => {
  try {
    const utente = await User.findById(req.utente_id).select('-password');
    res.json(utente);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore recupero utente' });
  }
});

module.exports = router;
