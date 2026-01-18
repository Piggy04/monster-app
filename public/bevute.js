let tutteVarianti = [];

// 🔧 Render API diretta (bypass Netlify 404)
const RENDER_API = 'https://monster-app-ocdj.onrender.com/api';

async function caricaBevute() {
  try {
    const ricerca = document.getElementById('ricercaBevuta')?.value?.toLowerCase() || '';
    const data = document.getElementById('filtroData')?.value || '';

    const res = await fetch(`${RENDER_API}/bevute`);
    let bevute = await res.json();

    // Filtri ricerca + data (usa nomeLattina/nomeVariante se presenti)
    bevute = bevute.filter(b =>
      (
        (b.nomeLattina && b.nomeLattina.toLowerCase().includes(ricerca)) ||
        (b.nomeVariante && b.nomeVariante.toLowerCase().includes(ricerca)) ||
        !ricerca
      ) &&
      (!data || (b.ultime && b.ultime[0] && String(b.ultime[0].data).startsWith(data)))
    );

    let html = ''; // ← QUESTA MANCAVA

    bevute.forEach(bevuta => {
      html += `
        <div class="variante bevuta-card" data-id="${bevuta._id}" style="min-height: 360px;">
          <div class="bevuta-nome">${bevuta.nomeLattina || 'Monster'} ${bevuta.nomeVariante || bevuta.nome || ''}</div>
          <div class="variante-immagine">
            <img src="${bevuta.immagine || '/placeholder-beer.jpg'}" class="variante-img bevuta-foto">
          </div>
          <div class="variante-checkbox">
            <span class="conteggio-badge">🍺 x${bevuta.conteggio}</span>
          </div>
          <div class="variante-switch">
            <div class="bevuta-azioni">
              <button onclick="incrementaBevuta('${bevuta._id}', '${bevuta.stato}')">➕</button>
              <button onclick="decrementaBevuta('${bevuta._id}')">➖</button>
            </div>
          </div>
        </div>
      `;
    });

    document.getElementById('bevuteContainer').innerHTML =
      html || '<p>Nessuna bevuta registrata 😢</p>';
  } catch (e) {
    console.error('Errore bevute:', e);
    document.getElementById('bevuteContainer').innerHTML =
      '<p>Errore caricamento bevute</p>';
  }
}



async function caricaVariantiPerModal() {
  try {
    const res = await fetch(`${RENDER_API}/monster-varianti`);
    tutteVarianti = await res.json();
    console.log('✅', tutteVarianti.length, 'varianti caricate');
  } catch(e) {
    console.error('Varianti errore:', e);
  }
}

function filtraVarianti() {
  const query = document.getElementById('ricercaVariante').value.toLowerCase();
  const risultati = document.getElementById('risultatiRicerca');
  const hiddenInput = document.getElementById('selectVariante');
  
  const match = tutteVarianti.filter(v => 
  v.nome.toLowerCase().includes(query) ||
  v.lattina_id?.nome?.toLowerCase().includes(query)  // cerca anche lattina
);

  
  risultati.innerHTML = match.map(v => `
    <div class="risultato-item" onclick="selezionaVariante('${v._id}', '${v.nome}')">
      ${v.nome}
    </div>
  `).join('');
  
  if (query) risultati.style.display = 'block';
  else risultati.style.display = 'none';
}

function selezionaVariante(id, nome) {
  document.getElementById('selectVariante').value = id;
  document.getElementById('ricercaVariante').value = nome;
  document.getElementById('risultatiRicerca').style.display = 'none';
}


function getIconStato(stato) {
  const icons = { 'bevuta': '🍺', 'assaggiata': '👅', 'fatta-finta': '😜' };
  return icons[stato] || '🍻';
}

function formattaData(dataISO) {
  try { 
    return new Date(dataISO).toLocaleDateString('it-IT'); 
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
}

async function gestisciSubmitBevuta(e) {
  e.preventDefault();
  const varianteId = document.getElementById('selectVariante').value;
  const stato = document.getElementById('selectStato').value;
  const note = document.getElementById('inputNote').value;
  
  if (!varianteId) return alert('⚠️ Seleziona Monster!');
  
  try {
    const res = await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ varianteId, stato, note })
    });
    
    if (res.ok) {
      chiudiModalNuovaBevuta();
      caricaBevute();
      alert('🍺 Bevuta registrata!');
    } else {
      alert('❌ Errore server');
    }
  } catch(err) {
    console.error('Submit errore:', err);
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

async function incrementaBevuta(varianteId, stato = 'bevuta') {
  try {
    await fetch(`${RENDER_API}/bevute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ varianteId, stato })
    });
    caricaBevute(); // Refresh
  } catch(e) { console.error(e); }
}

async function decrementaBevuta(varianteId) {
  try {
    await fetch(`${RENDER_API}/bevute/${varianteId}`, { method: 'DELETE' });
    caricaBevute();
  } catch (e) {
    console.error('➖ Errore:', e);
  }
}



