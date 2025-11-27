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

// ✅ NUOVO: GET avatar utente corrente
router.get('/avatar', auth, async (req, res) => {
  try {
    const utente = await User.findById(req.user.id).select('avatar');
    res.json({ avatar: utente.avatar });
  } catch (errore) {
    console.error('Errore recupero avatar:', errore);
    res.status(500).json({ errore: 'Errore recupero avatar' });
  }
});

// ✅ NUOVO: PUT aggiorna avatar utente
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    if (!avatarUrl || !avatarUrl.startsWith('https://')) {
      return res.status(400).json({ errore: 'URL avatar non valido' });
    }
    
    const utente = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ 
      avatar: utente.avatar, 
      messaggio: 'Avatar aggiornato con successo!' 
    });
  } catch (errore) {
    console.error('Errore aggiornamento avatar:', errore);
    res.status(500).json({ errore: 'Errore aggiornamento avatar' });
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
      .sort({ lastSeen: -1 });
    
    const utentiConStato = utenti.map(u => {
      const ora = Date.now();
      const lastSeenTime = u.lastSeen ? u.lastSeen.getTime() : 0;
      const minutiFa = (ora - lastSeenTime) / 60000;
      
      let testoStato;
      if (!u.lastSeen) {
        testoStato = 'Mai connesso';
      } else if (minutiFa < 5) {
        testoStato = 'Online';
      } else if (minutiFa < 60) {
        testoStato = `${Math.floor(minutiFa)} min fa`;
      } else if (minutiFa < 1440) {
        testoStato = `${Math.floor(minutiFa / 60)} ore fa`;
      } else {
        testoStato = u.lastSeen.toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
      
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        ruolo: u.ruolo,
        tema: u.tema,
        avatar: u.avatar, // ✅ AGGIUNTO
        lastSeen: u.lastSeen,
        isOnline: minutiFa < 5,
        testoStato: testoStato,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        mostriPosseduti: u.mostriPosseduti,
        variantiPossedute: u.variantiPossedute
      };
    });
    
    res.json(utentiConStato);
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
