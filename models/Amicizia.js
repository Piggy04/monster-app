const mongoose = require('mongoose');

const amiciziaSchema = new mongoose.Schema({
  mittente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destinatario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stato: {
    type: String,
    enum: ['in_sospeso', 'confermata', 'rifiutata'],
    default: 'in_sospeso'
  },
  rispostaAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indice per evitare duplicati
amiciziaSchema.index({ mittente_id: 1, destinatario_id: 1 }, { unique: true });

module.exports = mongoose.model('Amicizia', amiciziaSchema);
