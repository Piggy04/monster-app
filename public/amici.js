let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const usernameLS = localStorage.getItem('username');
const ruoloLS = localStorage.getItem('ruolo');

let amiciData = [];
let filtrati = [];
let richiesteRicevute = [];
let richiesteInviate = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (ruoloLS === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // MAGIC: Carica tutto all'avvio e mostra AMICI subito!
  await Promise.all([
    initAmici(),
    caricaStatisticheSociali(),
    caricaBadgeRichieste()
  ]);

  // Live updates ogni 15s
  setInterval(async () => {
    await Promise.all([
      caricaStatisticheSociali(),
      caricaBadgeRichieste()
    ]);
  }, 15000);
});

// 🔥 INIZIALIZZAZIONE MAGICA - Mostra amici SUBITO
async function initAmici() {
  try {
    const res = await fetch(`${API_URL}/amici?include=stats,online,lastSeen`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error();
    amiciData = await res.json();
    filtrati = [...amiciData];
    
    renderAmiciGrid();
  } catch (err) {
    console.error('Errore caricamento amici:', err);
  }
}

// 🎨 RENDER GRID AMICI
function renderAmiciGrid() {
  const container = document.getElementById('amiciGrid');
  if (!container) return;

  if (filtrati.length === 0) {
    container.innerHTML = `
      <div class="no-amici-placeholder">
        <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
        <h3>Aggiungi i tuoi primi amici!</h3>
        <p>Invita collezionisti per condividere progressi e competere</p>
        <button class="btn-primary" onclick="mostraTab('ricerca')" style="margin-top: 20px;">
          🔍 Inizia a cercare
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrati.map(amico => {
    const ultimaAttivita = amico.ultimaAttivita 
      ? new Date(amico.ultimaAttivita).toLocaleString('it-IT', { 
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      : 'Mai visto online';
    
    return `
      <div class="amico-card-enhanced" data-id="${amico._id}">
        <div class="amico-avatar-section">
          <div class="avatar-container">
            <img src="${amico.avatar || 'https://via.placeholder.com/80/2c3e50/ffffff?text=?'}"
                 alt="${amico.username}" 
                 class="amico-avatar ${amico.online ? 'online' : ''}"
                 onerror="this.src='https://via.placeholder.com/80/2c3e50/ffffff?text=?'">
            ${amico.online ? '<div class="online-indicator"></div>' : ''}
          </div>
          <div class="amico-stats-mini">
            <div>${amico.mostriPosseduti || 0} <small>mostri</small></div>
            <div class="progress-mini" style="width: ${amico.percentuale || 0}%"></div>
          </div>
        </div>
        <div class="amico-info">
          <h3>${amico.username}</h3>
          <p>${amico.ruolo === 'admin' ? '👑 Admin' : '👤 Collezionista'}</p>
          <small>${ultimaAttivita} ${amico.online ? '🟢 Online' : '⚫ Offline'}</small>
        </div>
        <div class="amico-actions">
          <button class="btn-view" onclick="visualizzaCollezione('${amico._id}', '${amico.username}')">
            👁️ Collezione
          </button>
          <button class="btn-delete btn-mini" onclick="rimuoviAmico('${amico._id}', '${amico.username}')">
            🗑️ Rimuovi
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 🔍 FILTRA AMICI IN TEMPO REALE
function filtraAmici() {
  const query = document.getElementById('ricercaAmici').value.toLowerCase().trim();
  if (!query) {
    filtrati = [...amiciData];
  } else {
    filtrati = amiciData.filter(amico => 
      amico.username.toLowerCase().includes(query) ||
      (amico.ruolo && amico.ruolo.toLowerCase().includes(query))
    );
  }
  renderAmiciGrid();
}

// 📊 STATS LIVE
async function caricaStatisticheSociali() {
  try {
    const res = await fetch(`${API_URL}/amici/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    
    const stats = await res.json();
    document.getElementById('statAmiciTotali').textContent = stats.amiciTotali || 0;
    document.getElementById('statOnline').textContent = stats.online || 0;
    document.getElementById('statRichieste').textContent = stats.richieste || 0;
  } catch (err) {
    console.error('Errore statistiche:', err);
  }
}

// 🔔 BADGE NOTIFICHE
async function caricaBadgeRichieste() {
  try {
    const res = await fetch(`${API_URL}/amici/richieste/ricevute`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    
    const richieste = await res.json();
    const badge = document.getElementById('badgeRichieste');
    if (badge) {
      if (richieste.length > 0) {
        badge.textContent = richieste.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Errore badge:', err);
  }
}

// 🔍 MODAL RICERCA
async function cercaUtenti() {
  const input = document.getElementById('ricercaUsername').value.trim();
  const container = document.getElementById('risultatiRicerca');
  
  if (input.length < 2) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Inizia a digitare per cercare...</p>';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/amici/ricerca/${encodeURIComponent(input)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Errore ricerca');
    
    const utenti = await res.json();
    
    if (utenti.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessun utente trovato</p>';
      return;
    }
    
    container.innerHTML = utenti.map(utente => `
      <div class="amico-card">
        <div style="display: flex; align-items: center; gap: 15px;">
          <img src="${utente.avatar || 'https://via.placeholder.com/50'}" 
               alt="${utente.username}" 
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"
               onerror="this.src='https://via.placeholder.com/50'">
          <div>
            <h4>${utente.username}</h4>
            <small>${utente.ruolo === 'admin' ? 'Admin' : 'Utente'}</small>
          </div>
        </div>
        <button class="btn-add-friend" onclick="inviarichiesta('${utente._id}')">
          ➕ Aggiungi Amico
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Errore ricerca:', err);
    container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore nella ricerca</p>';
  }
}

async function inviarichiesta(destinatario_id) {
  try {
    const res = await fetch(`${API_URL}/amici/richiesta`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ destinatario_id })
    });
    
    if (res.ok) {
      alert('✓ Richiesta inviata con successo!');
      document.getElementById('ricercaUsername').value = '';
      cercaUtenti();
      await Promise.all([
        caricaStatisticheSociali(),
        caricaBadgeRichieste()
      ]);
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore invio richiesta');
    }
  } catch (err) {
    alert('Errore di rete');
  }
}

// 📬 MODAL RICHIESTE
async function caricaRichiesteModal() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json())
    ]);

    let html = '<div style="margin-bottom: 30px;"><h3>📥 Ricevute</h3></div>';
    
    if (ricevute.length === 0) {
      html += '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta ricevuta</p>';
    } else {
      html += ricevute.map(richiesta => `
        <div class="amico-card" style="margin-bottom: 15px;">
          <div>
            <h4>${richiesta.mittente_id.username}</h4>
            <small>Ti ha inviato una richiesta</small>
          </div>
          <div class="btn-group">
            <button class="btn-mini btn-accept" onclick="accettarichiesta('${richiesta._id}')">✓ Accetta</button>
            <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${richiesta._id}')">✕ Rifiuta</button>
          </div>
        </div>
      `).join('');
    }

    html += '<div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid var(--border-color);"><h3>📤 Inviate</h3></div>';
    
    if (inviate.length === 0) {
      html += '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta in sospeso</p>';
    } else {
      html += inviate.map(richiesta => `
        <div class="amico-card" style="margin-bottom: 15px;">
          <div>
            <h4>${richiesta.destinatario_id.username}</h4>
            <small>In attesa di risposta</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${richiesta._id}')">✕ Annulla</button>
        </div>
      `).join('');
    }

    document.getElementById('contenutoRichieste').innerHTML = html;
  } catch (err) {
    document.getElementById('contenutoRichieste').innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore caricamento richieste</p>';
  }
}

// NAVIGAZIONE MODALI
function mostraTab(action) {
  if (action === 'ricerca') {
    document.getElementById('modalRicerca').style.display = 'block';
    document.getElementById('ricercaUsername').focus();
    cercaUtenti();
  } else if (action === 'richieste') {
    document.getElementById('modalRichieste').style.display = 'block';
    caricaRichiesteModal();
  }
}

function chiudiRicerca() { 
  document.getElementById('modalRicerca').style.display = 'none';
  document.getElementById('ricercaUsername').value = '';
}

function chiudiRichieste() { 
  document.getElementById('modalRichieste').style.display = 'none'; 
}

// RICHIESTE
async function accettarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/accetta/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      alert('✓ Amico aggiunto!');
      chiudiRichieste();
      await Promise.all([
        initAmici(),
        caricaStatisticheSociali(),
        caricaBadgeRichieste()
      ]);
    }
  } catch (err) {
    alert('Errore accettazione');
  }
}

async function rifiutarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/rifiuta/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      chiudiRichieste();
      caricaBadgeRichieste();
    }
  } catch (err) {
    alert('Errore rifiuto');
  }
}

async function annullarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      chiudiRichieste();
    }
  } catch (err) {
    alert('Errore annullamento');
  }
}

// AZIONI AMICI
function visualizzaCollezione(amicoId, amicoUsername) {
  window.location.href = `collezione-amico.html?amico=${amicoId}&username=${encodeURIComponent(amicoUsername)}`;
}

async function rimuoviAmico(amicoId, username) {
  if (!confirm(`Vuoi davvero rimuovere ${username} dagli amici?`)) return;
  
  try {
    const res = await fetch(`${API_URL}/amici/rimuovi/${amicoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      alert('✓ Amico rimosso');
      await initAmici();
      await caricaStatisticheSociali();
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore rimozione');
    }
  } catch (err) {
    alert('Errore di rete');
  }
}

// ESC per chiudere modali
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }
});
