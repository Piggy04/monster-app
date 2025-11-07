const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const User = require('../models/User');

// ===== ROUTE PUBBLICHE (AUTH) =====

// GET info utente corrente
router.get('/me', auth, async (req, res) => {
  try {
    const utente = await User.findById(req.user.id).select('-password');
    res.json(utente);
  } catch (errore) {
    console.error('Errore recupero utente:', errore);
    res.status(500).json({ errore: 'Errore recupero utente' });
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
      req.user.id,
      { tema },
      { new: true }
    ).select('-password');
    
    res.json(utente);
  } catch (errore) {
    console.error('Errore aggiornamento tema:', errore);
    res.status(500).json({ errore: 'Errore aggiornamento tema' });
  }
});

// ===== ROUTE ADMIN =====

// GET lista tutti gli utenti (solo admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const utenti = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(utenti);
  } catch (errore) {
    console.error('Errore recupero utenti:', errore);
    res.status(500).json({ errore: 'Errore recupero utenti' });
  }
});

// PUT - Cambia ruolo utente (SOLO ADMIN)
router.put('/:id/ruolo', adminAuth, async (req, res) => {
  try {
    const { ruolo } = req.body;
    
    if (!['user', 'beta', 'admin'].includes(ruolo)) {
      return res.status(400).json({ errore: 'Ruolo non valido' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ruolo },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ errore: 'Utente non trovato' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Errore cambio ruolo:', err);
    res.status(500).json({ errore: 'Errore nel cambio ruolo' });
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
    console.error('Errore eliminazione utente:', errore);
    res.status(500).json({ errore: 'Errore eliminazione utente' });
  }
});

module.exports = router;
