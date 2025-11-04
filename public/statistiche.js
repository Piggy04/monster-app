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

  caricaTema();
  caricaStatistiche();
  verificaAdmin();
});

// CARICA E APPLICA TEMA
async function caricaTema() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      const tema = user.tema || 'light';
      document.documentElement.setAttribute('data-theme', tema);
      
      // Aggiorna bottone tema attivo
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.querySelector(`.theme-btn.${tema}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  } catch (err) {
    console.error('Errore caricamento tema:', err);
  }
}

// CAMBIA TEMA
async function cambiaTema(nuovoTema) {
  try {
    const token = localStorage.getItem('token');
    document.documentElement.setAttribute('data-theme', nuovoTema);
    
    const response = await fetch(`${API_URL}/auth/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema: nuovoTema })
    });
    
    if (response.ok) {
      // Aggiorna bottone attivo
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.theme-btn.${nuovoTema}`).classList.add('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// CARICA STATISTICHE
async function caricaStatistiche() {
  try {
    console.log('Caricamento statistiche...');
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    
    const response = await fetch(`${API_URL}/statistiche`, {
      headers: { 'Authorization': `Bearer ${token}` }
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

// VERIFICA ADMIN
function verificaAdmin() {
  const ruolo = localStorage.getItem('ruolo');
  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }
}

// LOGOUT
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('ruolo');
  window.location.href = 'index.html';
}
