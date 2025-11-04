// config.js contiene API_URL globalmente

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const username = localStorage.getItem('username');
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = username;
  }

  caricaStatistiche();
  verificaAdmin();
});

async function caricaStatistiche() {
  try {
    console.log('Caricamento statistiche...');
    console.log('Token:', localStorage.getItem('token'));
    
    const response = await fetch(`${API_URL}/statistiche`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    console.log('Risposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Dati ricevuti:', data);

      const mostriElement = document.getElementById('mostriPosseduti');
      const totaliElement = document.getElementById('mostriTotali');
      const variantiElement = document.getElementById('variantiTotali');
      const percentElement = document.getElementById('percentuale');
      const fillElement = document.getElementById('progressFill');

      if (mostriElement) mostriElement.textContent = data.mostriPosseduti;
      if (totaliElement) totaliElement.textContent = data.mostriTotali;
      if (variantiElement) variantiElement.textContent = data.variantiTotali;
      if (percentElement) percentElement.textContent = data.percentuale + '%';
      if (fillElement) fillElement.style.width = data.percentuale + '%';
    } else {
      console.error('Errore:', response.status);
      const error = await response.json();
      console.error('Dettagli:', error);
    }
  } catch (err) {
    console.error('Errore caricamento statistiche:', err);
  }
}

function verificaAdmin() {
  const ruolo = localStorage.getItem('ruolo');
  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('ruolo');
  window.location.href = 'index.html';
}
