const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  utente_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  // Preferenze notifiche
  preferenze: {
    amicizie: { type: Boolean, default: true },
    promemoria_bevuta: { type: Boolean, default: true },
    promemoria_collezione: { type: Boolean, default: true },
    milestone: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
