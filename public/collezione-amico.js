let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  caricaTema();
  mostraCollezioneAmico();
});

// CARICA E APPLICA TEMA
async function caricaTema() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      const tema = user.tema || 'light';
      document.documentElement.setAttribute('data-theme', tema);
      
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
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.theme-btn.${nuovoTema}`).classList.add('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// TORNA AGLI AMICI
function tornaAmici() {
  window.location.href = 'amici.html';
}

// MOSTRA COLLEZIONE AMICO
function mostraCollezioneAmico() {
  if (!window.amicoData) {
    alert('Errore: dati amico non trovati');
    window.location.href = 'amici.html';
    return;
  }

  const { collezione, statistiche, username } = window.amicoData;

  // Mostra nome
  document.getElementById('nomeAmico').textContent = username;

  // Mostra statistiche
  document.querySelectorAll('.stat-card-amico')[0].querySelector('.stat-value').textContent = statistiche.mostriPosseduti;
  document.querySelectorAll('.stat-card-amico')[1].querySelector('.stat-value').textContent = statistiche.variantiPosseduti;
  document.querySelectorAll('.stat-card-amico')[2].querySelector('.stat-value').textContent = statistiche.percentuale + '%';

  // Mostra collezione (read-only, no checkbox)
  const container = document.getElementById('collezioneAmicoContainer');
  
  if (collezione.length === 0) {
    container.innerHTML = '<p>Nessun dato disponibile.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  collezione.forEach(categoria => {
    const divCategoria = document.createElement('div');
    divCategoria.className = 'categoria';
    
    let htmlLattine = '';
    
    categoria.lattine.forEach(lattina => {
      let htmlVarianti = '';
      
      lattina.varianti.forEach(variante => {
        const imgHtml = variante.immagine ? 
          `<img src="${variante.immagine}" alt="${variante.nome}" class="variante-img">` : 
          '';
        
        const checkIcon = variante.posseduta ? '✓' : '✕';
        const checkClass = variante.posseduta ? 'posseduta' : 'mancante';
        
        htmlVarianti += `
          <div class="variante ${checkClass}">
            <span class="check-icon">${checkIcon}</span>
            <label>${variante.nome}</label>
            ${imgHtml}
          </div>
        `;
      });
      
      htmlLattine += `
        <div class="lattina">
          <h3>${lattina.nome}</h3>
          ${htmlVarianti}
        </div>
      `;
    });
    
    divCategoria.innerHTML = `
      <h2>${categoria.nome}</h2>
      ${htmlLattine}
    `;
    
    container.appendChild(divCategoria);
  });
}

// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
}

// Chiudi drawer quando clicchi su un tema
const originalCambiaTema = cambiaTema;
window.cambiaTema = function(nuovoTema) {
  originalCambiaTema(nuovoTema);
  document.getElementById('themeDrawer').classList.remove('active');
};

