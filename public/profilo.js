let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');
let avatarSelezionato = '';

const API_USERS = API_URL.endsWith('/api') ? `${API_URL}/users` : `${API_URL}/api/users`;
const API_AUTH = API_URL.endsWith('/api') ? `${API_URL}/auth` : `${API_URL}/api/auth`;

// Avatar da URL https validi
const AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/91.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face'
];

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('displayUsername').textContent = username || 'Utente';

  if (ruolo === 'admin') {
    ['linkAdmin', 'linkUsers', 'linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  await caricaAvatar();
  await caricaInfoProfilo();
  await caricaStatistiche();
});

async function caricaAvatar() {
  try {
    const res = await fetch(`${API_USERS}/avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      avatarSelezionato = data.avatar;
      const preview = document.getElementById('avatarPreview');
      if (preview) {
        preview.src = avatarSelezionato;
        preview.style.display = 'block';
      }
    } else {
      // fallback avatar default
      document.getElementById('avatarPreview').src = AVATARS[0];
    }
  } catch {
    document.getElementById('avatarPreview').src = AVATARS[0];
  }
}

async function caricaInfoProfilo() {
  try {
    const res = await fetch(`${API_USERS}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('displayUsername').textContent = user.username || username;
      document.getElementById('displayEmail').textContent = user.email || 'Non disponibile';
      document.getElementById('inputUsername').value = user.username || '';
      document.getElementById('inputEmail').value = user.email || '';
    } else {
      document.getElementById('displayEmail').textContent = 'Non disponibile';
    }
  } catch {
    document.getElementById('displayEmail').textContent = 'Non disponibile';
  }
}

async function caricaStatistiche() {
  // Modifica questa funzione in base ai dati che vuoi mostrare
  try {
    const res = await fetch(`${API_USERS}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('statLattine').textContent = stats.lattineCollezionate || 0;
      const data = new Date(stats.createdAt);
      document.getElementById('statData').textContent = data.toLocaleDateString('it-IT');
    }
  } catch {
    document.getElementById('statLattine').textContent = '0';
    document.getElementById('statData').textContent = '--/--/----';
  }
}

async function cambiaUsername() {
  const nuovo = document.getElementById('inputUsername').value.trim();
  if (!nuovo) return alert('⚠️ Inserisci un nome utente valido');
  try {
    const res = await fetch(`${API_AUTH}/cambia-username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: nuovo })
    });
    if (res.ok) {
      alert('✓ Username aggiornato!');
      localStorage.setItem('username', nuovo);
      document.getElementById('displayUsername').textContent = nuovo;
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore durante l\'aggiornamento');
    }
  } catch {
    alert('Errore di rete');
  }
}

async function cambiaEmail() {
  const nuovaEmail = document.getElementById('inputEmail').value.trim();
  if (!nuovaEmail) return alert('⚠️ Inserisci una email valida');
  try {
    const res = await fetch(`${API_AUTH}/cambia-email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: nuovaEmail })
    });
    if (res.ok) {
      alert('✓ Email aggiornata!');
      document.getElementById('displayEmail').textContent = nuovaEmail;
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore durante l\'aggiornamento');
    }
  } catch {
    alert('Errore di rete');
  }
}

async function cambiaPassword() {
  const vecchia = document.getElementById('oldPassword').value;
  const nuova = document.getElementById('newPassword').value;
  const conferma = document.getElementById('confirmPassword').value;

  if (!vecchia || !nuova || !conferma) return alert('⚠️ Compila tutti i campi della password');
  if (nuova !== conferma) return alert('⚠️ Le password non corrispondono');
  if (nuova.length < 6) return alert('⚠️ La password deve contenere almeno 6 caratteri');

  try {
    const res = await fetch(`${API_AUTH}/cambia-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ passwordVecchia: vecchia, nuovaPassword: nuova })
    });
    if (res.ok) {
      alert('✓ Password aggiornata!');
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore durante l\'aggiornamento');
    }
  } catch {
    alert('Errore di rete');
  }
}

function confermaEliminazioneAccount() {
  if (!confirm('⚠️ Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.')) return;
  if (prompt('Digita ELIMINA per confermare:') !== 'ELIMINA') return alert('Eliminazione annullata');
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    const res = await fetch(`${API_AUTH}/elimina-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert('Account eliminato con successo');
      localStorage.clear();
      window.location.href = 'index.html';
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore durante l\'eliminazione');
    }
  } catch {
    alert('Errore di rete');
  }
}

function logout() {
  if (confirm('Sei sicuro di voler uscire?')) {
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}
