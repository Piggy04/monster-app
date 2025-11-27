const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'index.html';
}

let categorie = [];
let datiGestioneOriginali = []; // ← Dati per filtri

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
    caricaGestione(); // ← Chiama QUI
  }
}

// ✅ CARICA GESTIONE CORRETTA (UNICA)
async function caricaGestione() {
  try {
    console.log('🔄 Caricamento gestione...');
    const response = await fetch(`${API_URL}/admin/gestione`, { // ← Endpoint ADMIN specifico
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const dati = await response.json();
    datiGestioneOriginali = [...dati]; // ← Salva per filtri
    console.log('✅ Dati caricati:', dati.length, 'elementi');
    
    popolaFiltroCategorie(dati);
    mostraGestione(dati);
    
  } catch (errore) {
    console.error('❌ Errore caricaGestione:', errore);
    document.getElementById('gestioneContainer').innerHTML = '<p>❌ Errore caricamento: ' + errore.message + '</p>';
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

// ✅ FILTRI FUNZIONANTI
function filtraAdmin() {
  const ricerca = document.getElementById('ricercaAdmin')?.value.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipo')?.value || 'tutti';
  const categoriaId = document.getElementById('filtroCategoriaAdmin')?.value || '';
  
  let risultato = [...datiGestioneOriginali];
  
  // Filtro tipo
  if (tipo !== 'tutti') {
    risultato = risultato.filter(item => item.tipo === tipo);
  }
  
  // Filtro categoria
  if (categoriaId) {
    risultato = risultato.filter(item => {
      if (item.tipo === 'categoria') return item._id === categoriaId;
      return item.categoria_id === categoriaId;
    });
  }
  
  // Filtro testo
  if (ricerca) {
    risultato = risultato.filter(item => 
      item.nome?.toLowerCase().includes(ricerca)
    );
  }
  
  mostraGestione(risultato);
}

// ✅ MOSTRA GESTIONE (adatta a struttura flat)
function mostraGestione(dati) {
  const container = document.getElementById('gestioneContainer');
  
  if (dati.length === 0) {
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
          <button class="btn-edit" onclick="modificaItem('${item._id}', '${item.nome}', ${item.ordine}, '${item.tipo}')">✏️</button>
          <button class="btn-delete" onclick="eliminaItem('${item._id}', '${item.tipo}')">🗑️</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ===== FUNZIONI FORM AGGIUNGI (invariate) =====
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

// Form handlers (invariati - abbrevio per spazio)
document.getElementById('formCategoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nomeCategoria').value;
  const ordine = document.getElementById('ordineCategoria').value;
  
  try {
    const response = await fetch(`${API_URL}/collezione/categoria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      alert('Errore');
    }
  } catch (errore) {
    alert('Errore');
  }
});

// ... [altri form handlers invariati - stesso pattern per lattina e variante] ...

// MODAL + ELIMINA (invariati)
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
