const API_URL = 'https://monster-app-ocdj.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const username = localStorage.getItem('username');
  document.getElementById('nomeUtente').textContent = username;

  caricaStatistiche();
  verificaAdmin();
});

async function caricaStatistiche() {
  try {
    console.log('Caricamento statistiche...');
    const response = await fetch(`${API_URL}/statistiche`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    console.log('Risposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Dati:', data);

      document.getElementById('mostriPosseduti').textContent = data.mostriPosseduti;
      document.getElementById('mostriTotali').textContent = data.mostriTotali;
      document.getElementById('variantiTotali').textContent = data.variantiTotali;
      document.getElementById('percentuale').textContent = data.percentuale + '%';
      document.getElementById('progressFill').style.width = data.percentuale + '%';
    } else {
      console.error('Errore:', response.status);
      const error = await response.json();
      console.error('Dettagli:', error);
    }
  } catch (err) {
    console.error('Errore caricamento statistiche:', err);
  }
}

async function verificaAdmin() {
  const ruolo = localStorage.getItem('ruolo');
  if (ruolo === 'admin') {
    document.getElementById('linkAdmin').style.display = 'block';
    document.getElementById('linkUsers').style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('ruolo');
  window.location.href = 'index.html';
}
