const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const collezioneRoutes = require('./routes/collezione');
const usersRoutes = require('./routes/users');
const bevuteRoutes = require('./routes/bevute');
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

// REGISTRA ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/collezione', collezioneRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bevute', bevuteRoutes);  // ← PULITO
app.use('/api/upload', uploadRoutes);
app.use('/api/statistiche', statisticheRoutes);
app.use('/api/amici', amiciRoutes);
app.use('/api/log', logRoutes);

// AVVIA SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server attivo su porta ${PORT}`);
});
