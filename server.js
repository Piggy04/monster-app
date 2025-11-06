const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');


const app = express();

app.use(cors({
  origin: ['https://monster-sw.netlify.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// CONNETTI PRIMA
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connesso'))
  .catch(err => console.error(err));

  // Serve i file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// POI REGISTRA LE ROUTE
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collezione', require('./routes/collezione'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/statistiche', require('./routes/statistiche'));
const amiciRouter = require('./routes/amici');
app.use('/api/amici', amiciRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
