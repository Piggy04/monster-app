let token = localStorage.getItem('token');
let datiCollezione = [];

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOMContentLoaded');

  // UTENTE
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    let badgeHtml = '';
    if (ruolo === 'admin') badgeHtml = '<span class="role-badge role-admin">ADMIN</span>';
    else if (ruolo === 'beta') badgeHtml = '<span class="role-badge role-beta">BETA TESTER</span>';
    nomeElement.innerHTML = `Ciao, ${username}! ${badgeHtml}`;
  }

  // ADMIN LINKS
  if (ruolo === 'admin') {
    ['linkAdmin', 'linkUsers', 'linkLogAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }

  // SCROLL TO TOP
  const scrollBtn = document.getElementById('scrollToTop');
  if (scrollBtn) {
    console.log('✅ Scroll button OK');
    scrollBtn.style.display = 'none';
    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    scrollBtn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
  }

  // PWA INSTALL
  const installButton = document.getElementById('installButton');
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ App installabile!');
    e.preventDefault();
    deferredPrompt = e;
    if (installButton) installButton.style.display = 'block';
  });

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Utente ha scelto: ${outcome}`);
      deferredPrompt = null;
      installButton.style.display = 'none';
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('✅ App installata!');
    if (installButton) installButton.style.display = 'none';
    deferredPrompt = null;
  });

  caricaTema();
  caricaCollezione();
  caricaStatistiche();
});

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA COLLEZIONE CON CACHE
async function caricaCollezione() {
  const cacheKey = 'collezione-cache';
  const cacheTimeKey = 'collezione-timestamp';
  const cacheExpiry = 5 * 60 * 1000; // 5 minuti
  
  try {
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    
    if (cachedData && cachedTime) {
      const elapsed = Date.now() - parseInt(cachedTime);
      
      if (elapsed < cacheExpiry) {
        console.log('📦 Caricamento da cache (istantaneo)');
        datiCollezione = JSON.parse(cachedData);
        inizializzaFiltri(datiCollezione);
        mostraCollezione(datiCollezione);
        return;
      } else {
        console.log('⏰ Cache scaduta, ricarico...');
      }
    }
    
    console.log('🌐 Caricamento dal server...');
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Errore caricamento');
    
    datiCollezione = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(datiCollezione));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    console.log('✅ Dati salvati in cache');
    
    inizializzaFiltri(datiCollezione);
    mostraCollezione(datiCollezione);
  } catch (errore) {
    console.error('Errore:', errore);
    const container = document.getElementById('collezioneContainer');
    if (container) container.innerHTML = '<p>Errore nel caricamento della collezione</p>';
  }
}

function invalidaCache() {
  localStorage.removeItem('collezione-cache');
  localStorage.removeItem('collezione-timestamp');
  console.log('🗑️ Cache invalidata');
}

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
  <div class="variante ${classPosseduta}" data-id="${variante._id}">
    <!-- NOME IN ALTO -->
    <div class="variante-nome">${variante.nome}</div>
    
    <!-- IMMAGINE CENTRATA -->
    <div class="variante-immagine">
      ${imgHtml}
    </div>
    
    <!-- SPUNTA SOPRA SWITCH -->
    <div class="variante-checkbox">
      <input type="checkbox" id="check-${variante._id}" ${checked} onchange="toggleVariante('${variante._id}')">
      <label for="check-${variante._id}">Posseduta</label>
    </div>
    
    <!-- SWITCH VUOTA/PIENA SOTTO -->
    <div class="variante-switch">
      <div class="stato-toggle ${disabledToggle}" id="toggle-${variante._id}">
        <label class="switch">
          <input type="checkbox" ${variante.stato === 'piena' ? 'checked' : ''} ${disabledToggle} onchange="cambiaStato('${variante._id}', this.checked)">
          <span class="slider ${statoToggle}"></span>
        </label>
      </div>
    </div>
  </div>
`;



      });

            htmlLattine += `
        <div class="lattina">
          <h3>${lattina.nome}</h3>
          <div class="varianti-shelf-wrapper">
            <div class="varianti-shelf">
              ${htmlVarianti}
            </div>
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
      datiCollezione.forEach(categoria => {
        categoria.lattine.forEach(lattina => {
          lattina.varianti.forEach(variante => {
            if (variante._id === varianteId) {
              variante.posseduta = posseduta;
            }
          });
        });
      });
      
      const varianteCard = checkbox.closest('.variante');
      const toggle = document.getElementById(`toggle-${varianteId}`);
      const toggleInput = toggle.querySelector('input[type="checkbox"]');
      
      if (posseduta) {
        varianteCard.classList.add('variante-posseduta');
        toggle.classList.remove('disabled');
        toggleInput.disabled = false;
      } else {
        varianteCard.classList.remove('variante-posseduta');
        toggle.classList.add('disabled');
        toggleInput.disabled = true;
        toggleInput.checked = false;
        const slider = toggle.querySelector('.slider');
        if (slider) {
          slider.className = 'slider vuota';
        }
        await cambiaStato(varianteId, false);
      }
      
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

async function cambiaStato(varianteId, isPiena) {
  const stato = isPiena ? 'piena' : 'vuota';
  
  try {
    const slider = document.querySelector(`#toggle-${varianteId} .slider`);
    if (slider) {
      slider.className = `slider ${stato}`;
    }
    
    const response = await fetch(`${API_URL}/collezione/stato/${varianteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stato })
    });
    
    if (response.ok) {
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
    if (slider) {
      slider.className = `slider ${isPiena ? 'vuota' : 'piena'}`;
    }
    const toggleInput = document.querySelector(`#toggle-${varianteId} input[type="checkbox"]`);
    if (toggleInput) {
      toggleInput.checked = !isPiena;
    }
  }
}

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


if (['admin', 'beta'].includes(utente?.ruolo)) {
  document.getElementById('linkBevute').style.display = 'block';
  document.getElementById('linkAdmin').style.display = 'block';
}
