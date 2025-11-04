const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.getElementById('nomeUtente').textContent = `Ciao, ${username}!`;

if (ruolo === 'admin') {
  document.getElementById('linkAdmin').style.display = 'block';
  document.getElementById('linkUsers').style.display = 'block';
}


function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

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
    document.getElementById('collezioneContainer').innerHTML = '<p>Errore nel caricamento</p>';
  }
}

function mostraCollezione(categorie) {
  const container = document.getElementById('collezioneContainer');
  
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
  } catch (errore) {
    alert('Errore nell\'aggiornamento');
  }
}

caricaCollezione();

async function caricaStatistiche() {
  try {
    const response = await fetch(`${API_URL}/statistiche`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('mostriPosseduti').textContent = data.mostriPosseduti;
      document.getElementById('mostriTotali').textContent = data.mostriTotali;
      document.getElementById('variantiTotali').textContent = data.variantiTotali;
      document.getElementById('percentuale').textContent = data.percentuale + '%';
      document.getElementById('progressFill').style.width = data.percentuale + '%';
    }
  } catch (err) {
    console.error('Errore caricamento statistiche', err);
  }
}

// Chiama al caricamento della pagina
caricaStatistiche();

