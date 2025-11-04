const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utente = require('../models/Utente');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let utente = await Utente.findOne({ username });
    if (utente) return res.status(400).json({ errore: 'Username già usato' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    utente = new Utente({ username, email: username + '@temp.com', password: hashedPassword });
    await utente.save();
    
    const token = jwt.sign({ id: utente._id, ruolo: utente.ruolo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: utente.username, ruolo: utente.ruolo, tema: utente.tema });
  } catch (err) {
    res.status(500).json({ errore: 'Errore registrazione' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const utente = await Utente.findOne({ username });
    if (!utente) return res.status(400).json({ errore: 'Credenziali non valide' });
    
    const validPassword = await bcrypt.compare(password, utente.password);
    if (!validPassword) return res.status(400).json({ errore: 'Credenziali non valide' });
    
    const token = jwt.sign({ id: utente._id, ruolo: utente.ruolo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: utente.username, ruolo: utente.ruolo, tema: utente.tema });
  } catch (err) {
    res.status(500).json({ errore: 'Errore login' });
  }
});

module.exports = router;
