const mongoose = require('mongoose');

const lattinaSchema = new mongoose.Schema({
  categoria_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  ordine: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Lattina', lattinaSchema);
