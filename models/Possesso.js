const mongoose = require('mongoose');

const possessoSchema = new mongoose.Schema({
  utente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  variante_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variante',
    required: true
  },
  posseduta: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

possessoSchema.index({ utente_id: 1, variante_id: 1 }, { unique: true });

module.exports = mongoose.model('Possesso', possessoSchema);
