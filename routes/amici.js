const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Amicizia = require('../models/Amicizia');
const Log = require('../models/Log');
const mongoose = require('mongoose');

// ===== STATS LIVE (NUOVO) =====
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Conta amici confermati
    const amiciConfermati = await Amicizia.countDocuments({
      stato: 'confermata',
      $or: [{ mittente_id: userId }, { destinatario_id: userId }]
    });
    
    // Conta richieste ricevute
    const richiesteRicevute = await Amicizia.countDocuments({
      destinatario_id: userId,
      stato: 'in_sospeso'
    });
    
    // Conta amici online (ultimo accesso < 5 min)
    const cinqueMinutiFa = new Date(Date.now() - 5 * 60 * 1000);
    const amiciOnline = await Amicizia.aggregate([
      {
        $match: {
          stato: 'confermata',
          $or: [{ mittente_id: userId }, { destinatario_id: userId }]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mittente_id',
          foreignField: '_id',
          as: 'mittente'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'destinatario_id',
          foreignField: '_id',
          as: 'destinatario'
        }
      },
      {
        $addFields: {
          amico: {
            $cond: [
              { $eq: [{ $arrayElemAt: ['$mittente._id', 0] }, mongoose.Types.ObjectId(userId)] },
              { $arrayElemAt: ['$destinatario', 0] },
              { $arrayElemAt: ['$mittente', 0] }
            ]
          }
        }
      },
      {
        $match: {
          'amico.ultimoAccesso': { $gt: cinqueMinutiFa },
          'amico._id': { $ne: mongoose.Types.ObjectId(userId) }
        }
      },
      { $count: 'online' }
    ]);

    res.json({
      amiciTotali: amiciConfermati,
      richieste: richiesteRicevute,
      online: amiciOnline[0]?.online || 0
    });
  } catch (errore) {
    console.error('Errore stats amici:', errore);
    res.status(500).json({ errore: 'Errore stats' });
  }
});

// ===== AMICI CON DATI ESTESI (MODIFICATO) =====
router.get('/', auth, async (req, res) => {
  try {
    const includeStats = req.query.include?.includes('stats');
    const userId = req.user.id;
    
    const amici = await Amicizia.find({
      stato: 'confermata',
      $or: [{ mittente_id: userId }, { destinatario_id: userId }]
    }).populate('mittente_id', '_id username email avatar ruolo ultimoAccesso mostriPosseduti percentuale')
      .populate('destinatario_id', '_id username email avatar ruolo ultimoAccesso mostriPosseduti percentuale');
    
    // Estrai l'amico (non se stesso) + aggiungi online status
    const amiciList = amici.map(amicizia => {
      const amico = amicizia.mittente_id._id.toString() === userId 
        ? amicizia.destinatario_id 
        : amicizia.mittente_id;
      
      return {
        _id: amico._id,
        username: amico.username,
        email: amico.email,
        avatar: amico.avatar,
        ruolo: amico.ruolo,
        online: amico.ultimoAccesso && (new Date() - new Date(amico.ultimoAccesso)) < 5 * 60 * 1000,
        ultimaAttivita: amico.ultimoAccesso?.toLocaleString('it-IT'),
        mostriPosseduti: includeStats ? amico.mostriPosseduti || 0 : undefined,
        percentuale: includeStats ? amico.percentuale || 0 : undefined
      };
    });
    
    res.json(amiciList);
  } catch (errore) {
    console.error('Errore caricamento amici:', errore);
    res.status(500).json({ errore: 'Errore caricamento amici' });
  }
});

// ===== RICERCA UTENTI (MIGLIORATA) =====
router.get('/ricerca/:username', auth, async (req, res) => {
  try {
    const username = req.params.username;
    
    const utenti = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('_id username email avatar ruolo').limit(10);
    
    res.json(utenti);
  } catch (errore) {
    console.error('Errore ricerca utenti:', errore);
    res.status(500).json({ errore: 'Errore ricerca utenti' });
  }
});

// ===== RICHIESTE (INVARIATE - FUNZIONANTI) =====
router.get('/richieste/ricevute', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      destinatario_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('mittente_id', '_id username email avatar ruolo').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    console.error('Errore caricamento richieste ricevute:', errore);
    res.status(500).json({ errore: 'Errore caricamento richieste' });
  }
});

router.get('/richieste/inviate', auth, async (req, res) => {
  try {
    const richieste = await Amicizia.find({
      mittente_id: req.user.id,
      stato: 'in_sospeso'
    }).populate('destinatario_id', '_id username email avatar ruolo').sort({ createdAt: -1 });
    
    res.json(richieste);
  } catch (errore) {
    console.error('Errore caricamento richieste inviate:', errore);
    res.status(500).json({ errore: 'Errore caricamento richieste inviate' });
  }
});

// POST - Invia richiesta (INVARIATA)
router.post('/richiesta', auth, async (req, res) => {
  try {
    const { destinatario_id } = req.body;
    
    const destinatario = await User.findById(destinatario_id);
    if (!destinatario) {
      return res.status(404).json({ errore: 'Utente non trovato' });
    }
    
    if (destinatario_id === req.user.id) {
      return res.status(400).json({ errore: 'Non puoi aggiungere te stesso' });
    }
    
    const esiste = await Amicizia.findOne({
      $or: [
        { mittente_id: req.user.id, destinatario_id: destinatario_id, stato: { $in: ['in_sospeso', 'confermata'] } },
        { mittente_id: destinatario_id, destinatario_id: req.user.id, stato: { $in: ['in_sospeso', 'confermata'] } }
      ]
    });
    
    if (esiste) {
      return res.status(400).json({ errore: 'Relazione già esistente con questo utente' });
    }
    
    await Amicizia.findOneAndDelete({
      $or: [
        { mittente_id: req.user.id, destinatario_id: destinatario_id, stato: 'rifiutata' },
        { mittente_id: destinatario_id, destinatario_id: req.user.id, stato: 'rifiutata' }
      ]
    });
    
    const amicizia = new Amicizia({
      mittente_id: req.user.id,
      destinatario_id: destinatario_id,
      stato: 'in_sospeso'
    });
    
    await amicizia.save();
    
    await Log.create({
      utente_id: req.user.id,
      azione: 'richiesta_inviata',
      tipo: 'amico',
      descrizione: `Hai inviato una richiesta di amicizia a ${destinatario.username}`,
      dettagli: { amico_id: destinatario_id, amico_username: destinatario.username }
    });
    
    res.status(201).json({ messaggio: 'Richiesta inviata', amicizia });
  } catch (errore) {
    console.error('Errore invio richiesta:', errore);
    res.status(500).json({ errore: 'Errore invio richiesta' });
  }
});

// PUT - Accetta/Rifiuta (INVARIATE)
router.put('/accetta/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) return res.status(404).json({ errore: 'Richiesta non trovata' });
    if (amicizia.destinatario_id.toString() !== req.user.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }
    
    amicizia.stato = 'confermata';
    amicizia.rispostaAt = new Date();
    await amicizia.save();
    
    await amicizia.populate('mittente_id', 'username');
    
    await Log.create({
      utente_id: req.user.id,
      azione: 'richiesta_accettata',
      tipo: 'amico',
      descrizione: `Hai accettato la richiesta di amicizia da ${amicizia.mittente_id.username}`,
      dettagli: { amico_id: amicizia.mittente_id._id, amico_username: amicizia.mittente_id.username }
    });
    
    res.json({ messaggio: 'Richiesta accettata', amicizia });
  } catch (errore) {
    console.error('Errore accettazione richiesta:', errore);
    res.status(500).json({ errore: 'Errore accettazione richiesta' });
  }
});

router.put('/rifiuta/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) return res.status(404).json({ errore: 'Richiesta non trovata' });
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

// DELETE (INVARIATE)
router.delete('/:id', auth, async (req, res) => {
  try {
    const amicizia = await Amicizia.findById(req.params.id);
    
    if (!amicizia) return res.status(404).json({ errore: 'Richiesta non trovata' });
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

router.delete('/rimuovi/:amicoId', auth, async (req, res) => {
  try {
    const amicoId = req.params.amicoId;
    const userId = req.user.id;
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const amicoObjectId = new mongoose.Types.ObjectId(amicoId);
    
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
