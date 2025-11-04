let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

// Carica dati utente
const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', () => {
  // Imposta nome utente
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  // Mostra link admin
  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }

  // Carica tema
  caricaTema();
  
  // Carica la collezione
  caricaCollezione();
  
  // Carica statistiche
  caricaStatistiche();
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

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA COLLEZIONE
async function caricaCollezione() {
  try {
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Errore caricamento');
    }
    
    const categorie = await response.json();
    mostraCollezione(categorie);
  } catch (errore) {
    console.error('Errore:', errore);
    const container = document.getElementById('collezioneContainer');
    if (container) {
      container.innerHTML = '<p>Errore nel caricamento della collezione</p>';
    }
  }
}

// MOSTRA COLLEZIONE
function mostraCollezione(categorie) {
  const container = document.getElementById('collezioneContainer');
  
  if (!container) return;
  
  if (categorie.length === 0) {
    container.innerHTML = '<p>Nessuna categoria trovata. Usa il pannello Admin per aggiungere dati.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  categorie.forEach(categoria => {
    const divCategoria = document.createElement('div');
    divCategoria.className = 'categoria';
    
    let htmlLattine = '';
    
    categoria.lattine.forEach(lattina => {
      let htmlVarianti = '';
      
      lattina.varianti.forEach(variante => {
        const imgHtml = variante.immagine ? 
          `<img src="${variante.immagine}" alt="${variante.nome}" class="variante-img">` : 
          '';
        
        htmlVarianti += `
          <div class="variante">
            <input 
              type="checkbox" 
              id="var_${variante._id}" 
              ${variante.posseduta ? 'checked' : ''}
              onchange="aggiornaVariante('${variante._id}', this.checked)"
            >
            <label for="var_${variante._id}">${variante.nome}</label>
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

// AGGIORNA VARIANTE
async function aggiornaVariante(variante_id, posseduta) {
  try {
    const response = await fetch(`${API_URL}/collezione/possesso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ variante_id, posseduta })
    });
    
    if (!response.ok) {
      throw new Error('Errore aggiornamento');
    }
    
    // Ricarica statistiche dopo aggiornamento
    caricaStatistiche();
  } catch (errore) {
    console.error('Errore:', errore);
    alert('Errore nell\'aggiornamento');
  }
}

// CARICA STATISTICHE
async function caricaStatistiche() {
  try {
    const response = await fetch(`${API_URL}/statistiche`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Statistiche:', data);
      
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
      console.error('Errore statistiche:', response.status);
    }
  } catch (err) {
    console.error('Errore caricamento statistiche:', err);
  }
}
