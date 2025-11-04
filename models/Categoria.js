const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  ordine: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Categoria', categoriaSchema);
