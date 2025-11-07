const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Amicizia = require('../models/Amicizia');
const User = require('../models/User');



// GET - Ricerca utenti per username
router.get('/ricerca/:username', auth, async (req, res) => {
  try {
    const username = req.params.username;
    
    // Cerca utenti che non siamo noi stessi
    const utenti = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('_id username').limit(10);
    
    res.json(utenti);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore ricerca utenti' });
  }
});



// GET - Lista amici confermati
router.get('/', auth, async (req, res) => {
  try {
    // Amicizie confermati dove sono mittente O destinatario
    const amici = await Amicizia.find({
      stato: 'confermata',
      $or: [
        { mittente_id: req.user.id },
        { destinatario_id: req.user.id }
      ]
    }).populate('mittente_id', '_id username').populate('destinatario_id', '_id username');
    
    // Estrai l'amico (non se stesso)
    const amiciList = amici.map(amicizia => {
      return amicizia.mittente_id._id.toString() === req.user.id 
        ? amicizia.destinatario_id 
        : amicizia.mittente_id;
    });
    
    res.json(amiciList);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore caricamento amici' });
  }
});



// GET - Richieste in sospeso ricevute
router.get('/richieste/ricevute', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      destinatario_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('mittente_id', '_id username').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore caricamento richieste' });
  }
});



// GET - Richieste inviate
router.get('/richieste/inviate', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      mittente_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('destinatario_id', '_id username').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore caricamento richieste inviate' });
  }
});



// POST - Invia richiesta di amicizia
router.post('/richiesta', auth, async (req, res) => {
  try {
    const { destinatario_id } = req.body;
    
    // Verifica che il destinatario esista
    const destinatario = await User.findById(destinatario_id);
    if (!destinatario) {
      return res.status(404).json({ errore: 'Utente non trovato' });
    }
    
    // Verifica che non sia se stesso
    if (destinatario_id === req.user.id) {
      return res.status(400).json({ errore: 'Non puoi aggiungere te stesso' });
    }
    
    // Verifica se esiste già un'amicizia
    const esiste = await Amicizia.findOne({
      $or: [
        { mittente_id: req.user.id, destinatario_id: destinatario_id },
        { mittente_id: destinatario_id, destinatario_id: req.user.id }
      ]
    });
    
    if (esiste) {
      return res.status(400).json({ errore: 'Relazione già esistente con questo utente' });
    }
    
    // Crea la richiesta
    const amicizia = new Amicizia({
      mittente_id: req.user.id,
      destinatario_id: destinatario_id,
      stato: 'in_sospeso'
    });
    
    await amicizia.save();
    res.status(201).json({ messaggio: 'Richiesta inviata', amicizia });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore invio richiesta' });
  }
});



// PUT - Accetta richiesta
// ACCETTA RICHIESTA
router.put('/accetta/:id', auth, async (req, res) => {
  try {
    const richiesta = await Richiesta.findByIdAndUpdate(
      req.params.id,
      { stato: 'accettata' },
      { new: true }
    ).populate('mittente_id destinatario_id');
    
    if (!richiesta) return res.status(404).json({ errore: 'Richiesta non trovata' });
    
    // SALVA IL LOG
    const Log = require('../models/Log');
    await Log.create({
      utente_id: req.user.id,
      azione: 'richiesta_accettata',
      tipo: 'amico',
      descrizione: `Hai accettato la richiesta di amicizia da ${richiesta.mittente_id.username}`,
      dettagli: {
        amico_id: richiesta.mittente_id._id,
        amico_username: richiesta.mittente_id.username
      }
    });
    
    res.json(richiesta);
  } catch (err) {
    res.status(500).json({ errore: 'Errore' });
  }
});

// INVIA RICHIESTA
router.post('/richiesta', auth, async (req, res) => {
  try {
    const { destinatario_id } = req.body;
    
    // ... codice esistente ...
    
    // SALVA IL LOG
    const Log = require('../models/Log');
    const destinatario = await User.findById(destinatario_id);
    
    await Log.create({
      utente_id: req.user.id,
      azione: 'richiesta_inviata',
      tipo: 'amico',
      descrizione: `Hai inviato una richiesta di amicizia a ${destinatario.username}`,
      dettagli: {
        amico_id: destinatario_id,
        amico_username: destinatario.username
      }
    });
    
    res.status(201).json(richiesta);
  } catch (err) {
    res.status(500).json({ errore: 'Errore' });
  }
});



// PUT - Rifiuta richiesta
router.put('/rifiuta/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) {
      return res.status(404).json({ errore: 'Richiesta non trovata' });
    }
    
    // Verifica che sia il destinatario
    if (amicizia.destinatario_id.toString() !== req.user.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }
    
    amicizia.stato = 'rifiutata';
    amicizia.rispostaAt = new Date();
    await amicizia.save();
    
    res.json({ messaggio: 'Richiesta rifiutata' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore rifiuto richiesta' });
  }
});



// DELETE - Rimuovi amico
router.delete('/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) {
      return res.status(404).json({ errore: 'Amicizia non trovata' });
    }
    
    // Verifica che sia uno dei due
    if (amicizia.mittente_id.toString() !== req.user.id && 
        amicizia.destinatario_id.toString() !== req.user.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }
    
    await Amicizia.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Amico rimosso' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore rimozione amico' });
  }
});

// DELETE - Rimuovi amico
router.delete('/rimuovi/:amicoId', auth, async (req, res) => {
  try {
    const amicoId = req.params.amicoId;
    const userId = req.user.id;
    
    // Trova e elimina la richiesta accettata tra i due utenti
    const risultato = await Richiesta.deleteOne({
      $or: [
        { mittente_id: userId, destinatario_id: amicoId, stato: 'accettata' },
        { mittente_id: amicoId, destinatario_id: userId, stato: 'accettata' }
      ]
    });
    
    if (risultato.deletedCount === 0) {
      return res.status(404).json({ errore: 'Amicizia non trovata' });
    }
    
    res.json({ messaggio: 'Amico rimosso con successo' });
  } catch (err) {
    console.error('Errore rimozione amico:', err);
    res.status(500).json({ errore: 'Errore nella rimozione' });
  }
});


module.exports = router;
