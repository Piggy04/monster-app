let tutteVarianti = [];

async function caricaBevute() {
  try {
    const ricerca = document.getElementById('ricercaBevuta')?.value?.toLowerCase() || '';
    const data = document.getElementById('filtroData')?.value || '';
    
    const res = await fetch('/api/bevute');
    const bevute = await res.json();
    
    let html = '';
    bevute
      .filter(b => !ricerca || b.nome.toLowerCase().includes(ricerca))
      .filter(b => !data || b.data.startsWith(data))
      .sort((a,b) => new Date(b.data) - new Date(a.data))
      .slice(0, 50)
      .forEach(bevuta => {
        html += `
          <div class="log-item">
            <div class="log-icon">${getIconStato(bevuta.stato)}</div>
            <div class="log-content">
              <div class="log-descrizione">
                <strong>${bevuta.nome}</strong> 
                <span class="badge-stato ${bevuta.stato}">${bevuta.stato}</span>
              </div>
              <div class="log-meta">
                <span class="log-data">${formattaData(bevuta.data)}</span>
                <span class="log-ora">${bevuta.ora}</span>
                ${bevuta.note ? `<span>💭 ${bevuta.note}</span>` : ''}
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
  try {
    const res = await fetch('/api/monster-varianti');  // ← NUOVA semplice
    const varianti = await res.json();
    
    const select = document.getElementById('selectVariante');
    select.innerHTML = '<option value="">Seleziona Monster...</option>';
    
    varianti.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v._id;
      opt.textContent = v.nome;
      select.appendChild(opt);
    });
  } catch(e) {
    console.error('Modal errore:', e);
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
  
  if (!varianteId) return alert('Seleziona Monster!');
  
  try {
    const res = await fetch('/api/bevute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ varianteId, stato, note })
    });
    
    if (res.ok) {
      chiudiModalNuovaBevuta();
      caricaBevute();
      alert('🍺 Bevuta registrata!');
    } else {
      alert('Errore server');
    }
  } catch(err) {
    alert('Errore rete');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNuovaBevuta');
  if (form) form.addEventListener('submit', gestisciSubmitBevuta);
  
  window.onclick = (e) => {
    if (e.target.id === 'modalNuovaBevuta') chiudiModalNuovaBevuta();
  };
  
  // Auto-ricerca
  document.getElementById('ricercaBevuta')?.addEventListener('input', caricaBevute);
  document.getElementById('filtroData')?.addEventListener('change', caricaBevute);
  
  caricaBevute();
});
