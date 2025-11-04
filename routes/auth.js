const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const esistenteEmail = await User.findOne({ email });
    if (esistenteEmail) {
      return res.status(400).json({ errore: 'Email già registrata' });
    }

    const esistenteUsername = await User.findOne({ username });
    if (esistenteUsername) {
      return res.status(400).json({ errore: 'Username già in uso' });
    }

    const nuovoUtente = new User({ username, email, password });
    await nuovoUtente.save();

    const token = jwt.sign(
      { id: nuovoUtente._id, ruolo: nuovoUtente.ruolo }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      messaggio: 'Registrazione completata',
      token,
      utente: { 
        id: nuovoUtente._id, 
        username: nuovoUtente.username,
        email: nuovoUtente.email,
        ruolo: nuovoUtente.ruolo
      }
    });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore durante registrazione' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const utente = await User.findOne({ email });
    if (!utente) {
      return res.status(401).json({ errore: 'Credenziali non valide' });
    }

    const passwordValida = await utente.verificaPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ errore: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: utente._id, ruolo: utente.ruolo }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      messaggio: 'Login effettuato',
      token,
      utente: { 
        id: utente._id, 
        username: utente.username,
        email: utente.email,
        ruolo: utente.ruolo
      }
    });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore durante login' });
  }
});

module.exports = router;
