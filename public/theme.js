const API_URL = 'http://localhost:3000/api';

// Carica tema salvato
async function caricaTema() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const utente = await response.json();
      applicaTema(utente.tema);
      console.log('Tema caricato:', utente.tema); // ← AGGIUNGI QUESTA RIGA
    }
  } catch (errore) {
    console.error('Errore caricamento tema:', errore); // ← E QUESTA
  }
}


// Applica tema
function applicaTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  
  // Aggiorna pulsanti attivi
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnAttivo = document.querySelector(`.theme-btn.${tema}`);
  if (btnAttivo) {
    btnAttivo.classList.add('active');
  }
}

// Cambia tema
async function cambiaTema(tema) {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/users/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema })
    });
    
    if (response.ok) {
      applicaTema(tema);
    }
  } catch (errore) {
    console.error('Errore cambio tema');
  }
}

// Aggiungi selettore tema alla pagina
function aggiungiSelettoreTema() {
  const selector = document.createElement('div');
  selector.className = 'theme-selector';
  selector.innerHTML = `
    <h4>🎨 Tema</h4>
    <div class="theme-buttons">
      <button class="theme-btn light" onclick="cambiaTema('light')" title="Chiaro"></button>
      <button class="theme-btn dark" onclick="cambiaTema('dark')" title="Scuro"></button>
      <button class="theme-btn green" onclick="cambiaTema('green')" title="Verde"></button>
      <button class="theme-btn purple" onclick="cambiaTema('purple')" title="Viola"></button>
    </div>
  `;
  
  document.body.appendChild(selector);
}

// Inizializza tema
if (localStorage.getItem('token')) {
  caricaTema();
  aggiungiSelettoreTema();
}
