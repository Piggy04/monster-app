const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ errore: 'Username già usato' });
    
    user = new User({ username, email: username + '@temp.com', password });
    await user.save();
    
    const token = jwt.sign({ id: user._id, ruolo: user.ruolo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username, ruolo: user.ruolo, tema: user.tema });
  } catch (err) {
    res.status(500).json({ errore: 'Errore registrazione' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ errore: 'Credenziali non valide' });
    
    const validPassword = await user.verificaPassword(password);
    if (!validPassword) return res.status(400).json({ errore: 'Credenziali non valide' });
    
    const token = jwt.sign({ id: user._id, ruolo: user.ruolo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, ruolo: user.ruolo, tema: user.tema });
  } catch (err) {
    res.status(500).json({ errore: 'Errore login' });
  }
});

module.exports = router;
