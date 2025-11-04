const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminAuth = require('../middleware/adminAuth');
const Variante = require('../models/Variante');

// Crea la cartella uploads se non esiste
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurazione Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo immagini sono permesse (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// Upload immagine per variante
router.post('/variante/:id', adminAuth, upload.single('immagine'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ errore: 'Nessuna immagine caricata' });
    }
    
    const variante = await Variante.findByIdAndUpdate(
      req.params.id,
      { immagine: `/uploads/${req.file.filename}` },
      { new: true }
    );
    
    if (!variante) {
      return res.status(404).json({ errore: 'Variante non trovata' });
    }
    
    res.json({ messaggio: 'Immagine caricata', immagine: variante.immagine });
  } catch (errore) {
    res.status(500).json({ errore: 'Errore upload immagine' });
  }
});

module.exports = router;
