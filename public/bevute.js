let tutteVarianti = [];

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

// ===== CARICA BEVUTE RAGGRUPPATE PER VARIANTE =====
async function caricaBevute() {
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Errore ${res.status}: ${res.statusText}`);
    }
    
    const bevute = await res.json();
    
    console.log('📊 Bevute ricevute:', bevute.length);
    
    // Raggruppa per varianteId
    const raggruppate = {};
    
    bevute.forEach(b => {
      // Usa varianteId se esiste, altrimenti fallback
      const varId = b.varianteId?._id || b.varianteId;
      
      if (!varId) {
        console.warn('⚠️ Bevuta senza varianteId:', b);
        return;
      }
      
      if (!raggruppate[varId]) {
        raggruppate[varId] = {
          varianteId: varId,
          nome: b.varianteId?.nome || b.nomeVariante || 'Monster',
          lattinaNome: b.varianteId?.lattina_id?.nome || b.nomeLattina || '',
          immagine: b.varianteId?.immagine || b.immagine || '/placeholder-beer.jpg',
          conteggio: 0,
          bevuteIds: []
        };
      }
      
      raggruppate[varId].conteggio++;
      raggruppate[varId].bevuteIds.push(b._id);
    });
    
    const lista = Object.values(raggruppate);
    
    let html = '';
    
    lista.forEach(item => {
      const nomeCompleto = item.lattinaNome ? `${item.lattinaNome} - ${item.nome}` : item.nome;
      
      html += `
        <div class="variante bevuta-card">
          <div class="bevuta-nome">${nomeCompleto}</div>
          <div class="variante-immagine">
            <img src="${item.immagine}" class="variante-img bevuta-foto" alt="${nomeCompleto}">
          </div>
          <div class="variante-checkbox">
            <span class="conteggio-badge">🍺 x${item.conteggio}</span>
          </div>
          <div class="bevuta-azioni">
            <button class="btn-primary btn-mini" onclick="incrementaBevuta('${item.varianteId}')">➕</button>
            <button class="btn-danger btn-mini" onclick="decrementaBevuta('${item.bevuteIds[item.bevuteIds.length - 1]}')">➖</button>
          </div>
        </div>
      `;
    });
    
    document.getElementById('bevuteContainer').innerHTML = 
      html || '<p class="no-results">Nessuna bevuta registrata 😢<br>Clicca "➕ Nuova Bevuta" per iniziare!</p>';
      
  } catch (e) {
    console.error('❌ Errore caricamento bevute:', e);
    document.getElementById('bevuteContainer').innerHTML = 
      `<p class="no-results">❌ Errore: ${e.message}</p>`;
  }
}


// ===== INCREMENTA BEVUTA (aggiunge una nuova) =====
async function incrementaBevuta(varianteId) {
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        varianteId, 
        stato: 'bevuta' 
      })
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

// ===== DECREMENTA BEVUTA (elimina l'ultima) =====
async function decrementaBevuta(bevutaId) {
  if (!bevutaId) return alert('Nessuna bevuta da eliminare');
  
  try {
    const res = await fetch(`${RENDER_API}/bevute/${bevutaId}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      caricaBevute();
    } else {
      alert('❌ Errore eliminazione');
    }
  } catch (e) {
    console.error('Errore decrementa:', e);
  }
}

// ===== CARICA VARIANTI PER MODAL =====
async function caricaVariantiPerModal() {
  try {
    const res = await fetch(`${RENDER_API}/monster-varianti`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
  
  const match = tutteVarianti.filter(v => 
    v.nome.toLowerCase().includes(query) ||
    v.lattina_id?.nome?.toLowerCase().includes(query)
  );
  
  risultati.innerHTML = match.slice(0, 10).map(v => `
    <div class="risultato-item" onclick="selezionaVariante('${v._id}', '${v.nome}', '${v.lattina_id?.nome || ''}')">
      <strong>${v.lattina_id?.nome || 'Monster'}</strong> - ${v.nome}
    </div>
  `).join('');
  
  if (query && match.length > 0) {
    risultati.style.display = 'block';
  } else {
    risultati.style.display = 'none';
  }
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
  const stato = document.getElementById('selectStato').value;
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
  const form = document.getElementById('formNuovaBevuta');
  if (form) form.addEventListener('submit', gestisciSubmitBevuta);
  
  window.onclick = (e) => {
    if (e.target.id === 'modalNuovaBevuta') chiudiModalNuovaBevuta();
  };
  
  caricaBevute();
});
