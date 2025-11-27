let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');
let avatarSelezionato = '';

const AVATARS = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0QURBQTRhIi8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMjQiIHI9IjgiIGZpbGw9IiNGRkYiLz4KPC9zdmc+', // Grigio
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMwMEZGNEIiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=', // Verde Monster
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMyRUNDNzEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4='  // Verde scuro
];

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('nomeUtente').textContent = `Ciao, ${username}!`;

  if (ruolo === 'admin') {
    ['linkAdmin', 'linkUsers', 'linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // ✅ PRIORITÀ: prima UI, poi API
  caricaTema().catch(console.error);
  caricaInfoProfilo().catch(console.error);
  caricaAvatar().catch(console.error);
  creaModalAvatar();
});

async function caricaAvatar() {
  try {
    const res = await fetch(`${API_URL}/users/avatar`, { // ✅ SINGOLO /users/
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      avatarSelezionato = data.avatar;
      const preview = document.getElementById('avatarPreview');
      if (preview) {
        preview.src = avatarSelezionato;
        preview.style.display = 'block';
      }
    }
  } catch {}
}

async function caricaInfoProfilo() {
  try {
    const res = await fetch(`${API_URL}/users/me`, { // ✅ SINGOLO /users/
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('infoUsername').textContent = user.username;
      document.getElementById('infoEmail').textContent = user.email;
      document.getElementById('infoRuolo').textContent = 
        user.ruolo === 'admin' ? 'Admin' : user.ruolo === 'beta' ? 'Beta Tester' : 'User';
      document.getElementById('infoData').textContent = 
        new Date(user.createdAt).toLocaleDateString('it-IT');
    }
  } catch {}
}

function creaModalAvatar() {
  if (document.getElementById('modalAvatar')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="modalAvatar" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;justify-content:center;align-items:center;">
      <div style="background:var(--bg-primary);padding:30px;border-radius:15px;max-width:500px;width:90%;max-height:80vh;overflow:auto;">
        <span onclick="chiudiModalAvatar()" style="float:right;font-size:28px;cursor:pointer;">&times;</span>
        <h3>👤 Scegli Avatar</h3>
        <div id="avatarGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:15px;margin:20px 0;"></div>
        <div style="text-align:center;">
          <button class="btn-primary" onclick="salvaAvatar()">💾 Salva</button>
          <button onclick="chiudiModalAvatar()" style="margin-left:10px;">Annulla</button>
        </div>
      </div>
    </div>
  `);
  popolaAvatarPicker();
}

function popolaAvatarPicker() {
  const grid = document.getElementById('avatarGrid');
  if (!grid) return;
  grid.innerHTML = '';
  AVATARS.forEach(url => {
    const div = document.createElement('div');
    div.className = 'avatar-option' + (url === avatarSelezionato ? ' selected' : '');
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Avatar';
    img.style.cssText = 'width:64px;height:64px;border-radius:12px;object-fit:cover;';
    div.appendChild(img);
    div.onclick = () => selezionaAvatar(url);
    grid.appendChild(div);
  });
}

function selezionaAvatar(url) {
  avatarSelezionato = url;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  const preview = document.getElementById('avatarPreview');
  if (preview) preview.src = url;
}

async function salvaAvatar() {
  try {
    const res = await fetch(`${API_URL}/users/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ avatarUrl: avatarSelezionato })
    });
    if (res.ok) {
      alert('Avatar salvato!');
      chiudiModalAvatar();
    }
  } catch {}
}

function apriAvatarPicker() { document.getElementById('modalAvatar').style.display = 'flex'; }
function chiudiModalAvatar() { document.getElementById('modalAvatar').style.display = 'none'; }

async function caricaTema() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { // ✅ SINGOLO /auth/
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.documentElement.setAttribute('data-theme', user.tema || 'light');
    }
  } catch {}
}

async function cambiaTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  try {
    await fetch(`${API_URL}/auth/me/tema`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tema })
    });
  } catch {}
}

function toggleThemeDrawer() {
  document.getElementById('themeDrawer')?.classList.toggle('active');
}

function logout() { localStorage.clear(); window.location.href = 'index.html'; }

// Altre funzioni (username, email, password, elimina) RIMANGONO UGUALI
async function cambiaUsername() {
  const nuovo = document.getElementById('nuovoUsername').value.trim();
  if (!nuovo) return alert('⚠️ Inserisci username');
  try {
    const res = await fetch(`${API_URL}/auth/cambia-username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username: nuovo })
    });
    if (res.ok) {
      alert('✓ Username aggiornato!');
      localStorage.setItem('username', nuovo);
      document.getElementById('nuovoUsername').value = '';
      location.reload();
    }
  } catch { alert('Errore'); }
}

async function cambiaEmail() {
  const nuova = document.getElementById('nuovaEmail').value.trim();
  if (!nuova) return alert('⚠️ Inserisci email');
  try {
    const res = await fetch(`${API_URL}/auth/cambia-email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: nuova })
    });
    if (res.ok) alert('✓ Email aggiornata!');
  } catch { alert('Errore'); }
}

async function cambiaPassword() {
  const vec = document.getElementById('passwordVecchia').value;
  const nu = document.getElementById('nuovaPassword').value;
  const conf = document.getElementById('confermaPassword').value;
  if (!vec || !nu || !conf || nu !== conf || nu.length < 6) return alert('⚠️ Controlla campi');
  try {
    const res = await fetch(`${API_URL}/auth/cambia-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ passwordVecchia: vec, nuovaPassword: nu })
    });
    if (res.ok) {
      alert('✓ Password aggiornata!');
      ['passwordVecchia','nuovaPassword','confermaPassword'].forEach(id => 
        document.getElementById(id).value = '');
    }
  } catch { alert('Errore'); }
}

function confermaEliminazioneAccount() {
  if (!confirm('⚠️ IRREVERSIBILE!')) return;
  if (prompt('Digita ELIMINA:') !== 'ELIMINA') return alert('Annullato');
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    await fetch(`${API_URL}/auth/elimina-account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    localStorage.clear();
    window.location.href = 'index.html';
  } catch { alert('Errore'); }
}
