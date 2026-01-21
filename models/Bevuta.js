const mongoose = require('mongoose');

const bevutaSchema = new mongoose.Schema({
  varianteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Variante', 
    required: true 
  },
  stato: { 
    type: String, 
    enum: ['bevuta', 'assaggiata', 'fatta-finta'], 
    required: true 
  },
  note: { 
    type: String, 
    default: '' 
  },
  utenteId: { 
    type: mongoose.Schema.Types.ObjectId,  // ← CAMBIATO da String a ObjectId
    ref: 'User', 
    required: true 
  },
  data: { 
    type: Date, 
    default: Date.now 
  },
  ora: {
    type: String,
    default: () => new Date().toLocaleTimeString('it-IT')
  }
});

module.exports = mongoose.model('Bevuta', bevutaSchema);
