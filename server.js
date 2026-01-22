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
const bevuteRoutes = require('./routes/bevute'); // ← AGGIUNGI

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

// 🍺 VARIANTI per bevute modal (con ricerca case-insensitive)
app.get('/api/monster-varianti', authMiddleware, async (req, res) => {
  try {
    const Variante = mongoose.model('Variante');
    const { search } = req.query;
    
    let varianti = await Variante.find()
      .populate('lattina_id', 'nome ordine')
      .populate('categoria_id', 'nome')
      .sort({ 'lattina_id.ordine': 1, ordine: 1 })
      .lean();
    
    // Se c'è ricerca, filtra DOPO il populate
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      varianti = varianti.filter(v => {
        const nomeVariante = (v.nome || '').toLowerCase();
        const nomeLattina = (v.lattina_id?.nome || '').toLowerCase();
        return nomeVariante.includes(searchLower) || nomeLattina.includes(searchLower);
      });
    }
    
    console.log(`✅ Varianti: ${varianti.length}${search ? ` per "${search}"` : ''}`);
    
    res.json(varianti);
  } catch(err) {
    console.error('❌ Errore /api/monster-varianti:', err.message);
    res.status(500).json({ errore: 'Errore caricamento varianti: ' + err.message });
  }
});




// REGISTRA ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/collezione', collezioneRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistiche', statisticheRoutes);
app.use('/api/amici', amiciRoutes);
app.use('/api/log', logRoutes);
app.use('/api/bevute', bevuteRoutes); // ← AGGIUNGI

// AVVIA SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server attivo su porta ${PORT}`);
});
