const mongoose = require('mongoose');

const varianteSchema = new mongoose.Schema({
  lattina_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lattina',
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  ordine: {
    type: Number,
    default: 0
  },
  immagine: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Variante', varianteSchema);
