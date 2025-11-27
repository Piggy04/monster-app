const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'index.html';
}

let categorie = [];
let datiGestioneOriginali = []; // Dati flat per filtri

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

  caricaTema();
  if (ruolo === 'admin') {
    caricaCategorie();
  }
});

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

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

// ===== GESTIONE (tab Gestisci) =====
async function caricaGestione() {
  try {
    const response = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const datiGerarchici = await response.json(); // [categorie] con [lattine] con [varianti]
    
    const datiFlat = [];
    
    datiGerarchici.forEach(categoria => {
      // Categoria
      datiFlat.push({
        _id: categoria._id,
        tipo: 'categoria',
        nome: categoria.nome,
        ordine: categoria.ordine || 0
      });
      
      // Lattine
      if (categoria.lattine) {
        categoria.lattine.forEach(lattina => {
          datiFlat.push({
            _id: lattina._id,
            tipo: 'lattina',
            nome: lattina.nome,
            ordine: lattina.ordine || 0,
            categoria_id: categoria._id,
            categoria: { nome: categoria.nome }
          });
          
          // Varianti
          if (lattina.varianti) {
            lattina.varianti.forEach(variante => {
              datiFlat.push({
                _id: variante._id,
                tipo: 'variante',
                nome: variante.nome,
                ordine: variante.ordine || 0,
                categoria_id: categoria._id,
                categoria: { nome: categoria.nome }
              });
            });
          }
        });
      }
    });
    
    datiGestioneOriginali = datiFlat;
    
    popolaFiltroCategorie(datiFlat);
    mostraGestione(datiFlat);
    
  } catch (errore) {
    console.error('Errore caricaGestione:', errore);
    document.getElementById('gestioneContainer').innerHTML =
      '<p>❌ Errore: ' + errore.message + '</p>';
  }
}

function popolaFiltroCategorie(dati) {
  const select = document.getElementById('filtroCategoriaAdmin');
  if (!select) return;
  
  select.innerHTML = '<option value="">Tutte le categorie</option>';
  
  const categorie = dati.filter(item => item.tipo === 'categoria');
  categorie.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat._id;
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

function filtraAdmin() {
  const ricerca = document.getElementById('ricercaAdmin')?.value.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipo')?.value || 'tutti';
  const categoriaId = document.getElementById('filtroCategoriaAdmin')?.value || '';
  
  let risultato = [...datiGestioneOriginali];
  
  if (tipo !== 'tutti') {
    risultato = risultato.filter(item => item.tipo === tipo);
  }
  
  if (categoriaId) {
    risultato = risultato.filter(item => {
      if (item.tipo === 'categoria') return item._id === categoriaId;
      return item.categoria_id === categoriaId;
    });
  }
  
  if (ricerca) {
    risultato = risultato.filter(item =>
      item.nome?.toLowerCase().includes(ricerca)
    );
  }
  
  mostraGestione(risultato);
}

function mostraGestione(dati) {
  const container = document.getElementById('gestioneContainer');
  
  if (!dati || dati.length === 0) {
    container.innerHTML = '<p>Nessun risultato trovato</p>';
    return;
  }
  
  let html = '';
  dati.forEach(item => {
    html += `
      <div class="gestione-item ${item.tipo}">
        <h4>${item.nome} <small>(ord: ${item.ordine})</small></h4>
        <p><strong>Tipo:</strong> ${item.tipo}</p>
        ${item.categoria_id ? `<p><strong>Categoria:</strong> ${item.categoria?.nome || 'N/D'}</p>` : ''}
        <div class="gestione-actions">
          <button class="btn-edit" onclick="modificaItem('${item._id}', '${item.nome.replace(/'/g, "\\'")}', ${item.ordine}, '${item.tipo}')">✏️</button>
          <button class="btn-delete" onclick="eliminaItem('${item._id}', '${item.tipo}')">🗑️</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ===== FORM AGGIUNGI (tab Aggiungi) =====
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
    console.error('Errore caricamento categorie:', errore);
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

// FORM CATEGORIA
document.getElementById('formCategoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nomeCategoria').value.trim();
  const ordine = parseInt(document.getElementById('ordineCategoria').value) || 0;
  
  if (!nome) return alert('Inserisci un nome categoria');

  try {
    const response = await fetch(`${API_URL}/collezione/categoria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, ordine })
    });
    
    if (response.ok) {
      document.getElementById('successoCategoria').textContent = '✓ Categoria aggiunta!';
      document.getElementById('formCategoria').reset();
      setTimeout(() => {
        document.getElementById('successoCategoria').textContent = '';
        caricaCategorie();
        caricaGestione();
      }, 1500);
    } else {
      alert('Errore nella creazione della categoria');
    }
  } catch (errore) {
    alert('Errore di rete');
  }
});

// FORM LATTINA
document.getElementById('formLattina').addEventListener('submit', async (e) => {
  e.preventDefault();

  const categoriaId = document.getElementById('categoriaLattina').value;
  const nome = document.getElementById('nomeLattina').value.trim();
  const ordine = parseInt(document.getElementById('ordineLattina').value) || 0;

  if (!categoriaId || !nome) return alert('Compila tutti i campi');

  try {
    const response = await fetch(`${API_URL}/collezione/lattina`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ categoriaId, nome, ordine })
    });

    if (response.ok) {
      document.getElementById('successoLattina').textContent = '✓ Lattina aggiunta!';
      document.getElementById('formLattina').reset();
      setTimeout(() => {
        document.getElementById('successoLattina').textContent = '';
        caricaCategorie();
        caricaGestione();
      }, 1500);
    } else {
      alert('Errore nella creazione della lattina');
    }
  } catch (err) {
    alert('Errore di rete');
  }
});

// FORM VARIANTE
document.getElementById('formVariante').addEventListener('submit', async (e) => {
  e.preventDefault();

  const categoriaId = document.getElementById('categoriaVariante').value;
  const lattinaId   = document.getElementById('lattinaVariante').value;
  const nome        = document.getElementById('nomeVariante').value.trim();
  const ordine      = parseInt(document.getElementById('ordineVariante').value) || 0;
  const immagineUrl = document.getElementById('immagineVariante').value.trim() || null;

  if (!categoriaId || !lattinaId || !nome) {
    return alert('Compila tutti i campi obbligatori');
  }

  try {
    const response = await fetch(`${API_URL}/collezione/variante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        categoriaId,
        lattinaId,
        nome,
        ordine,
        immagineUrl
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Errore API variante:', data);
      return alert(data.errore || 'Errore nella creazione della variante');
    }

    document.getElementById('successoVariante').textContent = '✓ Variante aggiunta!';
    document.getElementById('formVariante').reset();
    document.getElementById('lattinaVariante').innerHTML =
      '<option value="">Prima seleziona categoria</option>';
    setTimeout(() => {
      document.getElementById('successoVariante').textContent = '';
      caricaCategorie();
      caricaGestione();
    }, 1500);
  } catch (err) {
    console.error('Errore di rete variante:', err);
    alert('Errore di rete');
  }
});

// ===== MODAL MODIFICA / ELIMINA =====
function modificaItem(id, nome, ordine, tipo) {
  document.getElementById('modificaId').value = id;
  document.getElementById('modificaTipo').value = tipo;
  document.getElementById('modificaNome').value = nome;
  document.getElementById('modificaOrdine').value = ordine;
  document.getElementById('modalTitolo').textContent = `Modifica ${tipo}`;
  
  if (tipo === 'variante') {
    document.getElementById('uploadForm').style.display = 'block';
  } else {
    document.getElementById('uploadForm').style.display = 'none';
  }
  
  document.getElementById('modalModifica').style.display = 'block';
}

function chiudiModal() {
  document.getElementById('modalModifica').style.display = 'none';
}

async function eliminaItem(id, tipo) {
  if (!confirm(`Elimina ${tipo}?`)) return;
  
  try {
    const response = await fetch(`${API_URL}/collezione/${tipo}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      caricaGestione();
      caricaCategorie();
    }
  } catch (errore) {
    alert('Errore');
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('modalModifica');
  if (event.target === modal) chiudiModal();
};
