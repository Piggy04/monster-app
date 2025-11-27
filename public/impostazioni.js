let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');
let avatarSelezionato = '';

// ✅ AVATARS con URL HTTPS VALIDi (server li accetta)
const AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg', 
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/91.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face'
];

// Verifica se API_URL termina con /api per evitare duplicazioni
const API_USERS = API_URL.endsWith('/api') ? `${API_URL}/users` : `${API_URL}/api/users`;
const API_AUTH = API_URL.endsWith('/api') ? `${API_URL}/auth` : `${API_URL}/api/auth`;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('nomeUtente').textContent = `Ciao, ${username}!`;

  if (ruolo === 'admin') {
    ['linkAdmin', 'linkUsers', 'linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  caricaTema().catch(() => {});
  caricaInfoProfilo().catch(() => {});
  caricaAvatar().catch(() => {});
  creaModalAvatar();
});

async function caricaAvatar() {
  try {
    const res = await fetch(`${API_USERS}/avatar`, {
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
    const res = await fetch(`${API_USERS}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('infoUsername').textContent = user.username || username;
      document.getElementById('infoEmail').textContent = user.email || 'N/D';
      document.getElementById('infoRuolo').textContent = 
        user.ruolo === 'admin' ? 'Admin' : 
        user.ruolo === 'beta' ? 'Beta Tester' : 'User';
      document.getElementById('infoData').textContent = 
        user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/D';
    } else {
      document.getElementById('infoUsername').textContent = username;
      document.getElementById('infoRuolo').textContent = ruolo === 'admin' ? 'Admin' : 'User';
    }
  } catch {
    document.getElementById('infoUsername').textContent = username;
    document.getElementById('infoRuolo').textContent = ruolo === 'admin' ? 'Admin' : 'User';
  }
}

function creaModalAvatar() {
  if (document.getElementById('modalAvatar')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="modalAvatar" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;justify-content:center;align-items:center;">
      <div style="background:var(--bg-primary);padding:30px;border-radius:15px;max-width:500px;width:90%;max-height:80vh;overflow:auto;">
        <span onclick="chiudiModalAvatar()" style="float:right;font-size:28px;cursor:pointer;color:var(--text-primary);">&times;</span>
        <h3 style="margin-top:0;">👤 Scegli Avatar</h3>
        <div id="avatarGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:15px;margin:20px 0;"></div>
        <div style="text-align:center;">
          <button class="btn-primary" onclick="salvaAvatar()">💾 Salva</button>
          <button onclick="chiudiModalAvatar()" style="margin-left:10px;background:#6c757d;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Annulla</button>
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
    div.style.cssText = 'cursor:pointer;padding:10px;border-radius:12px;transition:all 0.3s;text-align:center;';
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Avatar';
    img.style.cssText = 'width:64px;height:64px;border-radius:12px;object-fit:cover;border:3px solid transparent;';
    img.onerror = () => { img.src = AVATARS[0]; }; // Fallback primo avatar
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
  if (preview) {
    preview.src = url;
    preview.style.display = 'block';
  }
}

async function salvaAvatar() {
  try {
    const res = await fetch(`${API_USERS}/avatar`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        avatarUrl: avatarSelezionato  // ✅ Nome campo corretto per server
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      alert(data.messaggio || '✅ Avatar salvato!');
      chiudiModalAvatar();
    } else {
      const err = await res.json();
      alert('❌ ' + (err.errore || 'Errore server'));
    }
  } catch (e) {
    console.error('Errore rete:', e);
    alert('⚠️ Errore di rete - Avatar selezionato localmente');
    // Salva comunque localmente
    localStorage.setItem('avatar', avatarSelezionato);
    chiudiModalAvatar();
  }
}

function apriAvatarPicker() { document.getElementById('modalAvatar').style.display = 'flex'; }
function chiudiModalAvatar() { document.getElementById('modalAvatar').style.display = 'none'; }

async function caricaTema() {
  try {
    const res = await fetch(`${API_AUTH}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.documentElement.setAttribute('data-theme', user.tema || 'light');
      document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.querySelector(`.theme-btn.${user.tema || 'light'}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  } catch {}
}

async function cambiaTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  try {
    await fetch(`${API_AUTH}/me/tema`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tema })
    });
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.theme-btn.${tema}`).classList.add('active');
    const drawer = document.getElementById('themeDrawer');
    if (drawer) drawer.classList.remove('active');
  } catch {}
}

function toggleThemeDrawer() {
  document.getElementById('themeDrawer')?.classList.toggle('active');
}

function logout() { 
  if (confirm('Confermi logout?')) {
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

async function cambiaUsername() {
  const nuovo = document.getElementById('nuovoUsername').value.trim();
  if (!nuovo) return alert('⚠️ Inserisci username');
  try {
    const res = await fetch(`${API_AUTH}/cambia-username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username: nuovo })
    });
    if (res.ok) {
      alert('✅ Username aggiornato!');
      localStorage.setItem('username', nuovo);
      document.getElementById('nuovoUsername').value = '';
      location.reload();
    } else {
      const err = await res.json();
      alert('❌ ' + (err.errore || 'Errore'));
    }
  } catch { alert('❌ Errore rete'); }
}

async function cambiaEmail() {
  const nuova = document.getElementById('nuovaEmail').value.trim();
  if (!nuova) return alert('⚠️ Inserisci email');
  try {
    const res = await fetch(`${API_AUTH}/cambia-email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: nuova })
    });
    if (res.ok) {
      alert('✅ Email aggiornata!');
      document.getElementById('nuovaEmail').value = '';
    } else {
      const err = await res.json();
      alert('❌ ' + (err.errore || 'Errore'));
    }
  } catch { alert('❌ Errore rete'); }
}

async function cambiaPassword() {
  const vec = document.getElementById('passwordVecchia').value;
  const nu = document.getElementById('nuovaPassword').value;
  const conf = document.getElementById('confermaPassword').value;
  
  if (!vec || !nu || !conf) return alert('⚠️ Compila tutti i campi');
  if (nu !== conf) return alert('⚠️ Password non coincidono');
  if (nu.length < 6) return alert('⚠️ Minimo 6 caratteri');
  
  try {
    const res = await fetch(`${API_AUTH}/cambia-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ passwordVecchia: vec, nuovaPassword: nu })
    });
    if (res.ok) {
      alert('✅ Password aggiornata!');
      ['passwordVecchia','nuovaPassword','confermaPassword'].forEach(id => 
        document.getElementById(id).value = '');
    } else {
      const err = await res.json();
      alert('❌ ' + (err.errore || 'Errore'));
    }
  } catch { alert('❌ Errore rete'); }
}

function confermaEliminazioneAccount() {
  if (!confirm('⚠️ Sei SICURO? IRREVERSIBILE!')) return;
  if (prompt('Digita ELIMINA per confermare:') !== 'ELIMINA') return alert('Annullato');
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    await fetch(`${API_AUTH}/elimina-account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    localStorage.clear();
    window.location.href = 'index.html';
  } catch { alert('❌ Errore eliminazione'); }
}
