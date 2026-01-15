const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User'); // <--- Cambiato da ./models/User a ../models/User

async function aggiornaUtenti() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connesso a MongoDB');

    const result = await User.updateMany(
      {
        $or: [
          { mostriPosseduti: { $exists: false } },
          { variantiPossedute: { $exists: false } }
        ]
      },
      {
        $set: {
          mostriPosseduti: [],
          variantiPossedute: []
        }
      }
    );

    console.log(`✅ Documenti aggiornati: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Disconnesso da MongoDB');
  } catch (err) {
    console.error('❌ Errore durante aggiornamento utenti:', err);
    process.exit(1);
  }
}

aggiornaUtenti();
