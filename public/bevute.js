let tutteVarianti = [];
let bevuteOriginali = [];
let periodoAttivo = 'tutto';

const RENDER_API = 'https://monster-app-ocdj.onrender.com/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

if (ruolo === 'admin') {
  ['linkAdmin', 'linkUsers', 'linkLogAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

// ===== CARICA STATISTICHE =====
async function caricaStatistiche() {
  try {
    const res = await fetch(`${RENDER_API}/bevute/statistiche`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Errore statistiche');
    
    const stats = await res.json();
    
    document.getElementById('statTotali').textContent = stats.totali || 0;
    document.getElementById('statCaffeina').textContent = Math.round(stats.caffeinaTotale || 0);
    document.getElementById('statCalorie').textContent = Math.round(stats.calorieTotali || 0);
    document.getElementById('statZuccheri').textContent = Math.round(stats.zuccheriTotali || 0);
    
  } catch(e) {
    console.error('❌ Errore statistiche:', e);
  }
}

// ===== CARICA BEVUTE =====
async function caricaBevute() {
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    
    bevuteOriginali = await res.json();
    
    console.log('📊 Bevute caricate:', bevuteOriginali.length);
    
    caricaStatistiche();
    applicaFiltri();
    
  } catch (e) {
    console.error('❌ Errore caricamento bevute:', e);
    document.getElementById('bevuteContainer').innerHTML = 
      `<p class="no-results">❌ Errore: ${e.message}</p>`;
  }
}

// ===== FILTRI TEMPORALI =====
function filtraPeriodo(periodo) {
  periodoAttivo = periodo;
  
  document.querySelectorAll('.filtri-box button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = `btn${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`;
  const btnElement = document.getElementById(btnId);
  if (btnElement) btnElement.classList.add('active');
  
  applicaFiltri();
}

function filtraPerData(bevute) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  
  return bevute.filter(b => {
    const dataBevuta = new Date(b.data);
    dataBevuta.setHours(0, 0, 0, 0);
    
    if (periodoAttivo === 'tutto') return true;
    
    if (periodoAttivo === 'oggi') {
      return dataBevuta.getTime() === oggi.getTime();
    }
    
    if (periodoAttivo === 'settimana') {
      const setteGiorniFa = new Date(oggi);
      setteGiorniFa.setDate(oggi.getDate() - 7);
      return dataBevuta >= setteGiorniFa;
    }
    
    if (periodoAttivo === 'mese') {
      const treintaGiorniFa = new Date(oggi);
      treintaGiorniFa.setDate(oggi.getDate() - 30);
      return dataBevuta >= treintaGiorniFa;
    }
    
    return true;
  });
}

// ===== APPLICA FILTRI + ORDINAMENTO + RICERCA =====
function applicaFiltri() {
  let risultato = [...bevuteOriginali];
  
  risultato = filtraPerData(risultato);
  
  const query = document.getElementById('ricercaBevuta')?.value.toLowerCase() || '';
  if (query) {
    risultato = risultato.filter(b => {
      const nomeVariante = b.varianteId?.nome?.toLowerCase() || '';
      const nomeLattina = b.varianteId?.lattina_id?.nome?.toLowerCase() || '';
      const note = b.note?.toLowerCase() || '';
      
      return nomeVariante.includes(query) || 
             nomeLattina.includes(query) || 
             note.includes(query);
    });
  }
  
  const ordine = document.getElementById('selectOrdinamento')?.value || 'data-desc';
  
  if (ordine === 'data-desc') {
    risultato.sort((a, b) => new Date(b.data) - new Date(a.data));
  } else if (ordine === 'data-asc') {
    risultato.sort((a, b) => new Date(a.data) - new Date(b.data));
  } else if (ordine === 'categoria') {
    risultato.sort((a, b) => {
      const catA = a.varianteId?.lattina_id?.nome || '';
      const catB = b.varianteId?.lattina_id?.nome || '';
      return catA.localeCompare(catB);
    });
  }
  
  mostraBevute(risultato);
}

// ===== MOSTRA BEVUTE RAGGRUPPATE PER VARIANTE =====
function mostraBevute(bevute) {
  const container = document.getElementById('bevuteContainer');
  
  if (bevute.length === 0) {
    container.innerHTML = '<p class="no-results">🔍 Nessuna bevuta trovata</p>';
    return;
  }
  
  // Raggruppa per varianteId
  const raggruppate = {};
  
  bevute.forEach(b => {
    const varId = b.varianteId?._id || 'sconosciuta';
    
    if (!raggruppate[varId]) {
      raggruppate[varId] = {
        varianteId: varId,
        nome: b.varianteId?.nome || 'Monster',
        lattinaNome: b.varianteId?.lattina_id?.nome || '',
        immagine: b.varianteId?.immagine || '/placeholder-beer.jpg',
        caffeina: b.varianteId?.caffeina_mg || 0,
        calorie: b.varianteId?.calorie_kcal || 0,
        zuccheri: b.varianteId?.zuccheri_g || 0,
        conteggio: 0,
        bevuteIds: [],
        ultimaData: null,
        ultimaOra: null,
        note: b.note || ''
      };
    }
    
    raggruppate[varId].conteggio++;
    raggruppate[varId].bevuteIds.push(b._id);
    
    // Salva data/ora più recente
    if (!raggruppate[varId].ultimaData || new Date(b.data) > new Date(raggruppate[varId].ultimaData)) {
      raggruppate[varId].ultimaData = b.data;
      raggruppate[varId].ultimaOra = b.ora;
      if (b.note) raggruppate[varId].note = b.note;
    }
  });
  
  const lista = Object.values(raggruppate);
  
  // Ordina per data più recente
  lista.sort((a, b) => new Date(b.ultimaData) - new Date(a.ultimaData));
  
  let html = '';
  
  lista.forEach(item => {
    const nomeCompleto = item.lattinaNome ? `${item.lattinaNome} - ${item.nome}` : item.nome;
    
    const data = new Date(item.ultimaData);
    const dataStr = data.toLocaleDateString('it-IT');
    const oraStr = item.ultimaOra || data.toLocaleTimeString('it-IT');
    
    html += `
      <div class="bevuta-card">
        <div class="bevuta-nome">${nomeCompleto}</div>
        
        <div class="bevuta-immagine">
          <img src="${item.immagine}" class="bevuta-foto" alt="${nomeCompleto}" onclick="apriModalImmagine('${item.immagine}')">
        </div>
        
        <div class="conteggio-badge">🍺 x${item.conteggio}</div>
        
        <div class="bevuta-info">
          <div class="info-row">
            <span>📅 ${dataStr}</span>
            <span>🕐 ${oraStr}</span>
          </div>
          
          ${item.caffeina || item.calorie || item.zuccheri ? `
            <div class="info-nutrizionale">
              ${item.caffeina ? `<span>⚡ ${item.caffeina}mg</span>` : ''}
              ${item.calorie ? `<span>🔥 ${item.calorie}kcal</span>` : ''}
              ${item.zuccheri ? `<span>🍬 ${item.zuccheri}g</span>` : ''}
            </div>
          ` : ''}
          
          ${item.note ? `<div class="bevuta-note">📝 ${item.note}</div>` : ''}
        </div>
        
        <div class="bevuta-azioni">
          <button class="btn-primary btn-mini" onclick="incrementaBevuta('${item.varianteId}')" title="Aggiungi un'altra">➕</button>
          <button class="btn-danger btn-mini" onclick="decrementaBevuta('${item.bevuteIds[item.bevuteIds.length - 1]}')" title="Rimuovi ultima">➖</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ===== DECREMENTA BEVUTA (rimuovi ultima) =====
async function decrementaBevuta(bevutaId) {
  if (!bevutaId) return alert('Nessuna bevuta da eliminare');
  
  if (!confirm('Rimuovere l\'ultima bevuta?')) return;
  
  try {
    const res = await fetch(`${RENDER_API}/bevute/${bevutaId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      caricaBevute();
    } else {
      alert('❌ Errore eliminazione');
    }
  } catch (e) {
    console.error('Errore decrementa:', e);
    alert('❌ Errore rete');
  }
}


// ===== INCREMENTA BEVUTA (aggiungi un'altra della stessa variante) =====
async function incrementaBevuta(varianteId) {
  if (!varianteId) return alert('Variante non trovata');
  
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ varianteId })
    });
    
    if (res.ok) {
      caricaBevute();
    } else {
      alert('❌ Errore nel salvataggio');
    }
  } catch(e) { 
    console.error('Errore incrementa:', e);
    alert('❌ Errore rete');
  }
}

// ===== ELIMINA BEVUTA =====
async function eliminaBevuta(bevutaId) {
  if (!confirm('Eliminare questa bevuta?')) return;
  
  try {
    const res = await fetch(`${RENDER_API}/bevute/${bevutaId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      caricaBevute();
    } else {
      alert('❌ Errore eliminazione');
    }
  } catch (e) {
    console.error('Errore eliminazione:', e);
    alert('❌ Errore rete');
  }
}

// ===== CARICA VARIANTI PER MODAL =====
async function caricaVariantiPerModal() {
  try {
    const res = await fetch(`${RENDER_API}/monster-varianti`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    tutteVarianti = await res.json();
    console.log('✅', tutteVarianti.length, 'varianti caricate');
  } catch(e) {
    console.error('Varianti errore:', e);
  }
}

// ===== FILTRO VARIANTI NEL MODAL =====
function filtraVarianti() {
  const query = document.getElementById('ricercaVariante').value.toLowerCase().trim();
  const risultati = document.getElementById('risultatiRicerca');
  
  if (!query || query.length < 2) {
    risultati.style.display = 'none';
    return;
  }
  
  const match = tutteVarianti.filter(v => {
    const nomeVariante = (v.nome || '').toLowerCase();
    const nomeLattina = (v.lattina_id?.nome || '').toLowerCase();
    
    return nomeVariante.includes(query) || nomeLattina.includes(query);
  });
  
  if (match.length === 0) {
    risultati.innerHTML = '<div class="risultato-item" style="pointer-events: none; opacity: 0.6;">❌ Nessun risultato</div>';
    risultati.style.display = 'block';
    return;
  }
  
  risultati.innerHTML = match.slice(0, 15).map(v => {
    const nomeLattina = v.lattina_id?.nome || 'Monster';
    const nomeVariante = v.nome || 'Sconosciuta';
    
    return `
      <div class="risultato-item" onclick="selezionaVariante('${v._id}', '${nomeVariante.replace(/'/g, "\\'")}', '${nomeLattina.replace(/'/g, "\\'")}')">
        <strong>${nomeLattina}</strong> - ${nomeVariante}
      </div>
    `;
  }).join('');
  
  risultati.style.display = 'block';
}


function selezionaVariante(id, nomeVariante, nomeLattina) {
  document.getElementById('selectVariante').value = id;
  document.getElementById('ricercaVariante').value = `${nomeLattina} - ${nomeVariante}`;
  document.getElementById('risultatiRicerca').style.display = 'none';
}

function apriModalNuovaBevuta() {
  document.getElementById('modalNuovaBevuta').style.display = 'block';
  caricaVariantiPerModal();
}

function chiudiModalNuovaBevuta() {
  document.getElementById('modalNuovaBevuta').style.display = 'none';
  document.getElementById('formNuovaBevuta').reset();
  document.getElementById('risultatiRicerca').style.display = 'none';
}

async function gestisciSubmitBevuta(e) {
  e.preventDefault();
  const varianteId = document.getElementById('selectVariante').value;
  const note = document.getElementById('inputNote').value;
  
  if (!varianteId) return alert('⚠️ Seleziona una Monster!');
  
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ varianteId, note })
    });
    
    if (res.ok) {
      chiudiModalNuovaBevuta();
      caricaBevute();
      alert('🍺 Bevuta registrata!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert('❌ ' + (err.errore || 'Errore server'));
    }
  } catch(err) {
    console.error('Submit errore:', err);
    alert('❌ Errore rete');
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) nomeElement.textContent = `Ciao, ${username}!`;
  
  const form = document.getElementById('formNuovaBevuta');
  if (form) form.addEventListener('submit', gestisciSubmitBevuta);
  
  window.onclick = (e) => {
    if (e.target.id === 'modalNuovaBevuta') chiudiModalNuovaBevuta();
  };
  
  caricaBevute();
});
