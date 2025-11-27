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

const Log = require('../models/Log'); // ← Aggiungi import in cima

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
    
    const vecchioUsername = (await User.findById(req.user.id)).username;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    ).select('-password');
    
    // ✅ SALVA LOG
    await Log.create({
      utente_id: req.user.id,
      azione: 'cambio_username',
      tipo: 'account',
      descrizione: `Hai cambiato username da "${vecchioUsername}" a "${username}"`,
      dettagli: {
        vecchio_username: vecchioUsername,
        nuovo_username: username
      }
    });
    
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
    
    const vecchiaEmail = (await User.findById(req.user.id)).email;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email },
      { new: true }
    ).select('-password');
    
    // ✅ SALVA LOG
    await Log.create({
      utente_id: req.user.id,
      azione: 'cambio_email',
      tipo: 'account',
      descrizione: `Hai cambiato email`,
      dettagli: {
        vecchia_email: vecchiaEmail,
        nuova_email: email
      }
    });
    
    res.json(user);
  } catch (err) {
    console.error('Errore cambio email:', err);
    res.status(500).json({ errore: 'Errore nel cambio email' });
  }
});

// PUT - Cambia password
router.put('/cambia-password', auth, async (req, res) => {
  try {
    console.log('🎯 /cambia-password body:', req.body);
    console.log('🎯 /cambia-password user id:', req.user?.id);

    const { passwordVecchia, nuovaPassword } = req.body;
    
    if (!passwordVecchia || !nuovaPassword) {
      return res.status(400).json({ errore: 'Compila tutti i campi' });
    }
    
    if (nuovaPassword.length < 4) {
      return res.status(400).json({ errore: 'Password deve avere almeno 4 caratteri' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ Utente non trovato per id', req.user.id);
      return res.status(404).json({ errore: 'Utente non trovato' });
    }

    console.log('✅ Utente trovato:', user.username);

    // ATTENZIONE: quale metodo esiste davvero sul modello?
    if (typeof user.verificaPassword !== 'function' && typeof user.comparePassword !== 'function') {
      console.error('❌ Nessun metodo verificaPassword/comparePassword definito su User');
      return res.status(500).json({ errore: 'Metodo verifica password non definito' });
    }

    const valida = typeof user.verificaPassword === 'function'
      ? await user.verificaPassword(passwordVecchia)
      : await user.comparePassword(passwordVecchia);

    console.log('🔐 Password vecchia valida?', valida);

    if (!valida) {
      return res.status(401).json({ errore: 'Password attuale non corretta' });
    }
    
    user.password = nuovaPassword; // hashata dal pre-save
    await user.save();
    
    await Log.create({
      utente_id: req.user.id,
      azione: 'cambio_password',
      tipo: 'account',
      descrizione: 'Hai cambiato la password',
      dettagli: { timestamp: new Date() }
    });
    
    res.json({ messaggio: 'Password aggiornata con successo' });
  } catch (err) {
    console.error('❌ Errore cambio password:', err);
    res.status(500).json({ errore: 'Errore nel cambio password' });
  }
});



// DELETE - Elimina account
router.delete('/elimina-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // ✅ SALVA LOG PRIMA DI ELIMINARE
    await Log.create({
      utente_id: req.user.id,
      azione: 'account_eliminato',
      tipo: 'account',
      descrizione: `Account "${user.username}" eliminato`,
      dettagli: {
        username: user.username,
        email: user.email,
        timestamp: new Date()
      }
    });
    
    await User.findByIdAndDelete(req.user.id);
    res.json({ messaggio: 'Account eliminato' });
  } catch (err) {
    console.error('Errore eliminazione account:', err);
    res.status(500).json({ errore: 'Errore nell\'eliminazione' });
  }
});



module.exports = router;
