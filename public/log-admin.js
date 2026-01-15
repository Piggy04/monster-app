const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo !== 'admin') {
    alert('⚠️ Accesso riservato agli admin');
    window.location.href = 'collezione.html';
    return;
  }

  caricaTema();
  caricaUtenti();
  caricaLogAdmin();
});

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA LISTA UTENTI PER FILTRO
async function caricaUtenti() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const utenti = await response.json();
      const select = document.getElementById('filtroUtente');
      
      utenti.forEach(utente => {
        const option = document.createElement('option');
        option.value = utente._id;
        option.textContent = `${utente.username} (${utente.email})`;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Errore caricamento utenti:', err);
  }
}

// CARICA LOG ADMIN
async function caricaLogAdmin() {
  try {
    const userId = document.getElementById('filtroUtente').value;
    const limite = document.getElementById('limite').value;
    
    let url = `${API_URL}/log/admin/tutti?limite=${limite}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const log = await response.json();
      mostraLogAdmin(log);
    } else {
      const container = document.getElementById('logAdminContainer');
      container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
    }
  } catch (err) {
    console.error('Errore:', err);
    const container = document.getElementById('logAdminContainer');
    container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
  }
}

// MOSTRA LOG ADMIN
function mostraLogAdmin(log) {
  const container = document.getElementById('logAdminContainer');
  container.innerHTML = '';

  if (log.length === 0) {
    container.innerHTML = '<p class="no-results">Nessuna attività registrata</p>';
    return;
  }

  const logHtml = log.map(item => {
    const data = new Date(item.timestamp);
    const ora = data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const giorno = data.toLocaleDateString('it-IT');
    
    // Icone per tipo di azione
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

    const utenteNome = item.utente_id ? item.utente_id.username : 'Utente eliminato';

    return `
      <div class="log-item-admin">
        <div class="log-icon">${icona}</div>
        <div class="log-content">
          <div class="log-user">
            <strong>${utenteNome}</strong>
          </div>
          <p class="log-descrizione">${item.descrizione}</p>
          <div class="log-meta">
            <span class="log-tipo">${item.tipo}</span>
            <span class="log-data">${giorno}</span>
            <span class="log-ora">${ora}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = logHtml;
}


if (['admin', 'beta'].includes(utente?.ruolo)) {
  document.getElementById('linkBevute').style.display = 'block';
  document.getElementById('linkAdmin').style.display = 'block';
}

