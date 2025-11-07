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
  },
  stato: {
    type: String,
    enum: ['piena', 'vuota'],
    default: 'vuota'
  }
}, { timestamps: true });

module.exports = mongoose.model('Possesso', possessoSchema);
