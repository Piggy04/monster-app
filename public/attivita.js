let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo === 'admin') {
  const linkAdmin = document.getElementById('linkAdmin');
  const linkUsers = document.getElementById('linkUsers');
  const linkLogAdmin = document.getElementById('linkLogAdmin');
  if (linkAdmin) linkAdmin.style.display = 'block';
  if (linkUsers) linkUsers.style.display = 'block';
  if (linkLogAdmin) linkLogAdmin.style.display = 'block';
}

  caricaTema(); // ← Usa theme.js
  caricaLog();
});

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA LOG ATTIVITÀ
async function caricaLog() {
  try {
    const response = await fetch(`${API_URL}/log?limite=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const log = await response.json();
      mostraLog(log);
    } else {
      const container = document.getElementById('logContainer');
      container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
    }
  } catch (err) {
    console.error('Errore:', err);
    const container = document.getElementById('logContainer');
    container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
  }
}

// MOSTRA LOG
function mostraLog(log) {
  const container = document.getElementById('logContainer');
  container.innerHTML = '';

  if (log.length === 0) {
    container.innerHTML = '<p class="no-results">Nessuna attività registrata</p>';
    return;
  }

  const logHtml = log.map(item => {
    const data = new Date(item.timestamp);
    const ora = data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const giorno = data.toLocaleDateString('it-IT');
    
    // ✅ ICONE AGGIORNATE
    let icona = '📝';
    if (item.azione === 'aggiunto') icona = '✅';
    if (item.azione === 'rimosso') icona = '❌';
    if (item.azione === 'aggiornato') icona = '🔄';
    if (item.azione === 'richiesta_inviata') icona = '📨';
    if (item.azione === 'richiesta_accettata') icona = '🤝';
    if (item.azione === 'cambio_username') icona = '👤';
    if (item.azione === 'cambio_email') icona = '✉️';
    if (item.azione === 'cambio_password') icona = '🔐';
    if (item.azione === 'account_eliminato') icona = '🗑️';

    return `
      <div class="log-item">
        <div class="log-icon">${icona}</div>
        <div class="log-content">
          <p class="log-descrizione">${item.descrizione}</p>
          <div class="log-meta">
            <span class="log-data">${giorno}</span>
            <span class="log-ora">${ora}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = logHtml;
}

