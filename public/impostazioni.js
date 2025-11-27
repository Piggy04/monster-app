let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');
let avatarSelezionato = '';

const AVATARS = [
  'https://via.placeholder.com/128/4a4a4a/ffffff?text=👤',
  'https://via.placeholder.com/128/00ff41/1a1a1a?text=M',
  'https://via.placeholder.com/128/2ecc71/1a1a1a?text=⚡',
  'https://via.placeholder.com/128/3498db/ffffff?text=🔥',
  'https://via.placeholder.com/128/e74c3c/ffffff?text=💀',
  'https://via.placeholder.com/128/f39c12/ffffff?text=⭐',
  'https://via.placeholder.com/128/9b59b6/ffffff?text=🎮',
  'https://via.placeholder.com/128/1abc9c/ffffff?text=🌊'
];

document.addEventListener('DOMContentLoaded', async () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    const linkLogAdmin = document.getElementById('linkLogAdmin');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
    if (linkLogAdmin) linkLogAdmin.style.display = 'block';
  }

  caricaTema();
  await caricaInfoProfilo();
  await caricaAvatar();
  creaModalAvatar(); // Crea modal picker
});

// ✅ CARICA AVATAR
async function caricaAvatar() {
  try {
    const response = await fetch(`${API_URL}/api/users/avatar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      avatarSelezionato = data.avatar;
      
      // Mostra avatar nel profilo
      const avatarPreview = document.getElementById('avatarPreview');
      if (avatarPreview) {
        avatarPreview.src = avatarSelezionato;
        avatarPreview.style.display = 'block';
      }
    }
  } catch (err) {
    console.warn('Avatar non disponibile:', err);
  }
}

// ✅ CARICA INFO PROFILO (con avatar)
async function caricaInfoProfilo() {
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      
      document.getElementById('infoUsername').textContent = user.username;
      document.getElementById('infoEmail').textContent = user.email;
      document.getElementById('infoRuolo').textContent = 
        user.ruolo === 'admin' ? 'Admin' : 
        user.ruolo === 'beta' ? 'Beta Tester' : 'User';
      
      const data = new Date(user.createdAt);
      document.getElementById('infoData').textContent = data.toLocaleDateString('it-IT');
    }
  } catch (err) {
    console.error('Errore caricamento profilo:', err);
  }
}

// ✅ CREA MODAL AVATAR PICKER
function creaModalAvatar() {
  if (document.getElementById('modalAvatar')) return;
  
  const modalHTML = `
    <div id="modalAvatar" class="modal" style="display:none;">
      <div class="modal-content">
        <span class="close" onclick="chiudiModalAvatar()">&times;</span>
        <h3>👤 Scegli Avatar</h3>
        <div id="avatarGrid" class="avatar-grid"></div>
        <div style="text-align:center; margin-top:20px;">
          <button class="btn-primary" onclick="salvaAvatar()">💾 Salva</button>
          <button onclick="chiudiModalAvatar()" style="margin-left:10px;">Annulla</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  popolaAvatarPicker();
}

// ✅ POPOLA AVATAR PICKER
function popolaAvatarPicker() {
  const grid = document.getElementById('avatarGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  AVATARS.forEach(url => {
    const div = document.createElement('div');
    div.className = 'avatar-option' + (url === avatarSelezionato ? ' selected' : '');
    div.innerHTML = `<img src="${url}" alt="Avatar" onerror="this.src='https://via.placeholder.com/64/4a4a4a/ffffff?text=👤'">`;
    div.onclick = () => selezionaAvatar(url);
    grid.appendChild(div);
  });
}

// ✅ SELEZIONA AVATAR
function selezionaAvatar(url) {
  avatarSelezionato = url;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  
  const preview = document.getElementById('avatarPreview');
  if (preview) preview.src = url;
}

// ✅ SALVA AVATAR
async function salvaAvatar() {
  try {
    const response = await fetch(`${API_URL}/api/users/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ avatarUrl: avatarSelezionato })
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(data.messaggio || 'Avatar salvato!');
      chiudiModalAvatar();
    } else {
      alert('Errore nel salvataggio');
    }
  } catch (err) {
    alert('Errore di rete');
  }
}

// ✅ MODAL CONTROLLI
function apriAvatarPicker() {
  document.getElementById('modalAvatar').style.display = 'block';
}

function chiudiModalAvatar() {
  document.getElementById('modalAvatar').style.display = 'none';
}

// ===== FUNZIONI ESISTENTI (invariate + fix) =====
async function caricaTema() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      const tema = user.tema || 'light';
      document.documentElement.setAttribute('data-theme', tema);
      
      document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.querySelector(`.theme-btn.${tema}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  } catch (err) {
    console.error('Errore caricamento tema:', err);
  }
}

async function cambiaTema(nuovoTema) {
  try {
    document.documentElement.setAttribute('data-theme', nuovoTema);
    
    const response = await fetch(`${API_URL}/api/auth/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema: nuovoTema })
    });
    
    if (response.ok) {
      document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelector(`.theme-btn.${nuovoTema}`).classList.add('active');
      
      const drawer = document.getElementById('themeDrawer');
      if (drawer) drawer.classList.remove('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

async function cambiaUsername() {
  const nuovoUsername = document.getElementById('nuovoUsername').value.trim();
  
  if (!nuovoUsername) {
    alert('⚠️ Inserisci un nuovo username');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/cambia-username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username: nuovoUsername })
    });
    
    if (response.ok) {
      alert('✓ Username aggiornato!');
      localStorage.setItem('username', nuovoUsername);
      document.getElementById('nuovoUsername').value = '';
      caricaInfoProfilo();
      document.getElementById('nomeUtente').textContent = `Ciao, ${nuovoUsername}!`;
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'aggiornamento');
  }
}

async function cambiaEmail() {
  const nuovaEmail = document.getElementById('nuovaEmail').value.trim();
  
  if (!nuovaEmail) {
    alert('⚠️ Inserisci una nuova email');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/cambia-email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email: nuovaEmail })
    });
    
    if (response.ok) {
      alert('✓ Email aggiornata!');
      document.getElementById('nuovaEmail').value = '';
      caricaInfoProfilo();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'aggiornamento');
  }
}

// ✅ FIX CAMBIO PASSWORD (endpoint corretto)
async function cambiaPassword() {
  const passwordVecchia = document.getElementById('passwordVecchia').value;
  const nuovaPassword = document.getElementById('nuovaPassword').value;
  const confermaPassword = document.getElementById('confermaPassword').value;
  
  if (!passwordVecchia || !nuovaPassword || !confermaPassword) {
    alert('⚠️ Compila tutti i campi');
    return;
  }
  
  if (nuovaPassword !== confermaPassword) {
    alert('⚠️ Le password non coincidono');
    return;
  }
  
  if (nuovaPassword.length < 6) {
    alert('⚠️ La password deve avere almeno 6 caratteri');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/cambia-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        passwordVecchia,
        nuovaPassword
      })
    });
    
    if (response.ok) {
      alert('✓ Password aggiornata con successo!');
      document.getElementById('passwordVecchia').value = '';
      document.getElementById('nuovaPassword').value = '';
      document.getElementById('confermaPassword').value = '';
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore cambio password:', err);
    alert('Errore di rete');
  }
}

function confermaEliminazioneAccount() {
  if (!confirm('⚠️ Sei SICURO? Questa azione è IRREVERSIBILE!')) return;
  if (!confirm('🔴 ULTIMA CONFERMA: Digita "ELIMINA"')) return;
  
  const conferma = prompt('Digita ELIMINA per confermare:');
  if (conferma !== 'ELIMINA') {
    alert('Operazione annullata');
    return;
  }
  
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    const response = await fetch(`${API_URL}/api/auth/elimina-account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      alert('✓ Account eliminato');
      localStorage.clear();
      window.location.href = 'index.html';
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'eliminazione');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'eliminazione');
  }
}
