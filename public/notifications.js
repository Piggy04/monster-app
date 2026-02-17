// ===== NOTIFICATIONS.JS - Gestione notifiche push =====

const RENDER_API = 'https://monster-app-ocdj.onrender.com/api';

// Controlla se il browser supporta notifiche
function supportaNotifiche() {
  return 'Notification' in window && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
}

// Converti chiave VAPID in Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Richiedi permesso e attiva notifiche
async function attivaNotifiche() {
  console.log('🔵 Inizio attivazione notifiche...');
  
  // Step 1: Supporto browser
  try {
    if (!supportaNotifiche()) {
      alert('❌ Il tuo browser non supporta le notifiche push');
      return false;
    }
    console.log('✅ Step 1: Browser supportato');
  } catch(e) {
    console.error('❌ Step 1 errore:', e);
    alert('Errore controllo supporto: ' + e.message);
    return false;
  }
  
  // Step 2: Permesso
  try {
    const permission = await Notification.requestPermission();
    console.log('✅ Step 2: Permesso =', permission);
    
    if (permission !== 'granted') {
      alert('❌ Permesso notifiche negato');
      return false;
    }
  } catch(e) {
    console.error('❌ Step 2 errore:', e);
    alert('Errore richiesta permesso: ' + e.message);
    return false;
  }
  
  // Step 3: Service Worker
  let registration;
  try {
    registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Step 3a: SW registrato');
    
    await navigator.serviceWorker.ready;
    console.log('✅ Step 3b: SW pronto');
  } catch(e) {
    console.error('❌ Step 3 errore:', e);
    alert('Errore Service Worker: ' + e.message);
    return false;
  }
  
  // Step 4: VAPID key
  let publicKey;
  try {
    const res = await fetch(`${RENDER_API}/notifiche/vapid-public-key`);
    console.log('✅ Step 4a: Fetch VAPID, status =', res.status);
    
    if (!res.ok) {
      throw new Error('Server error ' + res.status);
    }
    
    const data = await res.json();
    publicKey = data.publicKey;
    
    console.log('✅ Step 4b: VAPID key =', publicKey?.substring(0, 30) + '...');
    
    if (!publicKey) {
      throw new Error('VAPID key mancante');
    }
  } catch(e) {
    console.error('❌ Step 4 errore:', e);
    alert('Errore recupero chiave VAPID: ' + e.message);
    return false;
  }
  
  
  // Step 5: Subscribe
let subscription;
try {
  // Prima controlla se esiste già una subscription
  const existingSub = await registration.pushManager.getSubscription();
  
  if (existingSub) {
    console.log('⚠️ Subscription esistente trovata, la rimuovo...');
    await existingSub.unsubscribe();
    console.log('✅ Vecchia subscription rimossa');
  }
  
  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
  
  console.log('✅ Step 5: Subscription creata');
  console.log('Endpoint:', subscription.endpoint.substring(0, 50) + '...');
} catch(e) {
  console.error('❌ Step 5 errore:', e);
  console.error('Nome errore:', e.name);
  console.error('Dettagli:', e.message);
  alert('Errore sottoscrizione push: ' + e.message + '\n\nProva a ricaricare la pagina o usa un altro browser.');
  return false;
}

  
  // Step 6: Salva sul server
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token mancante');
    }
    
    console.log('✅ Step 6a: Token presente');
    
    const saveRes = await fetch(`${RENDER_API}/notifiche/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });
    
    console.log('✅ Step 6b: Fetch salvataggio, status =', saveRes.status);
    
    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error('Errore server:', errText);
      throw new Error('Salvataggio fallito: ' + saveRes.status);
    }
    
    const result = await saveRes.json();
    console.log('✅ Step 6c: Salvato!', result);
    
  } catch(e) {
    console.error('❌ Step 6 errore:', e);
    alert('Errore salvataggio sul server: ' + e.message);
    return false;
  }
  
  console.log('🎉 ATTIVAZIONE COMPLETATA CON SUCCESSO!');
  return true;
}


// Disattiva notifiche
async function disattivaNotifiche() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Notifiche disattivate');
    }
    
    return true;
  } catch(e) {
    console.error('Errore disattivazione:', e);
    return false;
  }
}

// Controlla stato notifiche
async function statoNotifiche() {
  try {
    if (!supportaNotifiche()) return 'non_supportate';
    
    if (Notification.permission === 'denied') return 'negate';
    if (Notification.permission === 'default') return 'non_richieste';
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription ? 'attive' : 'non_attive';
  } catch(e) {
    console.error('Errore check stato:', e);
    return 'errore';
  }
}

// Carica preferenze notifiche
async function caricaPreferenze() {
  try {
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${RENDER_API}/notifiche/preferenze`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Errore caricamento preferenze');
    
    return await res.json();
  } catch(e) {
    console.error('Errore caricamento preferenze:', e);
    return null;
  }
}

// Salva preferenze notifiche
async function salvaPreferenze(preferenze) {
  try {
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${RENDER_API}/notifiche/preferenze`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferenze)
    });
    
    if (!res.ok) throw new Error('Errore salvataggio preferenze');
    
    return true;
  } catch(e) {
    console.error('Errore salvataggio preferenze:', e);
    return false;
  }
}
