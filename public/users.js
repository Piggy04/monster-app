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
    
    if (!response.ok) throw new Error('Errore');
    
    const utenti = await response.json();
    mostraUtenti(utenti);
    
  } catch (errore) {
    document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="5">Errore caricamento utenti</td></tr>';
  }
}

function mostraUtenti(utenti) {
  const tbody = document.getElementById('usersTableBody');
  
  if (utenti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nessun utente trovato</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  utenti.forEach(utente => {
    const data = new Date(utente.createdAt).toLocaleDateString('it-IT');
    const badgeClass = utente.ruolo === 'admin' ? 'role-admin' : 'role-user';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${utente.username}</strong></td>
      <td>${utente.email}</td>
      <td><span class="role-badge ${badgeClass}">${utente.ruolo.toUpperCase()}</span></td>
      <td>${data}</td>
      <td>
        <div class="btn-group">
          <button class="btn-mini btn-role" onclick="cambiaRuolo('${utente._id}', '${utente.ruolo}')">
            ${utente.ruolo === 'admin' ? '⬇️ Rimuovi Admin' : '⬆️ Rendi Admin'}
          </button>
          <button class="btn-mini btn-delete" onclick="eliminaUtente('${utente._id}', '${utente.username}')">🗑️ Elimina</button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// CAMBIA RUOLO
async function cambiaRuolo(id, ruoloAttuale) {
  const nuovoRuolo = ruoloAttuale === 'admin' ? 'user' : 'admin';
  
  if (!confirm(`Vuoi cambiare il ruolo in ${nuovoRuolo}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${id}/ruolo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ruolo: nuovoRuolo })
    });
    
    if (response.ok) {
      caricaUtenti();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore cambio ruolo');
    }
  } catch (errore) {
    alert('Errore cambio ruolo');
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
