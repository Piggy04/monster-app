// ⚡ CARICAMENTO ISTANTANEO - Applica tema subito da localStorage
(function() {
  const temaSalvato = localStorage.getItem('tema') || 'light';
  document.documentElement.setAttribute('data-theme', temaSalvato);
})();

// Carica tema dal server
async function caricaTema() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const utente = await response.json();
      
      // Salva in localStorage
      localStorage.setItem('tema', utente.tema);
      
      applicaTema(utente.tema);
      console.log('Tema caricato:', utente.tema);
    }
  } catch (errore) {
    console.error('Errore caricamento tema:', errore);
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
    // ⚡ Salva subito in localStorage
    localStorage.setItem('tema', tema);
    
    // Applica subito visivamente
    applicaTema(tema);
    
    // Aggiorna sul server
    const response = await fetch(`${API_URL}/auth/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema })
    });
    
    if (!response.ok) {
      console.error('Errore salvataggio tema sul server');
    }
    
    // Chiudi drawer se esiste
    const drawer = document.getElementById('themeDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  } catch (errore) {
    console.error('Errore cambio tema:', errore);
  }
}

// Toggle theme drawer
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  if (drawer) {
    drawer.classList.toggle('active');
  }
}

// Aggiungi selettore tema alla pagina (vecchia versione, probabilmente non usi più)
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
  // aggiungiSelettoreTema(); // ← Probabilmente non serve più se usi theme drawer
}
