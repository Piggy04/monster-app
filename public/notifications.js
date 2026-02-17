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
  try {
    if (!supportaNotifiche()) {
      alert('❌ Il tuo browser non supporta le notifiche push');
      return false;
    }
    
    // 1. Chiedi permesso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      alert('❌ Permesso notifiche negato');
      return false;
    }
    
    // 2. Registra Service Worker
    const registration = await navigator.serviceWorker.ready;
    
    // 3. Ottieni chiave VAPID pubblica
    const res = await fetch(`${RENDER_API}/notifiche/vapid-public-key`);
    const { publicKey } = await res.json();
    
    // 4. Sottoscrivi alle notifiche
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    // 5. Invia subscription al backend
    const token = localStorage.getItem('token');
    
    const saveRes = await fetch(`${RENDER_API}/notifiche/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });
    
    if (!saveRes.ok) throw new Error('Errore salvataggio subscription');
    
    console.log('✅ Notifiche attivate!');
    return true;
    
  } catch(e) {
    console.error('Errore attivazione notifiche:', e);
    alert('❌ Errore: ' + e.message);
    return false;
  }
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
