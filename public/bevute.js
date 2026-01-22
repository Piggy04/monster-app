let tutteVarianti = [];
let bevuteOriginali = []; // ← Array completo per filtri
let periodoAttivo = 'tutto'; // ← Stato filtro periodo

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

// ===== CARICA BEVUTE (senza raggruppamento) =====
async function caricaBevute() {
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    
    bevuteOriginali = await res.json();
    
    console.log('📊 Bevute caricate:', bevuteOriginali.length);
    
    caricaStatistiche(); // ← Aggiorna statistiche
    applicaFiltri(); // ← Applica filtri/ordinamento
    
  } catch (e) {
    console.error('❌ Errore caricamento bevute:', e);
    document.getElementById('bevuteContainer').innerHTML = 
      `<p class="no-results">❌ Errore: ${e.message}</p>`;
  }
}

// ===== FILTRI TEMPORALI =====
function filtraPeriodo(periodo) {
  periodoAttivo = periodo;
  
  // Aggiorna pulsanti attivi
  document.querySelectorAll('.filtri-box button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`btn${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`).classList.add('active');
  
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
  
  // 1️⃣ Filtro periodo
  risultato = filtraPerData(risultato);
  
  // 2️⃣ Ricerca
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
  
  // 3️⃣ Ordinamento
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

// ===== MOSTRA BEVUTE (SINGOLE, non raggruppate) =====
function mostraBevute(bevute) {
  const container = document.getElementById('bevuteContainer');
  
  if (bevute.length === 0) {
    container.innerHTML = '<p class="no-results">🔍 Nessuna bevuta trovata</p>';
    return;
  }
  
  let html = '';
  
  bevute.forEach(b => {
    const nomeVariante = b.varianteId?.nome || 'Monster';
    const nomeLattina = b.varianteId?.lattina_id?.nome || '';
    const nomeCompleto = nomeLattina ? `${nomeLattina} - ${nomeVariante}` : nomeVariante;
    const immagine = b.varianteId?.immagine || '/placeholder-beer.jpg';
    
    const data = new Date(b.data);
    const dataStr = data.toLocaleDateString('it-IT');
    const oraStr = b.ora || data.toLocaleTimeString('it-IT');
    
    // Info nutrizionali
    const caffeina = b.varianteId?.caffeina_mg || 0;
    const calorie = b.varianteId?.calorie_kcal || 0;
    const zuccheri = b.varianteId?.zuccheri_g || 0;
    
    html += `
      <div class="bevuta-card">
        <div class="bevuta-header">
          <div class="bevuta-nome">${nomeCompleto}</div>
          <button class="btn-danger btn-mini" onclick="eliminaBevuta('${b._id}')" title="Elimina">🗑️</button>
        </div>
        
        <div class="variante-immagine">
          <img src="${immagine}" class="variante-img bevuta-foto" alt="${nomeCompleto}" onclick="apriModalImmagine('${immagine}')">
        </div>
        
        <div class="bevuta-info">
          <div class="info-row">
            <span>📅 ${dataStr}</span>
            <span>🕐 ${oraStr}</span>
          </div>
          
          ${caffeina || calorie || zuccheri ? `
            <div class="info-nutrizionale">
              ${caffeina ? `<span title="Caffeina">⚡ ${caffeina}mg</span>` : ''}
              ${calorie ? `<span title="Calorie">🔥 ${calorie}kcal</span>` : ''}
              ${zuccheri ? `<span title="Zuccheri">🍬 ${zuccheri}g</span>` : ''}
            </div>
          ` : ''}
          
          ${b.note ? `<div class="bevuta-note">📝 ${b.note}</div>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
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
      caricaBevute(); // Ricarica tutto
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
  const query = document.getElementById('ricercaVariante').value.toLowerCase();
  const risultati = document.getElementById('risultatiRicerca');
  
  if (!query) {
    risultati.style.display = 'none';
    return;
  }
  
  const match = tutteVarianti.filter(v => 
    v.nome.toLowerCase().includes(query) ||
    v.lattina_id?.nome?.toLowerCase().includes(query)
  );
  
  risultati.innerHTML = match.slice(0, 10).map(v => `
    <div class="risultato-item" onclick="selezionaVariante('${v._id}', '${v.nome}', '${v.lattina_id?.nome || ''}')">
      <strong>${v.lattina_id?.nome || 'Monster'}</strong> - ${v.nome}
    </div>
  `).join('');
  
  risultati.style.display = match.length > 0 ? 'block' : 'none';
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
