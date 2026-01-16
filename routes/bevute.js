const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Collezione Schema (semplice)
const CollezioneSchema = new mongoose.Schema({
  nome: String,
  lattine: [{
    nome: String,
    varianti: [{
      _id: mongoose.Schema.Types.ObjectId,
      nome: String
    }]
  }]
});

const Collezione = mongoose.models.Collezione || mongoose.model('Collezione', CollezioneSchema);

router.get('/completa', async (req, res) => {
  try {
    const collezioni = await Collezione.find();
    
    // Flatten per select
    const flat = [];
    collezioni.forEach(cat => {
      cat.lattine.forEach(lattina => {
        lattina.varianti.forEach(variante => {
          flat.push({
            categoria: cat.nome,
            lattina: lattina.nome,
            nome: variante.nome,
            _id: variante._id
          });
        });
      });
    });
    
    res.json(flat);
  } catch(err) {
    console.error('Errore collezione:', err);
    res.status(500).json([]);
  }
});

module.exports = router;
