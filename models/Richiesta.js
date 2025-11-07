const mongoose = require('mongoose');

const richiestaSchema = new mongoose.Schema({
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
    enum: ['in_attesa', 'accettata', 'rifiutata'],
    default: 'in_attesa'
  }
}, { timestamps: true });

// Index per evitare richieste duplicate
richiestaSchema.index({ mittente_id: 1, destinatario_id: 1 }, { unique: true });

module.exports = mongoose.model('Richiesta', richiestaSchema);
