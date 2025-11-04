const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Categoria = require('../models/Categoria');
const Lattina = require('../models/Lattina');
const Variante = require('../models/Variante');
const Possesso = require('../models/Possesso');

// Route normali (tutti gli utenti)
router.get('/completa', auth, async (req, res) => {
  try {
    const categorie = await Categoria.find().sort({ ordine: 1 });
    
    const datiCompleti = await Promise.all(
      categorie.map(async (categoria) => {
        const lattine = await Lattina.find({ categoria_id: categoria._id }).sort({ ordine: 1 });
        
        const lattineConVarianti = await Promise.all(
          lattine.map(async (lattina) => {
            const varianti = await Variante.find({ lattina_id: lattina._id }).sort({ ordine: 1 });
            
            const variantiConPossesso = await Promise.all(
              varianti.map(async (variante) => {
                const possesso = await Possesso.findOne({
                  utente_id: req.utente_id,
                  variante_id: variante._id
                });
                
                return {
                  _id: variante._id,
                  nome: variante.nome,
                  ordine: variante.ordine,
                  immagine: variante.immagine,
                  posseduta: possesso ? possesso.posseduta : false
                };
              })
            );
            
            return {
              _id: lattina._id,
              nome: lattina.nome,
              ordine: lattina.ordine,
              varianti: variantiConPossesso
            };
          })
        );
        
        return {
          _id: categoria._id,
          nome: categoria.nome,
          ordine: categoria.ordine,
          lattine: lattineConVarianti
        };
      })
    );
    
    res.json(datiCompleti);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore nel recupero dati' });
  }
});

router.post('/possesso', auth, async (req, res) => {
  try {
    const { variante_id, posseduta } = req.body;
    
    let possesso = await Possesso.findOne({
      utente_id: req.utente_id,
      variante_id: variante_id
    });
    
    if (possesso) {
      possesso.posseduta = posseduta;
      await possesso.save();
    } else {
      possesso = new Possesso({
        utente_id: req.utente_id,
        variante_id: variante_id,
        posseduta: posseduta
      });
      await possesso.save();
    }
    
    res.json({ messaggio: 'Stato aggiornato', posseduta: possesso.posseduta });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore nell\'aggiornamento' });
  }
});

// ===== ROUTE ADMIN =====

// CATEGORIE
router.post('/categoria', adminAuth, async (req, res) => {
  try {
    const { nome, ordine } = req.body;
    const categoria = new Categoria({ nome, ordine });
    await categoria.save();
    res.status(201).json(categoria);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore creazione categoria' });
  }
});

router.put('/categoria/:id', adminAuth, async (req, res) => {
  try {
    const { nome, ordine } = req.body;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nome, ordine },
      { new: true, runValidators: true }
    );
    if (!categoria) {
      return res.status(404).json({ errore: 'Categoria non trovata' });
    }
    res.json(categoria);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore aggiornamento categoria' });
  }
});

router.delete('/categoria/:id', adminAuth, async (req, res) => {
  try {
    // Elimina anche tutte le lattine e varianti associate
    const lattine = await Lattina.find({ categoria_id: req.params.id });
    for (let lattina of lattine) {
      await Variante.deleteMany({ lattina_id: lattina._id });
    }
    await Lattina.deleteMany({ categoria_id: req.params.id });
    await Categoria.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Categoria eliminata' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore eliminazione categoria' });
  }
});

// LATTINE
router.post('/lattina', adminAuth, async (req, res) => {
  try {
    const { categoria_id, nome, ordine } = req.body;
    const lattina = new Lattina({ categoria_id, nome, ordine });
    await lattina.save();
    res.status(201).json(lattina);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore creazione lattina' });
  }
});

router.put('/lattina/:id', adminAuth, async (req, res) => {
  try {
    const { nome, ordine } = req.body;
    const lattina = await Lattina.findByIdAndUpdate(
      req.params.id,
      { nome, ordine },
      { new: true, runValidators: true }
    );
    if (!lattina) {
      return res.status(404).json({ errore: 'Lattina non trovata' });
    }
    res.json(lattina);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore aggiornamento lattina' });
  }
});

router.delete('/lattina/:id', adminAuth, async (req, res) => {
  try {
    // Elimina anche tutte le varianti associate
    await Variante.deleteMany({ lattina_id: req.params.id });
    await Lattina.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Lattina eliminata' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore eliminazione lattina' });
  }
});

// VARIANTI
router.post('/variante', adminAuth, async (req, res) => {
  try {
    const { lattina_id, nome, ordine } = req.body;
    const variante = new Variante({ lattina_id, nome, ordine });
    await variante.save();
    res.status(201).json(variante);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore creazione variante' });
  }
});

router.put('/variante/:id', adminAuth, async (req, res) => {
  try {
    const { nome, ordine } = req.body;
    const variante = await Variante.findByIdAndUpdate(
      req.params.id,
      { nome, ordine },
      { new: true, runValidators: true }
    );
    if (!variante) {
      return res.status(404).json({ errore: 'Variante non trovata' });
    }
    res.json(variante);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore aggiornamento variante' });
  }
});

router.delete('/variante/:id', adminAuth, async (req, res) => {
  try {
    await Variante.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Variante eliminata' });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore eliminazione variante' });
  }
});

module.exports = router;
