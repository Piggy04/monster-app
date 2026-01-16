const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// IMPORT ROUTES CON SAFE CHECK
const authRoutes = require('./routes/auth');
const collezioneRoutes = require('./routes/collezione');
const usersRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const statisticheRoutes = require('./routes/statistiche');
const amiciRoutes = require('./routes/amici');
const logRoutes = require('./routes/log');

const authMiddleware = require('./middleware/auth');

// CREA APP
const app = express();

// MIDDLEWARE
app.use(cors({
  origin: ['https://monster-sw.netlify.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CONNETTI MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connesso'))
  .catch(err => console.error('✗ Errore MongoDB:', err));

// 🍺 VARIANTI per bevute modal - NO AUTH
app.get('/api/monster-varianti', async (req, res) => {
  try {
    const Variante = mongoose.model('Variante');
    const varianti = await Variante.find()
      .populate('lattina_id', 'nome')
      .populate('lattina_id.categoria_id', 'nome')
      .sort({ nome: 1 })
      .limit(200);
    
    const lista = varianti.map(v => ({
      _id: v._id,
      nome: `${v.lattina_id?.nome || 'Unknown'} - ${v.nome}`
    }));
    
    res.json(lista);
  } catch(err) {
    console.error('Varianti errore:', err);
    res.json([]);
  }
});


// 🟢 BEVUTE INLINE - NO FILE DEPENDENCY
console.log('🟢 Setup bevute API inline');
const BevutaSchema = new mongoose.Schema({
  varianteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variante' },
  stato: { type: String, enum: ['bevuta', 'assaggiata', 'fatta-finta'], default: 'bevuta' },
  note: String,
  utenteId: { type: String, default: 'anonimo' },
  data: { type: Date, default: Date.now },
  ora: String
});
const Bevuta = mongoose.models.Bevuta || mongoose.model('Bevuta', BevutaSchema);

app.use('/api/bevute', (req, res) => {
  console.log('🚀 BEVUTE API:', req.method);
  
  if (req.method === 'GET') {
    Bevuta.aggregate([
      { $lookup: { 
        from: 'variantes', 
        localField: 'varianteId', 
        foreignField: '_id', 
        as: 'variante' 
      } },
      { $unwind: { 
        path: '$variante', 
        preserveNullAndEmptyArrays: true 
      } },
      { $group: {
        _id: '$varianteId',
        nome: { $first: '$variante.nome' },
        immagine: { $first: '$variante.immagine' },
        lattina: { $first: '$variante.lattina_id' },
        conteggio: { $sum: 1 },
        ultime: { $push: { stato: '$stato', data: '$data', note: '$note' } },
        stato: { $last: '$stato' }
      }},
      { $sort: { conteggio: -1 } }
    ]).then(risultati => res.json(risultati))
      .catch(e => {
        console.error('Errore aggregate bevute:', e);
        res.json([]);
      });
  } else if (req.method === 'POST') {
    const { varianteId, stato, note } = req.body;
    const bevuta = new Bevuta({ varianteId, stato, note });
    bevuta.save()
      .then(() => res.json({ success: true }))
      .catch(err => {
        console.error('Errore POST bevuta:', err);
        res.status(500).json({ error: 'Errore salvataggio' });
      });
  }
});


// REGISTRA ALTRE ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/collezione', collezioneRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistiche', statisticheRoutes);
app.use('/api/amici', amiciRoutes);
app.use('/api/log', logRoutes);

// AVVIA SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server attivo su porta ${PORT}`);
  console.log('🟢 API bevute: https://monster-app-ocdj.onrender.com/api/bevute');
});
