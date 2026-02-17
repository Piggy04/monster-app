const cron = require('node-cron');
const { inviaNotifica } = require('../routes/notifiche');
const User = require('../models/User');
const Bevuta = require('../models/Bevuta');
const Possesso = require('../models/Possesso');

// ⏰ Promemoria bevuta giornaliera - ogni giorno alle 20:00
cron.schedule('0 20 * * *', async () => {
  console.log('🔔 Invio promemoria bevuta giornaliera...');
  
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    
    const users = await User.find();
    
    for (const user of users) {
      // Controlla se ha già bevuto oggi
      const bevutaOggi = await Bevuta.findOne({
        utenteId: user._id,
        data: { $gte: oggi }
      });
      
      if (!bevutaOggi) {
        await inviaNotifica(
          user._id,
          '🥤 Hai bevuto una Monster oggi?',
          'Ricordati di registrare la tua Monster del giorno!',
          'promemoria_bevuta'
        );
      }
    }
    
    console.log('✅ Promemoria bevuta inviati');
  } catch(e) {
    console.error('Errore cron promemoria bevuta:', e);
  }
});

// 📊 Promemoria collezione - ogni lunedì alle 19:00
cron.schedule('0 19 * * 1', async () => {
  console.log('🔔 Invio promemoria collezione...');
  
  try {
    const users = await User.find();
    
    for (const user of users) {
      const count = await Possesso.countDocuments({
        utente_id: user._id,
        posseduta: true
      });
      
      await inviaNotifica(
        user._id,
        '📦 Hai nuove Monster da aggiungere?',
        `Hai ${count} Monster nella collezione. Aggiorna la tua lista!`,
        'promemoria_collezione'
      );
    }
    
    console.log('✅ Promemoria collezione inviati');
  } catch(e) {
    console.error('Errore cron collezione:', e);
  }
});

console.log('✅ Cron jobs notifiche attivati');
