let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) nomeElement.textContent = `Ciao, ${username}!`;

  if (ruolo === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  caricaRichieste();
  caricaAmici();
});

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// MOSTRA TAB
function mostraTab(tab) {
  document.querySelectorAll('.amici-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.amici-tab').forEach(t => t.classList.remove('active'));

  if (tab === 'ricerca') {
    document.getElementById('tabRicerca').style.display = 'block';
    document.querySelectorAll('.amici-tab')[0].classList.add('active');
  } else if (tab === 'richieste') {
    document.getElementById('tabRichieste').style.display = 'block';
    document.querySelectorAll('.amici-tab')[1].classList.add('active');
    caricaRichieste();
  } else if (tab === 'amici') {
    document.getElementById('tabAmici').style.display = 'block';
    document.querySelectorAll('.amici-tab')[2].classList.add('active');
    caricaAmici();
  }
}

// RICERCA UTENTI
async function cercaUtenti() {
  const input = document.getElementById('ricercaUsername').value.trim();
  const container = document.getElementById('risultatiRicerca');

  if (input.length < 2) {
    container.innerHTML = '<p>Inizia a digitare per cercare...</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/amici/ricerca/${input}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Errore ricerca');

    const utenti = await response.json();

    if (utenti.length === 0) {
      container.innerHTML = '<p>Nessun utente trovato</p>';
      return;
    }

    container.innerHTML = utenti.map(u => `
      <div class="amico-card">
        <div>
          <h4>${u.username}</h4>
        </div>
        <button class="btn-add-friend" onclick="inviarichiesta('${u._id}')">➕ Aggiungi</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p>Errore nella ricerca</p>';
  }
}

// INVIA RICHIESTA
async function inviarichiesta(destinatario_id) {
  try {
    const response = await fetch(`${API_URL}/amici/richiesta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ destinatario_id })
    });

    if (response.ok) {
      alert('Richiesta inviata!');
      caricaRichieste();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore invio richiesta');
    }
  } catch {
    alert('Errore invio richiesta');
  }
}

// CARICA RICHIESTE
async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
    ]);

    const containerRicevute = document.getElementById('richiesteRicevute');
    containerRicevute.innerHTML = ricevute.length === 0 
      ? '<p>Nessuna richiesta in sospeso</p>' 
      : ricevute.map(richiesta => `
        <div class="amico-card">
          <div>
            <h4>${richiesta.mittente_id.username}</h4>
            <small>Richiesta ricevuta</small>
          </div>
          <div class="btn-group">
            <button class="btn-mini btn-accept" onclick="accettarichiesta('${richiesta._id}')">✓ Accetta</button>
            <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${richiesta._id}')">✕ Rifiuta</button>
          </div>
        </div>
      `).join('');

    const containerInviate = document.getElementById('richiesteInviate');
    containerInviate.innerHTML = inviate.length === 0 
      ? '<p>Nessuna richiesta inviata</p>' 
      : inviate.map(richiesta => `
        <div class="amico-card">
          <div>
            <h4>${richiesta.destinatario_id.username}</h4>
            <small>In sospeso</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${richiesta._id}')">✕ Annulla</button>
        </div>
      `).join('');
  } catch (err) {
    console.error('Errore caricamento richieste:', err);
  }
}

// ACCETTA RICHIESTA
async function accettarichiesta(id) {
  try {
    const response = await fetch(`${API_URL}/amici/accetta/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('Amico aggiunto!');
      caricaRichieste();
      caricaAmici();
    }
  } catch {
    alert('Errore accettazione richiesta');
  }
}

// RIFIUTA RICHIESTA
async function rifiutarichiesta(id) {
  try {
    const response = await fetch(`${API_URL}/amici/rifiuta/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      caricaRichieste();
    }
  } catch {
    alert('Errore rifiuto richiesta');
  }
}

// ANNULLA RICHIESTA
async function annullarichiesta(id) {
  try {
    const response = await fetch(`${API_URL}/amici/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      caricaRichieste();
    }
  } catch {
    alert('Errore annullamento richiesta');
  }
}

// CARICA AMICI
async function caricaAmici() {
  try {
    const response = await fetch(`${API_URL}/amici`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;
    const amici = await response.json();
    const container = document.getElementById('amiciList');

    if (amici.length === 0) {
      container.innerHTML = '<p>Nessun amico ancora</p>';
      return;
    }

    container.innerHTML = amici.map(amico => `
      <div class="amico-card">
        <div>
          <h4>${amico.username}</h4>
        </div>
        <div class="btn-group">
          <button class="btn-view" onclick="visualizzaCollezione('${amico._id}', '${amico.username}')">👁️ Visualizza</button>
          <button class="btn-delete btn-mini" onclick="rimuoviAmico('${amico._id}', '${amico.username}')">🗑️ Rimuovi</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Errore caricamento amici:', err);
  }
}

// VISUALIZZA COLLEZIONE AMICO
function visualizzaCollezione(amicoId, amicoUsername) {
  window.location.href = `collezione-amico.html?amico=${amicoId}&username=${encodeURIComponent(amicoUsername)}`;
}

// RIMUOVI AMICO
async function rimuoviAmico(amicoId, username) {
  if (!confirm(`Vuoi davvero rimuovere ${username} dagli amici?`)) return;

  try {
    const response = await fetch(`${API_URL}/amici/rimuovi/${amicoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('Amico rimosso');
      caricaAmici();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nella rimozione');
    }
  } catch {
    alert('Errore nella rimozione');
  }
}
