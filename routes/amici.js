const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Amicizia = require('../models/Amicizia');
const Log = require('../models/Log');
const mongoose = require('mongoose');

// ===== RICERCA UTENTI =====

// GET - Ricerca utenti per username
router.get('/ricerca/:username', auth, async (req, res) => {
  try {
    const username = req.params.username;
    
    const utenti = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('_id username email').limit(10);
    
    res.json(utenti);
  } catch (errore) {
    console.error('Errore ricerca utenti:', errore);
    res.status(500).json({ errore: 'Errore ricerca utenti' });
  }
});

// ===== AMICI CONFERMATI =====

// GET - Lista amici confermati
router.get('/', auth, async (req, res) => {
  try {
    const amici = await Amicizia.find({
      stato: 'confermata',
      $or: [
        { mittente_id: req.user.id },
        { destinatario_id: req.user.id }
      ]
    }).populate('mittente_id', '_id username email').populate('destinatario_id', '_id username email');
    
    // Estrai l'amico (non se stesso)
    const amiciList = amici.map(amicizia => {
      return amicizia.mittente_id._id.toString() === req.user.id 
        ? amicizia.destinatario_id 
        : amicizia.mittente_id;
    });
    
    res.json(amiciList);
  } catch (errore) {
    console.error('Errore caricamento amici:', errore);
    res.status(500).json({ errore: 'Errore caricamento amici' });
  }
});

// ===== RICHIESTE DI AMICIZIA =====

// GET - Richieste ricevute
router.get('/richieste/ricevute', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      destinatario_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('mittente_id', '_id username email').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    console.error('Errore caricamento richieste ricevute:', errore);
    res.status(500).json({ errore: 'Errore caricamento richieste' });
  }
});

// GET - Richieste inviate
router.get('/richieste/inviate', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      mittente_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('destinatario_id', '_id username email').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    console.error('Errore caricamento richieste inviate:', errore);
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
    
    // SALVA IL LOG
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
    
    res.status(201).json({ messaggio: 'Richiesta inviata', amicizia });
  } catch (errore) {
    console.error('Errore invio richiesta:', errore);
    res.status(500).json({ errore: 'Errore invio richiesta' });
  }
});

// PUT - Accetta richiesta
router.put('/accetta/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) {
      return res.status(404).json({ errore: 'Richiesta non trovata' });
    }
    
    // Verifica che sia il destinatario
    if (amicizia.destinatario_id.toString() !== req.user.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }
    
    amicizia.stato = 'confermata';
    amicizia.rispostaAt = new Date();
    await amicizia.save();
    
    // Popola i dati per il log
    await amicizia.populate('mittente_id', 'username');
    
    // SALVA IL LOG
    await Log.create({
      utente_id: req.user.id,
      azione: 'richiesta_accettata',
      tipo: 'amico',
      descrizione: `Hai accettato la richiesta di amicizia da ${amicizia.mittente_id.username}`,
      dettagli: {
        amico_id: amicizia.mittente_id._id,
        amico_username: amicizia.mittente_id.username
      }
    });
    
    res.json({ messaggio: 'Richiesta accettata', amicizia });
  } catch (errore) {
    console.error('Errore accettazione richiesta:', errore);
    res.status(500).json({ errore: 'Errore accettazione richiesta' });
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
    console.error('Errore rifiuto richiesta:', errore);
    res.status(500).json({ errore: 'Errore rifiuto richiesta' });
  }
});

// ===== RIMOZIONE AMICI =====

// DELETE - Annulla richiesta inviata (ID della richiesta)
router.delete('/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) {
      return res.status(404).json({ errore: 'Richiesta non trovata' });
    }
    
    // Verifica che sia uno dei due coinvolti
    if (amicizia.mittente_id.toString() !== req.user.id && 
        amicizia.destinatario_id.toString() !== req.user.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }
    
    await Amicizia.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Richiesta annullata' });
  } catch (errore) {
    console.error('Errore annullamento richiesta:', errore);
    res.status(500).json({ errore: 'Errore annullamento' });
  }
});

// DELETE - Rimuovi amico (usando ID amico)
router.delete('/rimuovi/:amicoId', auth, async (req, res) => {
  try {
    const amicoId = req.params.amicoId;
    const userId = req.user.id;
    
    console.log('🗑️ Richiesta rimozione amico:', { userId, amicoId });
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const amicoObjectId = new mongoose.Types.ObjectId(amicoId);
    
    // Trova e elimina l'amicizia confermata tra i due utenti
    const risultato = await Amicizia.findOneAndDelete({
      $and: [
        { stato: 'confermata' },
        {
          $or: [
            { mittente_id: userObjectId, destinatario_id: amicoObjectId },
            { mittente_id: amicoObjectId, destinatario_id: userObjectId }
          ]
        }
      ]
    });
    
    console.log('📊 Risultato eliminazione:', risultato);
    
    if (!risultato) {
      return res.status(404).json({ errore: 'Amicizia non trovata' });
    }
    
    res.json({ messaggio: 'Amico rimosso con successo' });
  } catch (err) {
    console.error('❌ Errore rimozione amico:', err);
    res.status(500).json({ errore: 'Errore nella rimozione', dettagli: err.message });
  }
});

module.exports = router;
