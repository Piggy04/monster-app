const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');  // ← Aggiungi questo

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

// GET profilo utente + tema
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      username: user.username,
      tema: user.tema
    });
  } catch (err) {
    res.status(500).json({ errore: 'Errore' });
  }
});

// PUT cambio tema
router.put('/me/tema', auth, async (req, res) => {
  try {
    const { tema } = req.body;
    
    if (!['light', 'dark', 'green', 'purple'].includes(tema)) {
      return res.status(400).json({ errore: 'Tema non valido' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { tema },
      { new: true }
    );
    
    res.json({ tema: user.tema });
  } catch (err) {
    res.status(500).json({ errore: 'Errore cambio tema' });
  }
});

// PUT - Cambia username
router.put('/cambia-username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ errore: 'Username deve avere almeno 3 caratteri' });
    }
    
    // Verifica che l'username non esista già
    const esiste = await User.findOne({ username });
    if (esiste) {
      return res.status(400).json({ errore: 'Username già in uso' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Errore cambio username:', err);
    res.status(500).json({ errore: 'Errore nel cambio username' });
  }
});

// PUT - Cambia email
router.put('/cambia-email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ errore: 'Email non valida' });
    }
    
    // Verifica che l'email non esista già
    const esiste = await User.findOne({ email });
    if (esiste) {
      return res.status(400).json({ errore: 'Email già in uso' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Errore cambio email:', err);
    res.status(500).json({ errore: 'Errore nel cambio email' });
  }
});

// PUT - Cambia password
router.put('/cambia-password', auth, async (req, res) => {
  try {
    const { passwordVecchia, nuovaPassword } = req.body;
    
    if (!passwordVecchia || !nuovaPassword) {
      return res.status(400).json({ errore: 'Compila tutti i campi' });
    }
    
    if (nuovaPassword.length < 4) {  // ← CAMBIATO da 6 a 4
      return res.status(400).json({ errore: 'Password deve avere almeno 4 caratteri' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Verifica password vecchia
    const valida = await user.comparePassword(passwordVecchia);
    if (!valida) {
      return res.status(401).json({ errore: 'Password attuale non corretta' });
    }
    
    user.password = nuovaPassword;
    await user.save();
    
    res.json({ messaggio: 'Password aggiornata con successo' });
  } catch (err) {
    console.error('Errore cambio password:', err);
    res.status(500).json({ errore: 'Errore nel cambio password' });
  }
});


// DELETE - Elimina account
router.delete('/elimina-account', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ messaggio: 'Account eliminato' });
  } catch (err) {
    console.error('Errore eliminazione account:', err);
    res.status(500).json({ errore: 'Errore nell\'eliminazione' });
  }
});


module.exports = router;
