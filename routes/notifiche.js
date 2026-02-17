const express = require('express');
const router = express.Router();
const webPush = require('web-push');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

// Configura VAPID
webPush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// GET - Chiave pubblica VAPID
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST - Salva subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    // Controlla se esiste già
    let sub = await PushSubscription.findOne({ 
      utente_id: req.user.id,
      endpoint 
    });
    
    if (sub) {
      return res.json({ messaggio: 'Già iscritto' });
    }
    
    // Crea nuova subscription
    sub = new PushSubscription({
      utente_id: req.user.id,
      endpoint,
      keys
    });
    
    await sub.save();
    
    res.json({ messaggio: 'Notifiche attivate!', subscription: sub });
  } catch(e) {
    console.error('Errore subscribe:', e);
    res.status(500).json({ errore: e.message });
  }
});

// PUT - Aggiorna preferenze
router.put('/preferenze', auth, async (req, res) => {
  try {
    const { amicizie, promemoria_bevuta, promemoria_collezione, milestone } = req.body;
    
    const sub = await PushSubscription.findOne({ utente_id: req.user.id });
    
    if (!sub) {
      return res.status(404).json({ errore: 'Subscription non trovata' });
    }
    
    sub.preferenze = {
      amicizie: amicizie !== undefined ? amicizie : sub.preferenze.amicizie,
      promemoria_bevuta: promemoria_bevuta !== undefined ? promemoria_bevuta : sub.preferenze.promemoria_bevuta,
      promemoria_collezione: promemoria_collezione !== undefined ? promemoria_collezione : sub.preferenze.promemoria_collezione,
      milestone: milestone !== undefined ? milestone : sub.preferenze.milestone
    };
    
    await sub.save();
    
    res.json({ messaggio: 'Preferenze aggiornate', preferenze: sub.preferenze });
  } catch(e) {
    console.error('Errore preferenze:', e);
    res.status(500).json({ errore: e.message });
  }
});

// GET - Preferenze utente
router.get('/preferenze', auth, async (req, res) => {
  try {
    const sub = await PushSubscription.findOne({ utente_id: req.user.id });
    
    if (!sub) {
      return res.json({ 
        attive: false,
        preferenze: {
          amicizie: true,
          promemoria_bevuta: true,
          promemoria_collezione: true,
          milestone: true
        }
      });
    }
    
    res.json({ 
      attive: true,
      preferenze: sub.preferenze 
    });
  } catch(e) {
    res.status(500).json({ errore: e.message });
  }
});

// POST - Invia notifica (helper interno)
async function inviaNotifica(utenteId, titolo, corpo, tipo) {
  try {
    const sub = await PushSubscription.findOne({ utente_id: utenteId });
    
    if (!sub) return false;
    
    // Controlla preferenze
    if (tipo === 'amicizia' && !sub.preferenze.amicizie) return false;
    if (tipo === 'promemoria_bevuta' && !sub.preferenze.promemoria_bevuta) return false;
    if (tipo === 'promemoria_collezione' && !sub.preferenze.promemoria_collezione) return false;
    if (tipo === 'milestone' && !sub.preferenze.milestone) return false;
    
    const payload = JSON.stringify({
      title: titolo,
      body: corpo,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { tipo }
    });
    
    await webPush.sendNotification({
      endpoint: sub.endpoint,
      keys: sub.keys
    }, payload);
    
    return true;
  } catch(e) {
    console.error('Errore invio notifica:', e);
    
    // Se subscription non valida, elimina
    if (e.statusCode === 410) {
      await PushSubscription.deleteOne({ utente_id: utenteId });
    }
    
    return false;
  }
}

module.exports = { router, inviaNotifica };
