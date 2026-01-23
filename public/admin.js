console.log('ADMIN.JS LOADED');

const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');

if (!token) window.location.href = 'index.html';

let categorie = [];
let datiGestioneOriginali = [];

// ===== MOSTRA TAB =====
function mostraTab(tab) {
  console.log('mostraTab:', tab);
  
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  
  if (tab === 'aggiungi') {
    document.querySelectorAll('.admin-tab')[0].classList.add('active');
    document.getElementById('tabAggiungi').style.display = 'block';
  } 
  else if (tab === 'gestisci') {
    document.querySelectorAll('.admin-tab')[1].classList.add('active');
    document.getElementById('tabGestisci').style.display = 'block';
    caricaGestione();
  }
}

// ===== CARICA GESTIONE =====
async function caricaGestione() {
  const container = document.getElementById('gestioneContainer');
  container.innerHTML = '<p style="text-align:center;padding:40px;">⏳ Caricamento...</p>';
  
  try {
    const res = await fetch(API_URL + '/collezione/completa', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!res.ok) throw new Error('Errore ' + res.status);
    
    const datiGerarchici = await res.json();
    
    const datiFlat = [];
    
    datiGerarchici.forEach(categoria => {
      datiFlat.push({
        _id: categoria._id,
        tipo: 'categoria',
        nome: categoria.nome,
        ordine: categoria.ordine || 0
      });
      
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
          
          if (lattina.varianti) {
            lattina.varianti.forEach(variante => {
              datiFlat.push({
                _id: variante._id,
                tipo: 'variante',
                nome: variante.nome,
                ordine: variante.ordine || 0,
                categoria_id: categoria._id,
                categoria: { nome: categoria.nome },
                lattina_id: lattina._id,
                lattina: { nome: lattina.nome }
              });
            });
          }
        });
      }
    });
    
    console.log('Dati flat:', datiFlat.length);
    
    datiGestioneOriginali = datiFlat;
    
    popolaFiltroCategorie(datiFlat);
    mostraGestione(datiFlat);
    
  } catch(e) {
    console.error('Errore:', e);
    container.innerHTML = '<p class="no-results">❌ ' + e.message + '</p>';
  }
}

// ===== POPOLA FILTRO CATEGORIE =====
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

// ===== FILTRO ADMIN =====
function filtraAdmin() {
  const ricerca = document.getElementById('ricercaAdmin').value.toLowerCase().trim();
  const tipo = document.getElementById('filtroTipo').value;
  const categoriaId = document.getElementById('filtroCategoriaAdmin').value;
  
  let risultato = datiGestioneOriginali.slice();
  
  // Filtro per tipo
  if (tipo !== 'tutti') {
    risultato = risultato.filter(item => item.tipo === tipo);
  }
  
  // Filtro per categoria
  if (categoriaId) {
    risultato = risultato.filter(item => {
      if (item.tipo === 'categoria') return item._id === categoriaId;
      return item.categoria_id === categoriaId;
    });
  }
  
  // ✅ RICERCA INTELLIGENTE: cerca nel nome, categoria padre e lattina padre
  if (ricerca) {
    risultato = risultato.filter(item => {
      const nomeMatch = item.nome.toLowerCase().includes(ricerca);
      const categoriaMatch = item.categoria && item.categoria.nome.toLowerCase().includes(ricerca);
      const lattinaMatch = item.lattina && item.lattina.nome.toLowerCase().includes(ricerca);
      
      return nomeMatch || categoriaMatch || lattinaMatch;
    });
  }
  
  console.log('Filtrati:', risultato.length, 'elementi');
  mostraGestione(risultato);
}


function mostraGestione(dati) {
  const container = document.getElementById('gestioneContainer');
  
  if (!dati || dati.length === 0) {
    container.innerHTML = '<p class="no-results">🔍 Nessun risultato</p>';
    return;
  }
  
  let html = '';
  
  dati.forEach(item => {
    const icona = {
      'categoria': '📁',
      'lattina': '🥤',
      'variante': '🎨'
    }[item.tipo] || '📦';
    
    let infoParent = '';
    if (item.tipo === 'lattina' && item.categoria) {
      infoParent = '<span class="parent-info">📁 ' + item.categoria.nome + '</span>';
    } else if (item.tipo === 'variante' && item.categoria && item.lattina) {
      infoParent = '<span class="parent-info">📁 ' + item.categoria.nome + ' → 🥤 ' + item.lattina.nome + '</span>';
    }
    
    html += '<div class="gestione-item ' + item.tipo + '">';
    html += '<div class="gestione-header">';
    html += '<div class="gestione-title">';
    html += '<span class="tipo-icon">' + icona + '</span>';
    html += '<h4>' + item.nome + '</h4>';
    html += '<span class="ordine-badge">ord: ' + item.ordine + '</span>';
    html += '</div>';
    html += '<div class="gestione-actions">';
    html += '<button class="btn-edit btn-icon" onclick="modificaItem(\'' + item._id + '\', \'' + item.nome.replace(/'/g, "\\'") + '\', ' + item.ordine + ', \'' + item.tipo + '\')" title="Modifica">✏️</button>';
    html += '<button class="btn-delete btn-icon" onclick="eliminaItem(\'' + item._id + '\', \'' + item.tipo + '\')" title="Elimina">🗑️</button>';
    html += '</div>';
    html += '</div>';
    if (infoParent) {
      html += '<div class="gestione-meta">' + infoParent + '</div>';
    }
    html += '</div>';
  });
  
  container.innerHTML = html;
}

async function eliminaItem(id, tipo) {
  if (!confirm('Elimina ' + tipo + '?')) return;
  
  try {
    const res = await fetch(API_URL + '/collezione/' + tipo + '/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      alert('✅ Eliminato!');
      caricaGestione();
      caricaCategorie();
    } else {
      alert('❌ Errore eliminazione');
    }
  } catch(e) {
    alert('❌ Errore: ' + e.message);
  }
}

// ===== MODAL MODIFICA =====
async function modificaItem(id, nome, ordine, tipo) {
  document.getElementById('modificaId').value = id;
  document.getElementById('modificaTipo').value = tipo;
  document.getElementById('modificaNome').value = nome;
  document.getElementById('modificaOrdine').value = ordine;
  document.getElementById('modalTitolo').textContent = 'Modifica ' + tipo;
  
  const uploadForm = document.getElementById('uploadForm');
  const campiNutrizionali = document.getElementById('campiNutrizionali');
  
  // Se è una variante, mostra campi extra
  if (tipo === 'variante') {
    uploadForm.style.display = 'block';
    campiNutrizionali.style.display = 'block';
    
    // Carica dati completi della variante
    try {
      const res = await fetch(API_URL + '/collezione/' + tipo + '/' + id, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (res.ok) {
        const variante = await res.json();
        
        document.getElementById('uploadImage').value = variante.immagine || '';
        document.getElementById('modificaCaffeina').value = variante.caffeina_mg || 0;
        document.getElementById('modificaCalorie').value = variante.calorie_kcal || 0;
        document.getElementById('modificaZuccheri').value = variante.zuccheri_g || 0;
        
        const preview = document.getElementById('previewImage');
        if (variante.immagine) {
          preview.src = variante.immagine;
          preview.style.display = 'block';
        } else {
          preview.style.display = 'none';
        }
      }
    } catch(e) {
      console.error('Errore caricamento variante:', e);
    }
  } else {
    uploadForm.style.display = 'none';
    campiNutrizionali.style.display = 'none';
  }
  
  document.getElementById('modalModifica').style.display = 'block';
}


function chiudiModal() {
  document.getElementById('modalModifica').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modalModifica');
  if (event.target === modal) chiudiModal();
};

async function salvaImmagine() {
  const varianteId = document.getElementById('modificaId').value;
  const immagineUrl = document.getElementById('uploadImage').value.trim();
  const preview = document.getElementById('previewImage');
  
  if (!immagineUrl) return alert('Inserisci un URL immagine');
  
  const img = new Image();
  img.onload = async function() {
    try {
      const res = await fetch(API_URL + '/collezione/variante/' + varianteId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ immagine: immagineUrl })
      });
      
      if (res.ok) {
        preview.src = immagineUrl;
        preview.style.display = 'block';
        alert('✅ Immagine salvata!');
        caricaGestione();
      } else {
        alert('❌ Errore salvataggio');
      }
    } catch(e) {
      alert('❌ Errore: ' + e.message);
    }
  };
  
  img.onerror = function() {
    preview.style.display = 'none';
    alert('❌ URL non valido');
  };
  
  img.src = immagineUrl;
}



// ===== CARICA CATEGORIE =====
async function caricaCategorie() {
  try {
    const res = await fetch(API_URL + '/collezione/completa', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!res.ok) return;
    
    categorie = await res.json();
    
    const sel1 = document.getElementById('categoriaLattina');
    const sel2 = document.getElementById('categoriaVariante');
    
    if (sel1) {
      sel1.innerHTML = '<option value="">Seleziona categoria</option>';
      categorie.forEach(c => sel1.innerHTML += '<option value="' + c._id + '">' + c.nome + '</option>');
    }
    
    if (sel2) {
      sel2.innerHTML = '<option value="">Seleziona categoria</option>';
      categorie.forEach(c => sel2.innerHTML += '<option value="' + c._id + '">' + c.nome + '</option>');
    }
  } catch(e) {
    console.error(e);
  }
}

function caricaLattineVariante() {
  const catId = document.getElementById('categoriaVariante').value;
  const sel = document.getElementById('lattinaVariante');
  
  if (!catId) {
    sel.innerHTML = '<option value="">Prima seleziona categoria</option>';
    return;
  }
  
  const cat = categorie.find(c => c._id === catId);
  sel.innerHTML = '<option value="">Seleziona lattina</option>';
  
  if (cat && cat.lattine) {
    cat.lattine.forEach(l => sel.innerHTML += '<option value="' + l._id + '">' + l.nome + '</option>');
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  if (ruolo !== 'admin') {
    document.getElementById('accessoNegato').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
  } else {
    caricaCategorie();
  }
});

// ===== FORM MODIFICA =====
document.getElementById('formModifica').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('modificaId').value;
  const tipo = document.getElementById('modificaTipo').value;
  const nome = document.getElementById('modificaNome').value.trim();
  const ordine = parseInt(document.getElementById('modificaOrdine').value) || 0;
  
  if (!nome) return alert('Inserisci un nome');
  
  const body = { nome: nome, ordine: ordine };
  
  // Se è una variante, aggiungi valori nutrizionali
  if (tipo === 'variante') {
    body.caffeina_mg = parseFloat(document.getElementById('modificaCaffeina').value) || 0;
    body.calorie_kcal = parseFloat(document.getElementById('modificaCalorie').value) || 0;
    body.zuccheri_g = parseFloat(document.getElementById('modificaZuccheri').value) || 0;
  }
  
  try {
    const res = await fetch(API_URL + '/collezione/' + tipo + '/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      alert('✅ Modifiche salvate!');
      chiudiModal();
      caricaGestione();
      caricaCategorie();
    } else {
      alert('❌ Errore salvataggio');
    }
  } catch(e) {
    alert('❌ Errore: ' + e.message);
  }
});


console.log('ADMIN.JS COMPLETE');
