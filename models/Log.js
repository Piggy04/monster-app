const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  utente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  azione: {
    type: String,
    enum: [
      'aggiunto', 
      'rimosso', 
      'aggiornato', 
      'acceso', 
      'richiesta_inviata', 
      'richiesta_accettata',
      'cambio_email',        // ← AGGIUNTO
      'cambio_password',     // ← AGGIUNTO
      'cambio_username',     // ← AGGIUNTO
      'eliminazione_account' // ← AGGIUNTO
    ],
    required: true
  },
  tipo: {
    type: String,
    enum: [
      'variante', 
      'amico', 
      'collezione',
      'account'  // ← AGGIUNTO
    ],
    required: true
  },
  descrizione: {
    type: String,
    required: true
  },
  dettagli: {
    variante_id: mongoose.Schema.Types.ObjectId,
    variante_nome: String,
    lattina_nome: String,
    stato: String, // piena/vuota
    amico_id: mongoose.Schema.Types.ObjectId,
    amico_username: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
