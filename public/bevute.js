// Visibilità solo admin/beta
if (!['admin', 'beta'].includes(utente?.ruolo)) {
  window.location.href = 'accesso-negato.html';
}

async function caricaBevute() {
  try {
    const ricerca = document.getElementById('ricercaBevuta').value.toLowerCase();
    const data = document.getElementById('filtroData').value;
    
    const res = await fetch('/api/bevute');
    const bevute = await res.json();
    
    let html = '';
    bevute
      .filter(b => !ricerca || b.nome.toLowerCase().includes(ricerca))
      .filter(b => !data || b.data.startsWith(data))
      .sort((a,b) => new Date(b.data) - new Date(a.data))
      .forEach(bevuta => {
        html += `
          <div class="log-item">
            <div class="log-icon">🍺</div>
            <div class="log-content">
              <div class="log-descrizione">
                <strong>${bevuta.nome}</strong> ${bevuta.stato}
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
    
    document.getElementById('bevuteContainer').innerHTML = html || '<p>Nessuna bevuta registrata</p>';
  } catch(e) {
    document.getElementById('bevuteContainer').innerHTML = '<p>Errore caricamento</p>';
  }
}

function formattaData(dataISO) {
  return new Date(dataISO).toLocaleDateString('it-IT');
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

// Carica al load
document.addEventListener('DOMContentLoaded', () => {
  caricaBevute();
});
