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
    mostraGestione(datiFlat);
    
  } catch(e) {
    console.error('Errore:', e);
    container.innerHTML = '<p class="no-results">❌ ' + e.message + '</p>';
  }
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
    html += '<button class="btn-edit btn-icon" onclick="alert(\'Modifica: ' + item.nome + '\')" title="Modifica">✏️</button>';
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

console.log('ADMIN.JS COMPLETE');
