let tutteVarianti = [];

// Solo admin/beta
if (typeof utente !== 'undefined' && !['admin', 'beta'].includes(utente?.ruolo)) {
  window.location.href = 'accesso-negato.html';
  return;
}

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
    const res = await fetch('/api/collezione/completa');
    tutteVarianti = await res.json();
    
    const select = document.getElementById('selectVariante');
    if (!select) return;
    
    select.innerHTML = '<option value="">Caricamento...</option>';
    
    setTimeout(() => {
      select.innerHTML = '<option value="">Seleziona Monster...</option>';
      tutteVarianti.forEach(cat => {
        cat.lattine.forEach(lattina => {
          lattina.varianti.forEach(variante => {
            const opt = document.createElement('option');
            opt.value = variante._id;
            opt.textContent = `${lattina.nome} - ${variante.nome}`;
            select.appendChild(opt);
          });
        });
      });
    }, 500);
  } catch(e) {
    console.error('Errore varianti:', e);
  }
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
    return new Date(dataISO).toLocaleDateString('it-IT');
  } catch {
    return 'Data non valida';
  }
}

function oggi() {
  const oggi = new Date().toISOString().split('T')[0];
  document.getElementById('filtroData').value = oggi;
  caricaBevute();
}

function settimanaScorsa() {
  const data = new Date();
  data.setDate(data.getDate() - 7);
  document.getElementById('filtroData').value = data.toISOString().split('T')[0];
  caricaBevute();
}

// MODAL FUNZIONI
function apriModalNuovaBevuta() {
  document.getElementById('modalNuovaBevuta').style.display = 'block';
  caricaVariantiPerModal();
}

function chiudiModalNuovaBevuta() {
  document.getElementById('modalNuovaBevuta').style.display = 'none';
  document.getElementById('formNuovaBevuta').reset();
}

// Form submit
function gestisciSubmitBevuta(e) {
  e.preventDefault();
  
  const varianteId = document.getElementById('selectVariante').value;
  const stato = document.getElementById('selectStato').value;
  const note = document.getElementById('inputNote').value;
  
  if (!varianteId) {
    alert('Seleziona una Monster!');
    return;
  }
  
  fetch('/api/bevute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ varianteId, stato, note })
  })
  .then(res => res.json())
  .then(() => {
    chiudiModalNuovaBevuta();
    caricaBevute();
    alert('Bevuta registrata! 🍺');
  })
  .catch(err => {
    console.error(err);
    alert('Errore salvataggio');
  });
}
// Filtra solo varianti con contatoreBevute > 0
const variantiBevute = await fetch('/api/collezione/completa').then(r => r.json());


// EVENT LISTENER SICURI
document.addEventListener('DOMContentLoaded', () => {
  // Form
  const form = document.getElementById('formNuovaBevuta');
  if (form) {
    form.addEventListener('submit', gestisciSubmitBevuta);
  }
  
  // Modal close
  window.onclick = (e) => {
    if (e.target.id === 'modalNuovaBevuta') {
      chiudiModalNuovaBevuta();
    }
  };
  
  caricaBevute();
});
