let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const usernameLS = localStorage.getItem('username');
const ruoloLS = localStorage.getItem('ruolo');

const API_USERS = API_URL.endsWith('/api') ? `${API_URL}/users` : `${API_URL}/api/users`;
const API_AUTH  = API_URL.endsWith('/api') ? `${API_URL}/auth`  : `${API_URL}/api/auth`;

let avatarSelezionato = '';

const AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/91.jpg'
];

document.addEventListener('DOMContentLoaded', () => {
  if (ruoloLS === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  caricaProfilo();
  caricaAvatar();
  creaAvatarGrid();
  initScrollToTop();
});

async function caricaProfilo() {
  try {
    const res = await fetch(`${API_USERS}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();

    const user = await res.json();

    const uname = user.username || usernameLS || 'Utente';
    const email = user.email || 'N/D';
    const ruolo = user.ruolo || ruoloLS || 'user';
    const created = user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '--/--/----';
    const lattine = user.stats?.totalePossedute ?? 0;

    document.getElementById('displayUsername').textContent = uname;
    document.getElementById('displayStats').textContent =
      `Lattine collezionate: ${lattine} • Account creato il: ${created}`;
    document.getElementById('infoUsername').textContent = uname;
    document.getElementById('infoEmail').textContent = email;
    document.getElementById('infoRuolo').textContent =
      ruolo === 'admin' ? 'Admin' : ruolo === 'beta' ? 'Beta tester' : 'Utente';
    document.getElementById('infoData').textContent = created;

    document.getElementById('inputUsername').value = uname;
    document.getElementById('inputEmail').value = email;

  } catch {
    document.getElementById('displayUsername').textContent = usernameLS || 'Utente';
    document.getElementById('displayStats').textContent =
      'Lattine collezionate: 0 • Account creato il: --/--/----';
  }
}

async function caricaAvatar() {
  try {
    const res = await fetch(`${API_USERS}/avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    avatarSelezionato = data.avatar;
  } catch {
    avatarSelezionato = AVATARS[0];
  }
  const img = document.getElementById('avatarPreview');
  if (img) img.src = avatarSelezionato;
  evidenziaAvatarSelezionato();
}

function creaAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  if (!grid) return;
  grid.innerHTML = '';
  AVATARS.forEach(url => {
    const div = document.createElement('div');
    div.className = 'avatar-option' + (url === avatarSelezionato ? ' selected' : '');
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Avatar';
    div.appendChild(img);
    div.addEventListener('click', () => {
      avatarSelezionato = url;
      const preview = document.getElementById('avatarPreview');
      if (preview) preview.src = url;
      evidenziaAvatarSelezionato();
    });
    grid.appendChild(div);
  });
}

function evidenziaAvatarSelezionato() {
  document.querySelectorAll('.avatar-option').forEach(div => {
    const img = div.querySelector('img');
    div.classList.toggle('selected', img && img.src === avatarSelezionato);
  });
}

function apriAvatarPicker() {
  document.getElementById('modalAvatar').style.display = 'block';
}

function chiudiModalAvatar() {
  document.getElementById('modalAvatar').style.display = 'none';
}

async function salvaAvatar() {
  try {
    const res = await fetch(`${API_USERS}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ avatarUrl: avatarSelezionato })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.errore || 'Errore nel salvataggio avatar');
      return;
    }
    alert('Avatar aggiornato!');
    chiudiModalAvatar();
  } catch {
    alert('Errore di rete nel salvataggio avatar');
  }
}

async function cambiaUsername() {
  const nuovo = document.getElementById('inputUsername').value.trim();
  if (!nuovo) return alert('Inserisci un username valido');
  try {
    const res = await fetch(`${API_AUTH}/cambia-username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username: nuovo })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.errore || 'Errore aggiornamento username');
      return;
    }
    localStorage.setItem('username', nuovo);
    alert('Username aggiornato');
    caricaProfilo();
  } catch {
    alert('Errore di rete');
  }
}

async function cambiaEmail() {
  const nuova = document.getElementById('inputEmail').value.trim();
  if (!nuova) return alert('Inserisci una email valida');
  try {
    const res = await fetch(`${API_AUTH}/cambia-email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: nuova })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.errore || 'Errore aggiornamento email');
      return;
    }
    alert('Email aggiornata');
    caricaProfilo();
  } catch {
    alert('Errore di rete');
  }
}

async function cambiaPassword() {
  const vecchia = document.getElementById('oldPassword').value;
  const nuova = document.getElementById('newPassword').value;
  const conf   = document.getElementById('confirmPassword').value;

  if (!vecchia || !nuova || !conf) return alert('Compila tutti i campi');
  if (nuova !== conf) return alert('Le password non coincidono');
  if (nuova.length < 6) return alert('Minimo 6 caratteri');

  try {
    const res = await fetch(`${API_AUTH}/cambia-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ passwordVecchia: vecchia, nuovaPassword: nuova })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.errore || 'Errore aggiornamento password');
      return;
    }
    alert('Password aggiornata');
    ['oldPassword','newPassword','confirmPassword'].forEach(id => {
      document.getElementById(id).value = '';
    });
  } catch {
    alert('Errore di rete');
  }
}

function confermaEliminazioneAccount() {
  if (!confirm('Sei sicuro di voler eliminare il tuo account?')) return;
  const check = prompt('Digita ELIMINA per confermare:');
  if (check !== 'ELIMINA') return alert('Operazione annullata');
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    const res = await fetch(`${API_AUTH}/elimina-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.errore || 'Errore eliminazione account');
      return;
    }
    localStorage.clear();
    alert('Account eliminato');
    window.location.href = 'index.html';
  } catch {
    alert('Errore di rete');
  }
}

function logout() {
  if (confirm('Vuoi davvero uscire?')) {
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

/* utilità scroll to top già previste dal tuo CSS */
function initScrollToTop() {
  const btn = document.getElementById('scrollToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });
}
