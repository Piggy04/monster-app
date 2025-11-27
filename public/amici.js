let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const usernameLS = localStorage.getItem('username');
const ruoloLS = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', async () => {
  if (ruoloLS === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // CARICA TUTTO SUBITO
  await Promise.all([
    caricaAmici(),
    aggiornaContatori()
  ]);

  // Aggiorna contatori ogni 30s
  setInterval(aggiornaContatori, 30000);
});

// === CONTATORI LIVE ===
async function aggiornaContatori() {
  try {
    const richiesteRes = await fetch(`${API_URL}/amici/richieste/ricevute`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const richieste = await richiesteRes.json();
    
    // Badge sul tab Richieste
    const tabRichieste = document.querySelector('.amici-tab:nth-child(3)');
    let badge = tabRichieste.querySelector('.badge-notifica');
    if (richieste.length > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge-notifica';
        badge.style.cssText = 'position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;';
        tabRichieste.style.position = 'relative';
        tabRichieste.appendChild(badge);
      }
      badge.textContent = richieste.length;
    } else if (badge) {
      badge.remove();
    }
  } catch {}
}

// === NAVIGAZIONE TAB ===
function mostraTab(tab) {
  document.querySelectorAll('.amici-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.amici-tab').forEach(t => t.classList.remove('active'));
  
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

// === CARICA AMICI CON AVATAR ===
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
          <p>Cerca e aggiungi collezionisti!</p>
          <button class="btn-primary" onclick="mostraTab('ricerca')" style="margin-top: 20px; padding: 12px 24px;">
            🔍 Trova amici
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = amici.map(amico => `
      <div class="amico-card">
        <div style="display: flex; align-items: center; gap: 15px;">
          <img src="${amico.avatar || `https://ui-avatars.com/api/?name=${amico.username}&size=50&background=2c3e50&color=fff`}" 
               alt="${amico.username}" 
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border-color);"
               onerror="this.src='https://ui-avatars.com/api/?name=${amico.username}&size=50&background=2c3e50&color=fff'">
          <div>
            <h4 style="margin: 0;">${amico.username}</h4>
            <small style="color: var(--text-secondary);">Collezionista SW</small>
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
    document.getElementById('amiciList').innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore caricamento</p>';
  }
}

// === RICERCA CON AVATAR ===
async function cercaUtenti() {
  const input = document.getElementById('ricercaUsername').value.trim();
  const container = document.getElementById('risultatiRicerca');
  
  if (input.length < 2) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Inizia a digitare...</p>';
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
            <img src="${utente.avatar || `https://ui-avatars.com/api/?name=${utente.username}&size=50&background=2c3e50&color=fff`}" 
                 alt="${utente.username}" 
                 style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border-color);"
                 onerror="this.src='https://ui-avatars.com/api/?name=${utente.username}&size=50&background=2c3e50&color=fff'">
            <div>
              <h4 style="margin: 0;">${utente.username}</h4>
              <small style="color: var(--text-secondary);">${utente.email?.substring(0,20) || 'Utente'}</small>
            </div>
          </div>
          <button class="btn-add-friend" onclick="inviarichiesta('${utente._id}')">
            ➕ Aggiungi
          </button>
        </div>
      `).join('');
    }
  } catch {
    container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Errore ricerca</p>';
  }
}

// === ALTRE FUNZIONI (invariate ma migliorate) ===
async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]);

    document.getElementById('richiesteRicevute').innerHTML = ricevute.length === 0 
      ? '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta ricevuta</p>'
      : ricevute.map(r => `
        <div class="amico-card">
          <div style="flex: 1;">
            <h4 style="margin: 0;">${r.mittente_id.username}</h4>
            <small style="color: var(--text-secondary);">Ti ha inviato una richiesta</small>
          </div>
          <div class="btn-group">
            <button class="btn-mini btn-accept" onclick="accettarichiesta('${r._id}')">✓ Accetta</button>
            <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${r._id}')">✕ Rifiuta</button>
          </div>
        </div>
      `).join('');

    document.getElementById('richiesteInviate').innerHTML = inviate.length === 0 
      ? '<p style="text-align: center; color: var(--text-secondary);">Nessuna richiesta inviata</p>'
      : inviate.map(r => `
        <div class="amico-card">
          <div style="flex: 1;">
            <h4 style="margin: 0;">${r.destinatario_id.username}</h4>
            <small style="color: var(--text-secondary);">In attesa di risposta</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${r._id}')">✕ Annulla</button>
        </div>
      `).join('');
  } catch (err) {
    console.error('Errore richieste:', err);
  }
}

// [Tutte le altre funzioni rimangono identiche a prima...]
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
      aggiornaContatori();
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
    const res = await fetch(`${API_URL}/amici/accetta/${id}`, { 
      method: 'PUT', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    if (res.ok) {
      alert('✓ Amico aggiunto!');
      mostraTab('amici');
      aggiornaContatori();
    }
  } catch {
    alert('Errore');
  }
}

async function rifiutarichiesta(id) {
  try {
    await fetch(`${API_URL}/amici/rifiuta/${id}`, { 
      method: 'PUT', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    caricaRichieste();
    aggiornaContatori();
  } catch {
    alert('Errore');
  }
}

async function annullarichiesta(id) {
  try {
    await fetch(`${API_URL}/amici/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    caricaRichieste();
    aggiornaContatori();
  } catch {
    alert('Errore');
  }
}

async function rimuoviAmico(id, nome) {
  if (confirm(`Rimuovere ${nome}?`)) {
    try {
      const res = await fetch(`${API_URL}/amici/rimuovi/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        alert('Amico rimosso');
        caricaAmici();
        aggiornaContatori();
      }
    } catch {
      alert('Errore');
    }
  }
}

function visualizzaCollezione(id, nome) {
  window.location.href = `collezione-amico?amico=${id}&username=${encodeURIComponent(nome)}`;
}
