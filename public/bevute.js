let tutteVarianti = [];

// 🔧 Render API diretta (bypass Netlify 404)
const RENDER_API = 'https://monster-app-ocdj.onrender.com/api';

let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

if (ruolo === 'admin') {
  const linkAdmin = document.getElementById('linkAdmin');
  const linkUsers = document.getElementById('linkUsers');
  const linkLogAdmin = document.getElementById('linkLogAdmin');
  if (linkAdmin) linkAdmin.style.display = 'block';
  if (linkUsers) linkUsers.style.display = 'block';
  if (linkLogAdmin) linkLogAdmin.style.display = 'block';
}

async function caricaBevute() {
  try {
    const ricerca = document.getElementById('ricercaBevuta')?.value?.toLowerCase() || '';
    const data = document.getElementById('filtroData')?.value || '';

    // ✅ AGGIUNGI TOKEN
    const res = await fetch(`${RENDER_API}/bevute`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Errore ${res.status}`);
    }
    
    let bevute = await res.json();

    // Filtri ricerca + data
    bevute = bevute.filter(b =>
      (
        (b.nomeLattina && b.nomeLattina.toLowerCase().includes(ricerca)) ||
        (b.nomeVariante && b.nomeVariante.toLowerCase().includes(ricerca)) ||
        (b.nome && b.nome.toLowerCase().includes(ricerca)) ||
        !ricerca
      ) &&
      (!data || (b.data && String(b.data).startsWith(data)))
    );

    let html = '';

    bevute.forEach(bevuta => {
      const nomeCompleto = `${bevuta.nomeLattina || 'Monster'} ${bevuta.nomeVariante || bevuta.nome || ''}`;
      const immagine = bevuta.varianteId?.immagine || bevuta.immagine || '/placeholder-beer.jpg';
      
      html += `
        <div class="variante bevuta-card" data-id="${bevuta._id}" style="min-height: 360px;">
          <div class="bevuta-nome">${nomeCompleto}</div>
          <div class="variante-immagine">
            <img src="${immagine}" class="variante-img bevuta-foto" alt="${nomeCompleto}">
          </div>
          <div class="bevuta-info">
            <span class="bevuta-stato">${getIconStato(bevuta.stato)} ${bevuta.stato}</span>
            <span class="bevuta-data">📅 ${formattaData(bevuta.data)}</span>
            ${bevuta.note ? `<p class="bevuta-note">📝 ${bevuta.note}</p>` : ''}
          </div>
          <div class="bevuta-azioni">
            <button class="btn-delete btn-mini" onclick="eliminaBevuta('${bevuta._id}')">🗑️ Elimina</button>
          </div>
        </div>
      `;
    });

    document.getElementById('bevuteContainer').innerHTML =
      html || '<p class="no-results">Nessuna bevuta registrata 😢<br>Clicca "➕ Nuova Bevuta" per iniziare!</p>';
  } catch (e) {
    console.error('Errore bevute:', e);
    document.getElementById('bevuteContainer').innerHTML =
      '<p class="no-results">❌ Errore caricamento bevute</p>';
  }
}

async function caricaVariantiPerModal() {
  try {
    // ✅ AGGIUNGI TOKEN
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

function getIconStato(stato) {
  const icons = { 
    'bevuta': '🍺', 
    'assaggiata': '👅', 
    'fatta-finta': '😜' 
  };
  return icons[stato] || '🍻';
}

function formattaData(dataISO) {
  try { 
    const d = new Date(dataISO);
    return d.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  } catch { 
    return '?'; 
  }
}

function oggi() {
  document.getElementById('filtroData').value = new Date().toISOString().split('T')[0];
  caricaBevute();
}

function settimanaScorsa() {
  const data = new Date(); 
  data.setDate(data.getDate() - 7);
  document.getElementById('filtroData').value = data.toISOString().split('T')[0];
  caricaBevute();
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
    // ✅ AGGIUNGI TOKEN
    const res = await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ varianteId, stato, note })
    });
    
    if (res.ok) {
      chiudiModalNuovaBevuta();
      caricaBevute();
      alert('🍺 Bevuta registrata!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert('❌ Errore: ' + (err.errore || 'Errore server'));
    }
  } catch(err) {
    console.error('Submit errore:', err);
    alert('❌ Errore rete');
  }
}

async function eliminaBevuta(bevutaId) {
  if (!confirm('🗑️ Eliminare questa bevuta?')) return;
  
  try {
    // ✅ AGGIUNGI TOKEN
    const res = await fetch(`${RENDER_API}/bevute/${bevutaId}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      alert('✅ Bevuta eliminata');
      caricaBevute();
    } else {
      alert('❌ Errore eliminazione');
    }
  } catch (e) {
    console.error('Errore DELETE:', e);
    alert('❌ Errore rete');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNuovaBevuta');
  if (form) form.addEventListener('submit', gestisciSubmitBevuta);
  
  window.onclick = (e) => {
    if (e.target.id === 'modalNuovaBevuta') chiudiModalNuovaBevuta();
  };
  
  document.getElementById('ricercaBevuta')?.addEventListener('input', caricaBevute);
  document.getElementById('filtroData')?.addEventListener('change', caricaBevute);
  
  caricaBevute();
});
