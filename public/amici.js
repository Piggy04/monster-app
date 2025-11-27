let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const usernameLS = localStorage.getItem('username');
const ruoloLS = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', async () => {
  // Mostra link admin se admin
  if (ruoloLS === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // Carica amici subito (tab “amici”)
  await caricaAmici();
});

// ---------- NAVIGAZIONE TAB ----------
function mostraTab(tab) {
  document.querySelectorAll('.amici-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.amici-tab').forEach(t => t.classList.remove('active'));

  document.getElementById(`tab${capitalizeFirstLetter(tab)}`).style.display = 'block';
  document.querySelector(`.amici-tab[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'amici') caricaAmici();
  if (tab === 'richieste') caricaRichieste();
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// ---------- CARICA AMICI ----------
async function caricaAmici() {
  try {
    const res = await fetch(`${API_URL}/amici`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Errore caricamento amici');

    const amici = await res.json();
    const container = document.getElementById('amiciList');

    if (amici.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: var(--text-secondary);">
        Nessun amico ancora. Usa la ricerca per aggiungere amici.
      </p>`;
      return;
    }

    container.innerHTML = amici.map(amico => {
      const avatarUrl = amico.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(amico.username)}&size=50&background=2c3e50&color=fff`;
      return `
        <div class="amico-card">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${avatarUrl}" alt="${amico.username}" 
                 style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border-color);" 
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(amico.username)}&size=50&background=2c3e50&color=fff'">
            <div>
              <h4 style="margin:0;">${amico.username}</h4>
              <small style="color: var(--text-secondary);">Collezionista SW</small>
            </div>
          </div>
          <div class="btn-group">
            <button class="btn-view" onclick="visualizzaCollezione('${amico._id}', '${amico.username}')">👁️ Visualizza</button>
            <button class="btn-delete btn-mini" onclick="rimuoviAmico('${amico._id}', '${amico.username}')">🗑️ Rimuovi</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    document.getElementById('amiciList').innerHTML = '<p style="color: #e74c3c; text-align:center;">Errore nel caricamento amici</p>';
  }
}

// ---------- CARICA RICHIESTE ----------
async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ]);
    const ricevuteHTML = ricevute.length === 0 
      ? '<p style="text-align:center; color: var(--text-secondary);">Nessuna richiesta ricevuta</p>' 
      : ricevute.map(r => `
        <div class="amico-card">
          <div style="flex:1;">
            <h4>${r.mittente_id.username}</h4>
            <small>Ti ha inviato una richiesta</small>
          </div>
          <div class="btn-group">
            <button class="btn-mini btn-accept" onclick="accettarichiesta('${r._id}')">✓ Accetta</button>
            <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${r._id}')">✕ Rifiuta</button>
          </div>
        </div>
      `).join('');

    const inviateHTML = inviate.length === 0 
      ? '<p style="text-align:center; color: var(--text-secondary);">Nessuna richiesta inviata</p>' 
      : inviate.map(r => `
        <div class="amico-card">
          <div style="flex:1;">
            <h4>${r.destinatario_id.username}</h4>
            <small>In attesa di risposta</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${r._id}')">✕ Annulla</button>
        </div>
      `).join('');

    document.getElementById('richiesteRicevute').innerHTML = ricevuteHTML;
    document.getElementById('richiesteInviate').innerHTML = inviateHTML;
  } catch (err) {
    console.error(err);
  }
}

// ---------- FUNZIONI AZIONI ----------
async function inviarichiesta(destinatario_id) {
  try {
    const res = await fetch(`${API_URL}/amici/richiesta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ destinatario_id })
    });
    if (res.ok) {
      alert('Richiesta inviata!');
      document.getElementById('ricercaUsername').value = '';
      mostraTab('richieste');
      caricaRichieste();
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore invio richiesta');
    }
  } catch {
    alert('Errore di rete');
  }
}

async function accettarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/accetta/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      alert('Amico aggiunto!');
      mostraTab('amici');
      caricaAmici();
      caricaRichieste();
    }
  } catch {
    alert('Errore');
  }
}

async function rifiutarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/rifiuta/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      caricaRichieste();
    }
  } catch {
    alert('Errore');
  }
}

async function annullarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      caricaRichieste();
    }
  } catch {
    alert('Errore');
  }
}

async function rimuoviAmico(id, nome) {
  if (confirm(`Rimuovere ${nome}?`)) {
    try {
      const res = await fetch(`${API_URL}/amici/rimuovi/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert('Amico rimosso');
        caricaAmici();
      }
    } catch {
      alert('Errore');
    }
  }
}

function visualizzaCollezione(id, nome) {
  window.location.href = `collezione-amico?amico=${id}&username=${encodeURIComponent(nome)}`;
}
