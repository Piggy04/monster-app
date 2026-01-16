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
    console.log('1. req.user.id:', req.user.id);
    
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
                  utente_id: req.user.id,
                  variante_id: variante._id
                });
                
                return {
                  _id: variante._id,
                  nome: variante.nome,
                  ordine: variante.ordine,
                  immagine: variante.immagine,
                  posseduta: possesso ? possesso.posseduta : false,
                  stato: possesso ? possesso.stato : 'vuota'
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
    console.error('Errore collezione completa:', errore);
    res.status(500).json({ errore: 'Errore nel recupero dati' });
  }
});



router.post('/possesso', auth, async (req, res) => {
  try {
    const { variante_id, posseduta } = req.body;
    
    let possesso = await Possesso.findOne({
      utente_id: req.user.id,
      variante_id: variante_id
    });
    
    // Recupera info variante per il log
    const variante = await Variante.findById(variante_id);
    const lattina = await Lattina.findById(variante.lattina_id);
    
    if (possesso) {
      possesso.posseduta = posseduta;
      await possesso.save();
    } else {
      possesso = new Possesso({
        utente_id: req.user.id,
        variante_id: variante_id,
        posseduta: posseduta
      });
      await possesso.save();
    }
    
    // SALVA IL LOG
    const Log = require('../models/Log');
    const azione = posseduta ? 'aggiunto' : 'rimosso';
    const descrizione = posseduta 
      ? `Aggiunta ${variante.nome} (${lattina.nome}) alla collezione`
      : `Rimossa ${variante.nome} (${lattina.nome}) dalla collezione`;
    
    await Log.create({
      utente_id: req.user.id,
      azione,
      tipo: 'variante',
      descrizione,
      dettagli: {
        variante_id: variante._id,
        variante_nome: variante.nome,
        lattina_nome: lattina.nome
      }
    });
    
    res.json({ messaggio: 'Stato aggiornato', posseduta: possesso.posseduta });
  } catch (errore) {
    console.error('Errore possesso:', errore.message);
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
    const { lattina_id, nome, ordine, immagine } = req.body;
    const variante = new Variante({ lattina_id, nome, ordine, immagine });
    await variante.save();
    res.status(201).json(variante);
  } catch (errore) {
    res.status(500).json({ errore: 'Errore creazione variante' });
  }
});



router.put('/variante/:id', adminAuth, async (req, res) => {
  try {
    const { nome, ordine, immagine } = req.body;
    const variante = await Variante.findByIdAndUpdate(
      req.params.id,
      { nome, ordine, immagine },
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


// GET - Collezione di un altro utente (per amici)
router.get('/amico/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
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
                  utente_id: userId,
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
    console.error('Errore collezione amico:', errore);
    res.status(500).json({ errore: 'Errore nel recupero dati' });
  }
});

// PUT - Aggiorna stato piena/vuota
router.put('/stato/:varianteId', auth, async (req, res) => {
  try {
    const { varianteId } = req.params;
    const { stato } = req.body;
    
    if (!['piena', 'vuota'].includes(stato)) {
      return res.status(400).json({ errore: 'Stato non valido' });
    }
    
    let possesso = await Possesso.findOne({
      utente_id: req.user.id,
      variante_id: varianteId
    });
    
    if (!possesso) {
      return res.status(404).json({ errore: 'Possesso non trovato' });
    }
    
    const statoVecchio = possesso.stato;
    possesso.stato = stato;
    await possesso.save();
    
    // SALVA IL LOG
    const Log = require('../models/Log');
    const variante = await Variante.findById(varianteId);
    const lattina = await Lattina.findById(variante.lattina_id);
    
    await Log.create({
      utente_id: req.user.id,
      azione: 'aggiornato',
      tipo: 'variante',
      descrizione: `Cambio stato ${variante.nome}: da ${statoVecchio} a ${stato}`,
      dettagli: {
        variante_id: variante._id,
        variante_nome: variante.nome,
        lattina_nome: lattina.nome,
        stato: stato
      }
    });
    
    res.json({ messaggio: 'Stato aggiornato', stato: possesso.stato });
  } catch (errore) {
    console.error('Errore aggiornamento stato:', errore);
    res.status(500).json({ errore: 'Errore nel salvataggio' });
  }
});

// 🍺 SOLO per bevute - NO AUTH - Lista flat varianti
router.get('/bevute-varianti', async (req, res) => {
  try {
    const categorie = await Categoria.find().sort({ ordine: 1 });
    
    const variantiFlat = [];
    for (const categoria of categorie) {
      const lattine = await Lattina.find({ categoria_id: categoria._id }).sort({ ordine: 1 });
      
      for (const lattina of lattine) {
        const varianti = await Variante.find({ lattina_id: lattina._id }).sort({ ordine: 1 });
        
        varianti.forEach(variante => {
          variantiFlat.push({
            _id: variante._id,
            nome: variante.nome,
            categoria: categoria.nome,
            lattina: lattina.nome
          });
        });
      }
    }
    
    res.json(variantiFlat);
  } catch(err) {
    console.error('Errore varianti bevute:', err);
    res.status(500).json([]);
  }
});






module.exports = router;
