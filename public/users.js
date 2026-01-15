const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  console.log('👤 Username:', username);
  console.log('👮 Ruolo:', ruolo);
  console.log('🔑 Token:', token ? 'Present' : 'Missing');

  if (ruolo !== 'admin') {
    console.log('❌ Non sei admin! Ruolo:', ruolo);
    const accessoNegato = document.getElementById('accessoNegato');
    const usersContent = document.getElementById('usersContent');
    if (accessoNegato) accessoNegato.style.display = 'block';
    if (usersContent) usersContent.style.display = 'none';
  } else {
    console.log('✓ Accesso admin confermato');
  }

  caricaTema();
  if (ruolo === 'admin') {
    caricaUtenti();
    // ⬇️ AGGIUNGI: Aggiorna ogni 30 secondi
    setInterval(caricaUtenti, 30000);
  }
});

// CARICA E APPLICA TEMA
async function caricaTema() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      const tema = user.tema || 'light';
      document.documentElement.setAttribute('data-theme', tema);
      
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.querySelector(`.theme-btn.${tema}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  } catch (err) {
    console.error('Errore caricamento tema:', err);
  }
}

// CAMBIA TEMA
async function cambiaTema(nuovoTema) {
  try {
    document.documentElement.setAttribute('data-theme', nuovoTema);
    
    const response = await fetch(`${API_URL}/auth/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema: nuovoTema })
    });
    
    if (response.ok) {
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.theme-btn.${nuovoTema}`).classList.add('active');
    }
    
    const drawer = document.getElementById('themeDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA LISTA UTENTI
async function caricaUtenti() {
  try {
    console.log('📡 Caricamento utenti...');
    
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Risposta status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errore || `Errore ${response.status}`);
    }
    
    const utenti = await response.json();
    console.log('✓ Utenti ricevuti:', utenti.length);
    
    mostraUtenti(utenti);
  } catch (err) {
    console.error('❌ Errore caricamento:', err);
    const tbody = document.querySelector('#tabellaUtenti tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6">❌ Errore: ${err.message}</td></tr>`;
    }
  }
}

// ⬇️ MODIFICATA - Aggiunto stato online e ultimo accesso
function mostraUtenti(utenti) {
  const tbody = document.querySelector('#tabellaUtenti tbody');
  if (!tbody) {
    console.error('Tbody non trovato');
    return;
  }
  
  tbody.innerHTML = '';

  if (!utenti || utenti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Nessun utente trovato</td></tr>';
    return;
  }

  utenti.forEach(utente => {
    const tr = document.createElement('tr');
    
    // Badge ruolo con colori diversi
    let roleBadgeClass = 'role-user';
    let roleText = 'User';
    if (utente.ruolo === 'admin') {
      roleBadgeClass = 'role-admin';
      roleText = 'Admin';
    } else if (utente.ruolo === 'beta') {
      roleBadgeClass = 'role-beta';
      roleText = 'Beta Tester';
    }
    
    // ⬇️ AGGIUNGI: Calcola stato online
    const isOnline = utente.isOnline || false;
    const statusDot = `<span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>`;
    const statusText = utente.testoStato || 'Mai connesso';
    
    tr.innerHTML = `
      <td>
        ${statusDot}
        ${utente.username}
      </td>
      <td>${utente.email}</td>
      <td>
        <span class="role-badge ${roleBadgeClass}">${roleText}</span>
      </td>
      <td>
        <small style="color: #888;">${statusText}</small>
      </td>
      <td>
        <select class="select-ruolo" onchange="cambiaRuolo('${utente._id}', this.value)">
          <option value="user" ${utente.ruolo === 'user' ? 'selected' : ''}>User</option>
          <option value="beta" ${utente.ruolo === 'beta' ? 'selected' : ''}>Beta Tester</option>
          <option value="admin" ${utente.ruolo === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <button class="btn-delete btn-mini" onclick="eliminaUtente('${utente._id}', '${utente.username}')">🗑️ Elimina</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// CAMBIA RUOLO UTENTE
async function cambiaRuolo(userId, nuovoRuolo) {
  try {
    console.log('🔄 Cambio ruolo:', { userId, nuovoRuolo });
    
    const response = await fetch(`${API_URL}/users/${userId}/ruolo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ruolo: nuovoRuolo })
    });
    
    if (response.ok) {
      console.log('✓ Ruolo aggiornato');
      alert('✓ Ruolo aggiornato!');
      caricaUtenti();
    } else {
      const data = await response.json();
      console.error('❌ Errore:', data);
      alert(data.errore || 'Errore cambio ruolo');
      caricaUtenti();
    }
  } catch (err) {
    console.error('❌ Errore cambio ruolo:', err);
    alert('Errore cambio ruolo');
    caricaUtenti();
  }
}

// ELIMINA UTENTE
async function eliminaUtente(id, username) {
  if (!confirm(`Sei sicuro di voler eliminare l'utente ${username}?`)) {
    return;
  }
  
  try {
    console.log('🗑️ Eliminazione utente:', id);
    
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      console.log('✓ Utente eliminato');
      alert('✓ Utente eliminato');
      caricaUtenti();
    } else {
      const data = await response.json();
      console.error('❌ Errore:', data);
      alert(data.errore || 'Errore eliminazione');
    }
  } catch (errore) {
    console.error('❌ Errore eliminazione:', errore);
    alert('Errore eliminazione');
  }
}



if (['admin', 'beta'].includes(utente?.ruolo)) {
  document.getElementById('linkBevute').style.display = 'block';
  document.getElementById('linkAdmin').style.display = 'block';
}
