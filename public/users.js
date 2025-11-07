const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');

if (!token) {
  window.location.href = 'index.html';
}

if (ruolo !== 'admin') {
  document.getElementById('usersContent').style.display = 'none';
  document.getElementById('accessoNegato').style.display = 'block';
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA LISTA UTENTI
async function caricaUtenti() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Errore caricamento utenti');
    }
    
    const utenti = await response.json();
    mostraUtenti(utenti);
  } catch (err) {
    console.error('Errore:', err);
    const tbody = document.querySelector('#tabellaUtenti tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5">Errore nel caricamento degli utenti</td></tr>';
    }
  }
}

function mostraUtenti(utenti) {
  const tbody = document.querySelector('#tabellaUtenti tbody');
  if (!tbody) {
    console.error('Tbody non trovato');
    return;
  }
  
  tbody.innerHTML = '';

  if (!utenti || utenti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Nessun utente trovato</td></tr>';
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
    
    tr.innerHTML = `
      <td>${utente.username}</td>
      <td>${utente.email}</td>
      <td>
        <span class="role-badge ${roleBadgeClass}">${roleText}</span>
      </td>
      <td>
        <select class="select-ruolo" onchange="cambiaRuolo('${utente._id}', this.value)">
          <option value="user" ${utente.ruolo === 'user' ? 'selected' : ''}>User</option>
          <option value="beta" ${utente.ruolo === 'beta' ? 'selected' : ''}>Beta Tester</option>
          <option value="admin" ${utente.ruolo === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <button class="btn-delete btn-mini" onclick="eliminaUtente('${utente._id}')">🗑️ Elimina</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// CAMBIA RUOLO UTENTE
async function cambiaRuolo(userId, nuovoRuolo) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/ruolo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ruolo: nuovoRuolo })
    });
    
    if (response.ok) {
      alert('✓ Ruolo aggiornato!');
      caricaUtenti();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore cambio ruolo');
      caricaUtenti(); // Ricarica anche in caso di errore per ripristinare
    }
  } catch (err) {
    console.error('Errore:', err);
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
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      caricaUtenti();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore eliminazione');
    }
  } catch (errore) {
    alert('Errore eliminazione');
  }
}

if (ruolo === 'admin') {
  caricaUtenti();
}



// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
}

// Chiudi drawer quando clicchi su un tema
const originalCambiaTema = cambiaTema;
window.cambiaTema = function(nuovoTema) {
  originalCambiaTema(nuovoTema);
  document.getElementById('themeDrawer').classList.remove('active');
};
