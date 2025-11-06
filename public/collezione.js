let token = localStorage.getItem('token');
let datiCollezione = []; // Salva i dati originali


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
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }


  caricaTema();
  caricaCollezione();
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


// CARICA COLLEZIONE
async function caricaCollezione() {
  try {
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Errore caricamento');
    }
    
    datiCollezione = await response.json();
    inizializzaFiltri(datiCollezione);
    mostraCollezione(datiCollezione);
  } catch (errore) {
    console.error('Errore:', errore);
    const container = document.getElementById('collezioneContainer');
    if (container) {
      container.innerHTML = '<p>Errore nel caricamento della collezione</p>';
    }
  }
}


// INIZIALIZZA FILTRI CATEGORIE
function inizializzaFiltri(categorie) {
  const container = document.getElementById('categorieCheckboxes');
  if (!container) return;
  
  container.innerHTML = '';
  
  categorie.forEach(categoria => {
    const div = document.createElement('div');
    div.className = 'categoria-checkbox';
    div.innerHTML = `
      <input 
        type="checkbox" 
        id="cat_${categoria._id}" 
        value="${categoria._id}"
        checked
        onchange="applicaFiltri()"
      >
      <label for="cat_${categoria._id}">${categoria.nome}</label>
    `;
    container.appendChild(div);
  });
}


// APPLICA FILTRI
function applicaFiltri() {
  const ricerca = document.getElementById('ricercaInput').value.toLowerCase();
  const filtroStato = document.getElementById('filtroStato').value;
  
  // Categorie selezionate
  const categorieSel = [];
  document.querySelectorAll('#categorieCheckboxes input:checked').forEach(checkbox => {
    categorieSel.push(checkbox.value);
  });
  
  // Crea una copia profonda dei dati originali
  const datiFiltrati = JSON.parse(JSON.stringify(datiCollezione));
  
  // Filtra i dati
  const risultato = datiFiltrati.filter(categoria => {
    // Filtra per categoria
    if (!categorieSel.includes(categoria._id)) return false;
    
    // Filtra lattine e varianti
    categoria.lattine = categoria.lattine.filter(lattina => {
      // Filtra per ricerca nel nome della lattina
      const nomeMatch = lattina.nome.toLowerCase().includes(ricerca);
      
      if (filtroStato) {
        // Filtra varianti per stato posseduta/mancante
        lattina.varianti = lattina.varianti.filter(variante => {
          if (filtroStato === 'possedute') {
            return variante.posseduta;
          } else if (filtroStato === 'mancanti') {
            return !variante.posseduta;
          }
          return true;
        });
        
        // Se non ci sono varianti dopo il filtro e la ricerca non corrisponde, escludila
        if (lattina.varianti.length === 0 && !nomeMatch) return false;
      }
      
      return lattina.varianti.length > 0;
    });
    
    return categoria.lattine.length > 0;
  });
  
  mostraCollezione(risultato);
}



// SELEZIONA TUTTE LE CATEGORIE
function selezionatutte() {
  document.querySelectorAll('#categorieCheckboxes input').forEach(checkbox => {
    checkbox.checked = true;
  });
  applicaFiltri();
}


// DESELEZIONA TUTTE LE CATEGORIE
function deselezionatutte() {
  document.querySelectorAll('#categorieCheckboxes input').forEach(checkbox => {
    checkbox.checked = false;
  });
  applicaFiltri();
}



// MOSTRA COLLEZIONE
function mostraCollezione(categorie) {
  const container = document.getElementById('collezioneContainer');
  
  if (!container) return;
  
  if (categorie.length === 0) {
    container.innerHTML = '<p>Nessun risultato trovato.</p>';
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
          `<img src="${variante.immagine}" alt="${variante.nome}" class="variante-img" onclick="apriModalImmagine('${variante.immagine}')">` : 
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
    
    // Aggiorna i dati locali
    datiCollezione.forEach(categoria => {
      categoria.lattine.forEach(lattina => {
        lattina.varianti.forEach(variante => {
          if (variante._id === variante_id) {
            variante.posseduta = posseduta;
          }
        });
      });
    });
    
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
    } else {
      console.error('Errore statistiche:', response.status);
    }
  } catch (err) {
    console.error('Errore caricamento statistiche:', err);
  }
}


// ===== MODAL IMMAGINI =====
function apriModalImmagine(src) {
  const modal = document.getElementById('modalImmagine');
  const img = document.getElementById('immagineModal');
  img.src = src;
  modal.classList.add('active');
}


function chiudiModalImmagine() {
  const modal = document.getElementById('modalImmagine');
  modal.classList.remove('active');
}


// Chiudi modal quando premi ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    chiudiModalImmagine();
  }
});
