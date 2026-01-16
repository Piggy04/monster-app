let tutteVarianti = [];

// 🔧 Render API diretta (bypass Netlify 404)
const RENDER_API = 'https://monster-app-ocdj.onrender.com/api';

async function caricaBevute() {
  try {
    const ricerca = document.getElementById('ricercaBevuta')?.value?.toLowerCase() || '';
    const data = document.getElementById('filtroData')?.value || '';
    
    const res = await fetch(`${RENDER_API}/bevute`);
    let bevute = await res.json();
    
    // ✅ Filtra per ricerca/data
    bevute = bevute.filter(b => 
      (b.nome?.toLowerCase().includes(ricerca) || !ricerca) &&
      (!data || b.ultime?.[0]?.data?.startsWith(data))
    );
    
    let html = '';
    bevute.forEach(bevuta => {
  html += `
    <div class="variante bevuta-card" data-id="${bevuta._id}" style="min-height: 360px;">
      <div class="bevuta-nome">${bevuta.nomeLattina || 'Monster'} ${bevuta.nomeVariante || ''}</div>
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


    
    document.getElementById('bevuteContainer').innerHTML = html || '<p>Nessuna bevuta registrata 😢</p>';
  } catch(e) {
    console.error('Errore bevute:', e);
    document.getElementById('bevuteContainer').innerHTML = '<p>Errore caricamento bevute</p>';
  }
}


async function caricaVariantiPerModal() {
  console.log('🔄 Caricando varianti...');
  try {
    const res = await fetch(`${RENDER_API}/monster-varianti`);
    console.log('Status:', res.status);
    
    const varianti = await res.json();
    console.log('Varianti:', varianti.length);
    
    const select = document.getElementById('selectVariante');
    if (!select) {
      console.error('❌ #selectVariante non trovato!');
      return;
    }
    
    select.innerHTML = '<option value="">Seleziona Monster...</option>';
    
    if (!varianti || varianti.length === 0) {
      select.innerHTML += '<option disabled>Nessuna variante</option>';
      return;
    }
    
    varianti.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v._id;
      opt.textContent = v.nome || 'Nome mancante';
      select.appendChild(opt);
    });
    console.log('✅ Modal pronto!');
  } catch(e) {
    console.error('💥 Modal errore:', e);
    document.getElementById('selectVariante').innerHTML = '<option>Errore caricamento</option>';
  }
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
    // Logica elimina ultima bevuta (opzionale)
    await fetch(`${RENDER_API}/bevute/${varianteId}`, { method: 'DELETE' });
    caricaBevute();
  } catch(e) { console.error(e); }
}

