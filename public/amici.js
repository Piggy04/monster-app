let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const usernameLS = localStorage.getItem('username');
const ruoloLS = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', async () => {
  // Admin links
  if (ruoloLS === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // CARICA AMICI SUBITO (PRIMA TAB)
  await caricaAmici();
});

// === NAVIGAZIONE TAB ===
function mostraTab(tab) {
  // Nascondi tutti
  document.querySelectorAll('.amici-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.amici-tab').forEach(t => t.classList.remove('active'));
  
  // Mostra tab selezionato
  if (tab === 'amici') {
    document.getElementById('tabAmici').style.display = 'block';
    document.querySelector('.amici-tab:nth-child(1)').classList.add('active');
    caricaAmici();
  } else if (tab === 'ricerca') {
    document.getElementById('tabRicerca').style.display = 'block';
    document.querySelector('.amici-tab:nth-child(2)').classList.add('active');
  } else if (tab === 'richieste') {
    document.getElementById('tabRichieste').style.display = 'block';
    document.querySelector('.amici-tab:nth-child(3)').classList.add('active');
    caricaRichieste();
  }
}

// === CARICA I TUOI AMICI (PRIMO LOAD) ===
async function caricaAmici() {
  try {
    const res = await fetch(`${API_URL}/amici`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) return;
    
    const amici = await res.json();
    const container = document.getElementById('amiciList');
    
    if (amici.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
          <h3>Nessun amico ancora</h3>
          <p>Cerca e aggiungi collezionisti per condividere i progressi!</p>
          <button class="btn-primary" onclick="mostraTab('ricerca')" style="margin-top: 20px;">
            🔍 Trova amici
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = amici.map(amico => `
      <div class="amico-card">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${amico.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4>${amico.username}</h4>
            <small>Collezionista SW</small>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn-view" onclick="visualizzaCollezione('${amico._id}', '${amico.username}')">
            👁️ Collezione
          </button>
          <button class="btn-delete btn-mini" onclick="rimuoviAmico('${amico._id}', '${amico.username}')">
            🗑️ Rimuovi
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Errore amici:', err);
    document.getElementById('amiciList').innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore caricamento amici</p>';
  }
}

// === RICERCA UTENTI ===
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
    
    if (!res.ok) throw new Error();
    
    const utenti = await res.json();
    
    if (utenti.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessun utente trovato</p>';
    } else {
      container.innerHTML = utenti.map(utente => `
        <div class="amico-card">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              ${utente.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4>${utente.username}</h4>
              <small>${utente.email || 'Utente'}</small>
            </div>
          </div>
          <button class="btn-add-friend" onclick="inviarichiesta('${utente._id}')">
            ➕ Aggiungi
          </button>
        </div>
      `).join('');
    }
  } catch {
    container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore nella ricerca</p>';
  }
}

// === RICHIESTE ===
async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]);

    // Ricevute
    document.getElementById('richiesteRicevute').innerHTML = ricevute.length === 0 
      ? '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta ricevuta</p>'
      : ricevute.map(r => `
        <div class="amico-card">
          <div>
            <h4>${r.mittente_id.username}</h4>
            <small>Ti ha inviato una richiesta</small>
          </div>
          <div class="btn-group">
            <button class="btn-mini btn-accept" onclick="accettarichiesta('${r._id}')">✓ Accetta</button>
            <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${r._id}')">✕ Rifiuta</button>
          </div>
        </div>
      `).join('');

    // Inviate
    document.getElementById('richiesteInviate').innerHTML = inviate.length === 0 
      ? '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta inviata</p>'
      : inviate.map(r => `
        <div class="amico-card">
          <div>
            <h4>${r.destinatario_id.username}</h4>
            <small>In attesa di risposta</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${r._id}')">✕ Annulla</button>
        </div>
      `).join('');
  } catch (err) {
    console.error('Errore richieste:', err);
  }
}

// === AZIONI ===
async function inviarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/richiesta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ destinatario_id: id })
    });
    if (res.ok) {
      alert('✓ Richiesta inviata!');
      document.getElementById('ricercaUsername').value = '';
      cercaUtenti();
    } else {
      const err = await res.json();
      alert(err.errore || 'Errore');
    }
  } catch {
    alert('Errore di rete');
  }
}

async function accettarichiesta(id) {
  try {
    const res = await fetch(`${API_URL}/amici/accetta/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      alert('✓ Amico aggiunto!');
      mostraTab('amici');
    }
  } catch {
    alert('Errore');
  }
}

async function rifiutarichiesta(id) {
  try {
    await fetch(`${API_URL}/amici/rifiuta/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    caricaRichieste();
  } catch {
    alert('Errore');
  }
}

async function annullarichiesta(id) {
  try {
    await fetch(`${API_URL}/amici/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    caricaRichieste();
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
  window.location.href = `collezione-amico.html?amico=${id}&username=${encodeURIComponent(nome)}`;
}
