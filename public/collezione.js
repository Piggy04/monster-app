let token = localStorage.getItem('token');
let datiCollezione = [];

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
  const linkLogAdmin = document.getElementById('linkLogAdmin');
  if (linkAdmin) linkAdmin.style.display = 'block';
  if (linkUsers) linkUsers.style.display = 'block';
  if (linkLogAdmin) linkLogAdmin.style.display = 'block';
}

  caricaTema(); // ← Usa theme.js
  caricaCollezione();
  caricaStatistiche();
});

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

let deferredPrompt;
const installButton = document.getElementById('installButton');



// Intercetta evento installazione
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ App installabile!');
  
  // Previeni il prompt automatico di Chrome
  e.preventDefault();
  
  // Salva l'evento per usarlo dopo
  deferredPrompt = e;
  
  // Mostra il pulsante custom
  installButton.style.display = 'block';
});

// Click sul pulsante
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) {
    console.log('❌ Prompt non disponibile');
    return;
  }
  
  // Mostra il prompt nativo
  deferredPrompt.prompt();
  
  // Aspetta la scelta utente
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`Utente ha scelto: ${outcome}`);
  
  // Reset
  deferredPrompt = null;
  installButton.style.display = 'none';
});

// Nasconde pulsante se app già installata
window.addEventListener('appinstalled', () => {
  console.log('✅ App installata!');
  installButton.style.display = 'none';
  deferredPrompt = null;
});


// CARICA COLLEZIONE CON CACHE
async function caricaCollezione() {
  const cacheKey = 'collezione-cache';
  const cacheTimeKey = 'collezione-timestamp';
  const cacheExpiry = 5 * 60 * 1000; // 5 minuti
  
  try {
    // 1. Controlla se c'è cache valida
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    
    if (cachedData && cachedTime) {
      const elapsed = Date.now() - parseInt(cachedTime);
      
      if (elapsed < cacheExpiry) {
        console.log('📦 Caricamento da cache (istantaneo)');
        datiCollezione = JSON.parse(cachedData);
        inizializzaFiltri(datiCollezione);
        mostraCollezione(datiCollezione);
        return; // Esce subito
      } else {
        console.log('⏰ Cache scaduta, ricarico...');
      }
    }
    
    // 2. Fetch dal server (prima volta o cache scaduta)
    console.log('🌐 Caricamento dal server...');
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Errore caricamento');
    }
    
    datiCollezione = await response.json();
    
    // 3. Salva in cache
    localStorage.setItem(cacheKey, JSON.stringify(datiCollezione));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    console.log('✅ Dati salvati in cache');
    
    // 4. Mostra dati
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

// INVALIDA CACHE (da chiamare quando serve ricaricare)
function invalidaCache() {
  localStorage.removeItem('collezione-cache');
  localStorage.removeItem('collezione-timestamp');
  console.log('🗑️ Cache invalidata');
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
  
  const categorieSel = [];
  document.querySelectorAll('#categorieCheckboxes input:checked').forEach(checkbox => {
    categorieSel.push(checkbox.value);
  });
  
  const datiFiltrati = JSON.parse(JSON.stringify(datiCollezione));
  
  const risultato = datiFiltrati.filter(categoria => {
    if (!categorieSel.includes(categoria._id)) return false;
    
    categoria.lattine = categoria.lattine.filter(lattina => {
      const nomeLattinaMatch = lattina.nome.toLowerCase().includes(ricerca);
      
      if (nomeLattinaMatch && !ricerca) {
        if (filtroStato) {
          lattina.varianti = lattina.varianti.filter(variante => {
            if (filtroStato === 'possedute') return variante.posseduta;
            if (filtroStato === 'mancanti') return !variante.posseduta;
            return true;
          });
        }
        return lattina.varianti.length > 0;
      }
      
      if (nomeLattinaMatch && ricerca) {
        if (filtroStato) {
          lattina.varianti = lattina.varianti.filter(variante => {
            if (filtroStato === 'possedute') return variante.posseduta;
            if (filtroStato === 'mancanti') return !variante.posseduta;
            return true;
          });
        }
        return lattina.varianti.length > 0;
      }
      
      lattina.varianti = lattina.varianti.filter(variante => {
        const nomeVarianteMatch = variante.nome.toLowerCase().includes(ricerca);
        
        if (ricerca && !nomeVarianteMatch) return false;
        
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

// SELEZIONA/DESELEZIONA TUTTE
function selezionatutte() {
  document.querySelectorAll('#categorieCheckboxes input').forEach(checkbox => {
    checkbox.checked = true;
  });
  applicaFiltri();
}

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

// TOGGLE CATEGORIA
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

// TOGGLE VARIANTE (OTTIMIZZATO - non ricarica tutto)
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
      // ✅ Aggiorna SOLO i dati locali, senza ricaricare
      datiCollezione.forEach(categoria => {
        categoria.lattine.forEach(lattina => {
          lattina.varianti.forEach(variante => {
            if (variante._id === varianteId) {
              variante.posseduta = posseduta;
            }
          });
        });
      });
      
      // ✅ Aggiorna SOLO la card della variante
      const varianteCard = checkbox.closest('.variante');
      const toggle = document.getElementById(`toggle-${varianteId}`);
      const toggleInput = toggle.querySelector('input[type="checkbox"]');
      
      if (posseduta) {
        // Aggiungi classe verde
        varianteCard.classList.add('variante-posseduta');
        
        // Abilita toggle
        toggle.classList.remove('disabled');
        toggleInput.disabled = false;
      } else {
        // Rimuovi classe verde
        varianteCard.classList.remove('variante-posseduta');
        
        // Disabilita toggle
        toggle.classList.add('disabled');
        toggleInput.disabled = true;
        
        // Reset a vuota
        toggleInput.checked = false;
        const slider = toggle.querySelector('.slider');
        if (slider) {
          slider.className = 'slider vuota';
        }
        
        // Aggiorna backend
        await cambiaStato(varianteId, false);
      }
      
      // ✅ Aggiorna statistiche in background (senza bloccare)
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


// CAMBIA STATO PIENA/VUOTA (OTTIMIZZATO)
async function cambiaStato(varianteId, isPiena) {
  const stato = isPiena ? 'piena' : 'vuota';
  
  try {
    // ✅ Aggiorna UI SUBITO (ottimistic update)
    const slider = document.querySelector(`#toggle-${varianteId} .slider`);
    if (slider) {
      slider.className = `slider ${stato}`;
    }
    
    // ✅ Poi invia al server
    const response = await fetch(`${API_URL}/collezione/stato/${varianteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stato })
    });
    
    if (response.ok) {
      // Aggiorna dati locali
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
      // ✅ Rollback se errore
      alert('Errore nel cambio stato');
      if (slider) {
        slider.className = `slider ${isPiena ? 'vuota' : 'piena'}`;
      }
      const toggleInput = document.querySelector(`#toggle-${varianteId} input[type="checkbox"]`);
      if (toggleInput) {
        toggleInput.checked = !isPiena;
      }
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nel cambio stato');
    // Rollback
    if (slider) {
      slider.className = `slider ${isPiena ? 'vuota' : 'piena'}`;
    }
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

// MODAL IMMAGINI
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    chiudiModalImmagine();
  }
});
