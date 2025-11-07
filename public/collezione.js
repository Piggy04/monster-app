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
    let badgeHtml = '';
    if (ruolo === 'admin') {
      badgeHtml = '<span class="role-badge role-admin">ADMIN</span>';
    } else if (ruolo === 'beta') {
      badgeHtml = '<span class="role-badge role-beta">BETA TESTER</span>';
    }
    nomeElement.innerHTML = `Ciao, ${username}! ${badgeHtml}`;
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
    
    // Chiudi theme drawer
    const drawer = document.getElementById('themeDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
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
      // Verifica se il nome della lattina matcha
      const nomeLattinaMatch = lattina.nome.toLowerCase().includes(ricerca);
      
      // Se il nome della lattina matcha E non c'è ricerca, mostra tutte le varianti
      if (nomeLattinaMatch && !ricerca) {
        // Applica solo filtro di stato
        if (filtroStato) {
          lattina.varianti = lattina.varianti.filter(variante => {
            if (filtroStato === 'possedute') return variante.posseduta;
            if (filtroStato === 'mancanti') return !variante.posseduta;
            return true;
          });
        }
        return lattina.varianti.length > 0;
      }
      
      // Se il nome della lattina matcha E c'è ricerca, mostra tutte le sue varianti
      if (nomeLattinaMatch && ricerca) {
        // Applica solo filtro di stato, NON filtro di ricerca sulle varianti
        if (filtroStato) {
          lattina.varianti = lattina.varianti.filter(variante => {
            if (filtroStato === 'possedute') return variante.posseduta;
            if (filtroStato === 'mancanti') return !variante.posseduta;
            return true;
          });
        }
        return lattina.varianti.length > 0;
      }
      
      // Se il nome della lattina NON matcha, filtra le varianti per ricerca
      lattina.varianti = lattina.varianti.filter(variante => {
        const nomeVarianteMatch = variante.nome.toLowerCase().includes(ricerca);
        
        // Se c'è ricerca e la variante non matcha, escludila
        if (ricerca && !nomeVarianteMatch) return false;
        
        // Applica filtro di stato
        if (filtroStato) {
          if (filtroStato === 'possedute') return variante.posseduta;
          if (filtroStato === 'mancanti') return !variante.posseduta;
        }
        
        return true;
      });
      
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
function mostraCollezione(dati) {
  const container = document.getElementById('collezioneContainer');
  container.innerHTML = '';

  if (dati.length === 0) {
    container.innerHTML = '<p class="no-results">Nessuna lattina trovata.</p>';
    return;
  }

  dati.forEach(categoria => {
    const divCategoria = document.createElement('div');
    divCategoria.className = 'categoria';
    divCategoria.id = `categoria-${categoria._id}`;

    let htmlLattine = '';

    categoria.lattine.forEach(lattina => {
      let htmlVarianti = '';

      lattina.varianti.forEach(variante => {
  const checked = variante.posseduta ? 'checked' : '';
  const statoToggle = variante.stato === 'piena' ? 'piena' : 'vuota';
  const disabledToggle = !variante.posseduta ? 'disabled' : '';
  
  // CLASSE PER COLORARE DI VERDE SE POSSEDUTA (qualsiasi stato)
  const classPosseduta = variante.posseduta ? 'variante-posseduta' : '';
  
  const imgHtml = variante.immagine ? 
    `<img src="${variante.immagine}" alt="${variante.nome}" class="variante-img" onclick="apriModalImmagine('${variante.immagine}')">` : 
    '<div class="variante-img-placeholder">📷</div>';

  htmlVarianti += `
    <div class="variante ${classPosseduta}">
      <div class="variante-left">
        <input 
          type="checkbox" 
          id="check-${variante._id}"
          ${checked} 
          onchange="toggleVariante('${variante._id}')"
        >
        <label for="check-${variante._id}">${variante.nome}</label>
      </div>
      <div class="variante-controls">
        <div class="stato-toggle ${disabledToggle}" id="toggle-${variante._id}">
          <span class="stato-label">Vuota</span>
          <label class="switch">
            <input 
              type="checkbox" 
              ${variante.stato === 'piena' ? 'checked' : ''}
              ${disabledToggle}
              onchange="cambiaStato('${variante._id}', this.checked)"
            >
            <span class="slider ${statoToggle}"></span>
          </label>
          <span class="stato-label">Piena</span>
        </div>
        ${imgHtml}
      </div>
    </div>
  `;
});


      htmlLattine += `
        <div class="lattina">
          <h3>${lattina.nome}</h3>
          <div class="varianti-grid">
            ${htmlVarianti}
          </div>
        </div>
      `;
    });

    divCategoria.innerHTML = `
      <div class="categoria-header" onclick="toggleCategoria('${categoria._id}')">
        <h2>
          <span class="toggle-icon" id="icon-${categoria._id}">▼</span>
          ${categoria.nome}
        </h2>
        <span class="categoria-count">${categoria.lattine.length} lattine</span>
      </div>
      <div class="categoria-content">
        ${htmlLattine}
      </div>
    `;

    container.appendChild(divCategoria);
  });
}

// TOGGLE CATEGORIA (collapse/expand)
function toggleCategoria(categoriaId) {
  const categoria = document.getElementById(`categoria-${categoriaId}`);
  const icon = document.getElementById(`icon-${categoriaId}`);
  
  if (categoria.classList.contains('collapsed')) {
    categoria.classList.remove('collapsed');
    icon.textContent = '▼';
  } else {
    categoria.classList.add('collapsed');
    icon.textContent = '▶';
  }
}

// TOGGLE VARIANTE (posseduta/non posseduta)
async function toggleVariante(varianteId) {
  const checkbox = document.getElementById(`check-${varianteId}`);
  const posseduta = checkbox.checked;
  
  try {
    const response = await fetch(`${API_URL}/collezione/possesso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ variante_id: varianteId, posseduta })
    });
    
    if (response.ok) {
      // Aggiorna i dati locali
      datiCollezione.forEach(categoria => {
        categoria.lattine.forEach(lattina => {
          lattina.varianti.forEach(variante => {
            if (variante._id === varianteId) {
              variante.posseduta = posseduta;
            }
          });
        });
      });
      
      // Abilita/disabilita il toggle stato
      const toggle = document.getElementById(`toggle-${varianteId}`);
      const toggleInput = toggle.querySelector('input[type="checkbox"]');
      
      if (posseduta) {
        toggle.classList.remove('disabled');
        toggleInput.disabled = false;
      } else {
        toggle.classList.add('disabled');
        toggleInput.disabled = true;
        // Reset a vuota quando viene deselezionata
        toggleInput.checked = false;
        const slider = toggle.querySelector('.slider');
        if (slider) {
          slider.className = 'slider vuota';
        }
        // Aggiorna anche il backend
        await cambiaStato(varianteId, false);
      }
      
      // Ricarica per aggiornare i colori
      caricaCollezione();
      
      // Aggiorna statistiche
      caricaStatistiche();
    } else {
      checkbox.checked = !posseduta;
      alert('Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    checkbox.checked = !posseduta;
    alert('Errore nell\'aggiornamento');
  }
}

// CAMBIA STATO PIENA/VUOTA
async function cambiaStato(varianteId, isPiena) {
  const stato = isPiena ? 'piena' : 'vuota';
  
  try {
    const response = await fetch(`${API_URL}/collezione/stato/${varianteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stato })
    });
    
    if (response.ok) {
      // Aggiorna visivamente lo slider
      const slider = document.querySelector(`#toggle-${varianteId} .slider`);
      if (slider) {
        slider.className = `slider ${stato}`;
      }
      
      // Aggiorna i dati locali
      datiCollezione.forEach(categoria => {
        categoria.lattine.forEach(lattina => {
          lattina.varianti.forEach(variante => {
            if (variante._id === varianteId) {
              variante.stato = stato;
            }
          });
        });
      });
    } else {
      alert('Errore nel cambio stato');
      const toggleInput = document.querySelector(`#toggle-${varianteId} input[type="checkbox"]`);
      if (toggleInput) {
        toggleInput.checked = !isPiena;
      }
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nel cambio stato');
    const toggleInput = document.querySelector(`#toggle-${varianteId} input[type="checkbox"]`);
    if (toggleInput) {
      toggleInput.checked = !isPiena;
    }
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
