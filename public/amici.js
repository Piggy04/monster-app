let token = localStorage.getItem('token');
let timeout;

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }

  caricaTema();
  caricaRichieste();
  caricaAmici();
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
    
    // Chiudi theme drawer
    const drawer = document.getElementById('themeDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
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
    
    container.innerHTML = utenti.map(utente => `
      <div class="amico-card">
        <div>
          <h4>${utente.username}</h4>
        </div>
        <button class="btn-add-friend" onclick="inviarichiesta('${utente._id}')">
          ➕ Aggiungi
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Errore ricerca:', err);
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
      alert('✓ Richiesta inviata!');
      document.getElementById('ricercaUsername').value = '';
      document.getElementById('risultatiRicerca').innerHTML = '<p>Inizia a digitare per cercare...</p>';
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore invio richiesta');
    }
  } catch (err) {
    alert('Errore invio richiesta');
  }
}

// CARICA RICHIESTE
async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]);
    
    // Richieste ricevute
    const containerRicevute = document.getElementById('richiesteRicevute');
    if (ricevute.length === 0) {
      containerRicevute.innerHTML = '<p>Nessuna richiesta in sospeso</p>';
    } else {
      containerRicevute.innerHTML = ricevute.map(richiesta => `
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
    }
    
    // Richieste inviate
    const containerInviate = document.getElementById('richiesteInviate');
    if (inviate.length === 0) {
      containerInviate.innerHTML = '<p>Nessuna richiesta inviata</p>';
    } else {
      containerInviate.innerHTML = inviate.map(richiesta => `
        <div class="amico-card">
          <div>
            <h4>${richiesta.destinatario_id.username}</h4>
            <small>In sospeso</small>
          </div>
          <button class="btn-mini btn-cancel" onclick="annullarichiesta('${richiesta._id}')">✕ Annulla</button>
        </div>
      `).join('');
    }
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
      alert('✓ Amico aggiunto!');
      caricaRichieste();
      caricaAmici();
      caricaBadgeRichieste();
    }
  } catch (err) {
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
      caricaBadgeRichieste();
    }
  } catch (err) {
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
  } catch (err) {
    alert('Errore annullamento richiesta');
  }
}

// CARICA AMICI
async function caricaAmici() {
  try {
    const response = await fetch(`${API_URL}/amici`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Errore caricamento');
    
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
          <button class="btn-mini btn-view" onclick="visualizzaCollezione('${amico._id}', '${amico.username}')">👁️ Visualizza</button>
          <button class="btn-mini btn-delete" onclick="rimuoviAmico('${amico._id}')">🗑️ Rimuovi</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Errore caricamento amici:', err);
  }
}

// CARICA BADGE RICHIESTE
async function caricaBadgeRichieste() {
  try {
    const response = await fetch(`${API_URL}/amici/richieste/ricevute`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const richieste = await response.json();
      const badge = document.getElementById('badge-richieste');
      
      if (richieste.length > 0) {
        if (!badge) {
          const tabRichieste = document.querySelector('.amici-tabs .amici-tab:nth-child(2)');
          if (tabRichieste) {
            const badgeEl = document.createElement('span');
            badgeEl.id = 'badge-richieste';
            badgeEl.className = 'badge-notifica';
            badgeEl.textContent = richieste.length;
            tabRichieste.appendChild(badgeEl);
          }
        } else {
          badge.textContent = richieste.length;
        }
      } else if (badge) {
        badge.remove();
      }
    }
  } catch (err) {
    console.error('Errore badge:', err);
  }
}

// Chiama questa funzione quando carichi la pagina:
document.addEventListener('DOMContentLoaded', () => {
  // ... codice esistente ...
  caricaBadgeRichieste();
  
  // Aggiorna badge ogni 5 secondi
  setInterval(caricaBadgeRichieste, 5000);
});


// VISUALIZZA COLLEZIONE AMICO
function visualizzaCollezione(amicoId, amicoUsername) {
  // Passa l'ID via URL
  window.location.href = `collezione-amico.html?amico=${amicoId}&username=${encodeURIComponent(amicoUsername)}`;
}

// RIMUOVI AMICO
async function rimuoviAmico(amicoId) {
  if (!confirm('Sei sicuro di voler rimuovere questo amico?')) return;
  
  try {
    // Trovare l'ID della relazione amicizia
    const response = await fetch(`${API_URL}/amici`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const amici = await response.json();
    const amicizia = amici.find(a => a._id === amicoId);
    
    if (amicizia) {
      const deleteResponse = await fetch(`${API_URL}/amici/${amicizia._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        alert('Amico rimosso');
        caricaAmici();
      }
    }
  } catch (err) {
    console.error('Errore rimozione:', err);
    alert('Errore rimozione amico');
  }
}
