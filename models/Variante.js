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
  },
  contatoreBevute: {
    type: Number,
    default: 0
  },
  
  // ✅ NUOVI CAMPI NUTRIZIONALI
  caffeina_mg: {
    type: Number,
    default: 0,
    min: 0
  },
  calorie_kcal: {
    type: Number,
    default: 0,
    min: 0
  },
  zuccheri_g: {
    type: Number,
    default: 0,
    min: 0
  }
  
}, { timestamps: true });

module.exports = mongoose.model('Variante', varianteSchema);
