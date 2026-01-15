let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  caricaTema(); // ← Usa theme.js
  mostraCollezioneAmico();
});

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
async function mostraCollezioneAmico() {
  const params = new URLSearchParams(window.location.search);
  const amicoId = params.get('amico');
  const amicoUsername = params.get('username');

  if (!amicoId || !amicoUsername) {
    alert('Errore: ID amico non trovato');
    window.location.href = 'amici.html';
    return;
  }

  try {
    const [collezione, statistiche] = await Promise.all([
      fetch(`${API_URL}/collezione/amico/${amicoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API_URL}/statistiche/${amicoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]);

    document.getElementById('nomeAmico').textContent = amicoUsername;

    document.querySelectorAll('.stat-card-amico')[0].querySelector('.stat-value').textContent = statistiche.mostriPosseduti;
    document.querySelectorAll('.stat-card-amico')[1].querySelector('.stat-value').textContent = statistiche.variantiPosseduti;
    document.querySelectorAll('.stat-card-amico')[2].querySelector('.stat-value').textContent = statistiche.percentuale + '%';

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
  } catch (err) {
    console.error('Errore caricamento:', err);
    alert('Errore nel caricamento della collezione');
  }
}


if (['admin', 'beta'].includes(utente?.ruolo)) {
  document.getElementById('linkBevute').style.display = 'block';
  document.getElementById('linkAdmin').style.display = 'block';
}
