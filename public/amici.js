let token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('ruolo') === 'admin') {
    ['linkAdmin','linkUsers','linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }
  await caricaAmici();
});

function mostraTab(tab) {
  document.querySelectorAll('.amici-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.amici-tab').forEach(t => t.classList.remove('active'));
  
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
  document.querySelector(`.amici-tab[data-tab="${tab}"]`).classList.add('active');
  
  if (tab === 'amici') caricaAmici();
  if (tab === 'richieste') caricaRichieste();
}

async function caricaAmici() {
  try {
    const res = await fetch(`${API_URL}/amici`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    
    const amici = await res.json();
    const container = document.getElementById('amiciList');
    
    if (amici.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
          <div style="font-size:48px;margin-bottom:20px;">👥</div>
          <h3>Nessun amico ancora</h3>
          <p>Cerca collezionisti per condividere progressi!</p>
          <button class="btn-primary" onclick="mostraTab('ricerca')" style="margin-top:20px;padding:12px 24px;">🔍 Trova amici</button>
        </div>`;
      return;
    }
    
    container.innerHTML = amici.map(amico => `
      <div class="amico-card">
        <div style="display:flex;align-items:center;gap:15px;">
          <img src="${amico.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(amico.username)}&size=50&background=2c3e50&color=fff`}" 
               alt="${amico.username}" 
               style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:3px solid var(--border-color);"
               onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent('${amico.username}')}&size=50&background=2c3e50&color=fff'">
          <div>
            <h4 style="margin:0;font-size:18px;">${amico.username}</h4>
            <small style="color:var(--text-secondary);">Collezionista</small>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn-view" onclick="visualizzaCollezione('${amico._id}','${amico.username}')">👁️ Visualizza</button>
          <button class="btn-delete btn-mini" onclick="rimuoviAmico('${amico._id}','${amico.username}')">🗑️ Rimuovi</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    document.getElementById('amiciList').innerHTML = '<p style="text-align:center;color:#e74c3c;">Errore caricamento</p>';
  }
}

async function cercaUtenti() {
  const input = document.getElementById('ricercaUsername').value;
  if (input.length < 2) return;
  
  try {
    const res = await fetch(`${API_URL}/amici/ricerca/${encodeURIComponent(input)}`, { headers: { Authorization: `Bearer ${token}` } });
    const utenti = await res.json();
    const container = document.getElementById('risultatiRicerca');
    
    container.innerHTML = utenti.map(u => `
      <div class="amico-card">
        <div style="display:flex;align-items:center;gap:15px;">
          <img src="${u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=50&background=2c3e50&color=fff`}" 
               style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:3px solid var(--border-color);">
          <div><h4 style="margin:0;">${u.username}</h4></div>
        </div>
        <button class="btn-add-friend" onclick="inviarichiesta('${u._id}')">➕ Aggiungi</button>
      </div>
    `).join('') || '<p style="text-align:center;color:var(--text-secondary);">Nessun utente trovato</p>';
  } catch(e) {}
}

async function caricaRichieste() {
  try {
    const [ricevute, inviate] = await Promise.all([
      fetch(`${API_URL}/amici/richieste/ricevute`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API_URL}/amici/richieste/inviate`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json())
    ]);
    
    document.getElementById('richiesteRicevute').innerHTML = ricevute.map(r=>`
      <div class="amico-card">
        <div>${r.mittente_id.username}</div>
        <div class="btn-group">
          <button class="btn-mini btn-accept" onclick="accettarichiesta('${r._id}')">✓</button>
          <button class="btn-mini btn-reject" onclick="rifiutarichiesta('${r._id}')">✕</button>
        </div>
      </div>
    `).join('') || '<p style="text-align:center;color:var(--text-secondary);">Nessuna</p>';
    
    document.getElementById('richiesteInviate').innerHTML = inviate.map(r=>`
      <div class="amico-card">
        <div>${r.destinatario_id.username}</div>
        <button class="btn-mini btn-cancel" onclick="annullarichiesta('${r._id}')">✕</button>
      </div>
    `).join('') || '<p style="text-align:center;color:var(--text-secondary);">Nessuna</p>';
  } catch(e) {}
}

async function inviarichiesta(id) { 
  try {
    await fetch(`${API_URL}/amici/richiesta`, {
      method: 'POST', headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({destinatario_id: id})
    });
    alert('Richiesta inviata!'); mostraTab('richieste');
  } catch(e) { alert('Errore'); }
}

async function accettarichiesta(id) { 
  await fetch(`${API_URL}/amici/accetta/${id}`, {method:'PUT', headers:{Authorization:`Bearer ${token}`}});
  alert('Amico aggiunto!'); mostraTab('amici'); 
}

async function rifiutarichiesta(id) { 
  await fetch(`${API_URL}/amici/rifiuta/${id}`, {method:'PUT', headers:{Authorization:`Bearer ${token}`}}); 
  caricaRichieste(); 
}

async function annullarichiesta(id) { 
  await fetch(`${API_URL}/amici/${id}`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}}); 
  caricaRichieste(); 
}

async function rimuoviAmico(id, nome) {
  if(confirm(`Rimuovere ${nome}?`)) {
    await fetch(`${API_URL}/amici/rimuovi/${id}`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}});
    alert('Rimosso'); caricaAmici();
  }
}

function visualizzaCollezione(id, nome) {
  window.location.href = `collezione-amico?amico=${id}&username=${encodeURIComponent(nome)}`;
}

if (['admin', 'beta'].includes(utente?.ruolo)) {
  document.getElementById('linkBevute').style.display = 'block';
  document.getElementById('linkAdmin').style.display = 'block';
}

