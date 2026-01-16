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
    Bevuta.find()
      .populate('varianteId', 'nome')
      .sort({ data: -1 })
      .limit(100)
      .then(bevute => {
        const conNome = bevute.map(b => ({
          _id: b._id,
          nome: b.varianteId?.nome || 'Sconosciuta',
          stato: b.stato,
          note: b.note,
          data: b.data.toISOString().split('T')[0],
          ora: b.ora || b.data.toLocaleTimeString('it-IT')
        }));
        res.json(conNome);
      })
      .catch(err => {
        console.error('Errore GET bevute:', err);
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
