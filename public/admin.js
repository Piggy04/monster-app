const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo !== 'admin') {
    const accessoNegato = document.getElementById('accessoNegato');
    const adminContent = document.getElementById('adminContent');
    if (accessoNegato) accessoNegato.style.display = 'block';
    if (adminContent) adminContent.style.display = 'none';
  }

  caricaTema(); // ← Usa theme.js
  if (ruolo === 'admin') {
    caricaCategorie();
  }
});

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

let categorie = [];

function mostraTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  
  if (tab === 'aggiungi') {
    document.querySelectorAll('.admin-tab')[0].classList.add('active');
    document.getElementById('tabAggiungi').style.display = 'block';
  } else if (tab === 'gestisci') {
    document.querySelectorAll('.admin-tab')[1].classList.add('active');
    document.getElementById('tabGestisci').style.display = 'block';
    caricaGestione();
  }
}

async function caricaCategorie() {
  try {
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Errore');
    
    categorie = await response.json();
    
    const selectCategoriaLattina = document.getElementById('categoriaLattina');
    const selectCategoriaVariante = document.getElementById('categoriaVariante');
    
    selectCategoriaLattina.innerHTML = '<option value="">Seleziona categoria</option>';
    selectCategoriaVariante.innerHTML = '<option value="">Seleziona categoria</option>';
    
    categorie.forEach(cat => {
      selectCategoriaLattina.innerHTML += `<option value="${cat._id}">${cat.nome}</option>`;
      selectCategoriaVariante.innerHTML += `<option value="${cat._id}">${cat.nome}</option>`;
    });
    
  } catch (errore) {
    console.error('Errore caricamento categorie');
  }
}

function caricaLattineVariante() {
  const categoriaId = document.getElementById('categoriaVariante').value;
  const selectLattina = document.getElementById('lattinaVariante');
  
  if (!categoriaId) {
    selectLattina.innerHTML = '<option value="">Prima seleziona categoria</option>';
    return;
  }
  
  const categoria = categorie.find(c => c._id === categoriaId);
  
  selectLattina.innerHTML = '<option value="">Seleziona lattina</option>';
  
  if (categoria && categoria.lattine) {
    categoria.lattine.forEach(latt => {
      selectLattina.innerHTML += `<option value="${latt._id}">${latt.nome}</option>`;
    });
  }
}

document.getElementById('formCategoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('nomeCategoria').value;
  const ordine = document.getElementById('ordineCategoria').value;
  
  try {
    const response = await fetch(`${API_URL}/collezione/categoria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, ordine: parseInt(ordine) })
    });
    
    if (response.ok) {
      document.getElementById('successoCategoria').textContent = '✓ Categoria aggiunta!';
      document.getElementById('formCategoria').reset();
      setTimeout(() => {
        document.getElementById('successoCategoria').textContent = '';
        caricaCategorie();
      }, 2000);
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiunta');
    }
  } catch (errore) {
    alert('Errore nell\'aggiunta');
  }
});

document.getElementById('formLattina').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const categoria_id = document.getElementById('categoriaLattina').value;
  const nome = document.getElementById('nomeLattina').value;
  const ordine = document.getElementById('ordineLattina').value;
  
  try {
    const response = await fetch(`${API_URL}/collezione/lattina`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ categoria_id, nome, ordine: parseInt(ordine) })
    });
    
    if (response.ok) {
      document.getElementById('successoLattina').textContent = '✓ Lattina aggiunta!';
      document.getElementById('formLattina').reset();
      setTimeout(() => {
        document.getElementById('successoLattina').textContent = '';
        caricaCategorie();
      }, 2000);
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiunta');
    }
  } catch (errore) {
    alert('Errore nell\'aggiunta');
  }
});

document.getElementById('formVariante').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const lattina_id = document.getElementById('lattinaVariante').value;
  const nome = document.getElementById('nomeVariante').value;
  const ordine = document.getElementById('ordineVariante').value;
  const immagine = document.getElementById('immagineVariante').value.trim() || null;
  
  try {
    const response = await fetch(`${API_URL}/collezione/variante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lattina_id, nome, ordine: parseInt(ordine), immagine })
    });
    
    if (response.ok) {
      document.getElementById('successoVariante').textContent = '✓ Variante aggiunta!';
      document.getElementById('formVariante').reset();
      setTimeout(() => {
        document.getElementById('successoVariante').textContent = '';
        caricaCategorie();
      }, 2000);
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiunta');
    }
  } catch (errore) {
    alert('Errore nell\'aggiunta');
  }
});

async function caricaGestione() {
  try {
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Errore');
    
    const dati = await response.json();
    mostraGestione(dati);
    
  } catch (errore) {
    document.getElementById('gestioneContainer').innerHTML = '<p>Errore nel caricamento</p>';
  }
}

function mostraGestione(categorie) {
  const container = document.getElementById('gestioneContainer');
  
  if (categorie.length === 0) {
    container.innerHTML = '<p>Nessun dato presente</p>';
    return;
  }
  
  container.innerHTML = '';
  
  categorie.forEach(categoria => {
    let htmlLattine = '';
    
    categoria.lattine.forEach(lattina => {
      let htmlVarianti = '';
      
      lattina.varianti.forEach(variante => {
        htmlVarianti += `
          <div class="gestione-variante">
            <span>${variante.nome} (ord: ${variante.ordine})</span>
            <div class="btn-group">
              <button class="btn-mini btn-edit" onclick="modificaItem('${variante._id}', '${variante.nome}', ${variante.ordine}, 'variante')">✏️ Modifica</button>
              <button class="btn-mini btn-delete" onclick="eliminaItem('${variante._id}', 'variante')">🗑️ Elimina</button>
            </div>
          </div>
        `;
      });
      
      htmlLattine += `
        <div class="gestione-lattina">
          <h4>
            <span>${lattina.nome} (ord: ${lattina.ordine})</span>
            <div class="btn-group">
              <button class="btn-mini btn-edit" onclick="modificaItem('${lattina._id}', '${lattina.nome}', ${lattina.ordine}, 'lattina')">✏️ Modifica</button>
              <button class="btn-mini btn-delete" onclick="eliminaItem('${lattina._id}', 'lattina')">🗑️ Elimina</button>
            </div>
          </h4>
          ${htmlVarianti}
        </div>
      `;
    });
    
    const divCategoria = document.createElement('div');
    divCategoria.className = 'gestione-categoria';
    divCategoria.innerHTML = `
      <h3>
        <span>${categoria.nome} (ord: ${categoria.ordine})</span>
        <div class="btn-group">
          <button class="btn-mini btn-edit" onclick="modificaItem('${categoria._id}', '${categoria.nome}', ${categoria.ordine}, 'categoria')">✏️ Modifica</button>
          <button class="btn-mini btn-delete" onclick="eliminaItem('${categoria._id}', 'categoria')">🗑️ Elimina</button>
        </div>
      </h3>
      ${htmlLattine}
    `;
    
    container.appendChild(divCategoria);
  });
}

// MODIFICA ITEM
function modificaItem(id, nome, ordine, tipo) {
  document.getElementById('modificaId').value = id;
  document.getElementById('modificaTipo').value = tipo;
  document.getElementById('modificaNome').value = nome;
  document.getElementById('modificaOrdine').value = ordine;
  document.getElementById('modalTitolo').textContent = `Modifica ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  
  // Mostra form URL per varianti
  if (tipo === 'variante') {
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('uploadImage').value = '';
  } else {
    document.getElementById('uploadForm').style.display = 'none';
  }
  
  document.getElementById('modalModifica').style.display = 'block';
}

function chiudiModal() {
  document.getElementById('modalModifica').style.display = 'none';
}

document.getElementById('formModifica').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('modificaId').value;
  const tipo = document.getElementById('modificaTipo').value;
  const nome = document.getElementById('modificaNome').value;
  const ordine = document.getElementById('modificaOrdine').value;
  
  try {
    const response = await fetch(`${API_URL}/collezione/${tipo}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, ordine: parseInt(ordine) })
    });
    
    if (response.ok) {
      chiudiModal();
      caricaGestione();
      caricaCategorie();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore aggiornamento');
    }
  } catch (errore) {
    alert('Errore aggiornamento');
  }
});

// CARICA IMMAGINE (tramite URL)
async function caricaImmagine() {
  const urlInput = document.getElementById('uploadImage');
  const varianteId = document.getElementById('modificaId').value;
  const tipo = document.getElementById('modificaTipo').value;
  const urlImmagine = urlInput.value.trim();
  
  if (tipo !== 'variante') {
    alert('URL immagine disponibile solo per varianti');
    return;
  }
  
  if (!urlImmagine) {
    alert('Inserisci un URL valido');
    return;
  }
  
  // Valida che sia un URL
  try {
    new URL(urlImmagine);
  } catch (err) {
    alert('Inserisci un URL valido (es: https://esempio.com/immagine.png)');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/collezione/variante/${varianteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ immagine: urlImmagine })
    });
    
    if (response.ok) {
      const preview = document.getElementById('previewImage');
      preview.src = urlImmagine;
      preview.style.display = 'block';
      alert('✓ Immagine salvata!');
      setTimeout(() => {
        chiudiModal();
        caricaGestione();
      }, 1500);
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore salvataggio');
    }
  } catch (errore) {
    alert('Errore salvataggio immagine');
  }
}

async function eliminaItem(id, tipo) {
  if (!confirm(`Sei sicuro di voler eliminare questo ${tipo}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/collezione/${tipo}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      caricaGestione();
      caricaCategorie();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore eliminazione');
    }
  } catch (errore) {
    alert('Errore eliminazione');
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('modalModifica');
  if (event.target === modal) {
    chiudiModal();
  }
}
