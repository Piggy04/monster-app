const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const username = localStorage.getItem('username');
const API_URL = 'https://monster-app-ocdj.onrender.com/api';

if (!token) {
  window.location.href = 'index.html';
}

let categorie = [];
let datiGestioneOriginali = [];

console.log('✅ admin.js caricato - inizio');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOMContentLoaded admin');
  
  if (ruolo !== 'admin') {
    document.getElementById('accessoNegato').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
  } else {
    caricaCategorie();
  }
});

// ===== MOSTRA TAB =====
function mostraTab(tab) {
  console.log('🔵 mostraTab:', tab);
  
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

// ===== CARICA GESTIONE =====
async function caricaGestione() {
  console.log('🔵 caricaGestione chiamata');
  
  const container = document.getElementById('gestioneContainer');
  container.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ Caricamento...</p>';
  
  try {
    const res = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const dati = await res.json();
    console.log('✅ Dati caricati:', dati.length, 'categorie');
    
    container.innerHTML = '<p class="no-results">✅ Dati caricati! (funzionalità complete in arrivo)</p>';
    
  } catch(e) {
    console.error('❌ Errore:', e);
    container.innerHTML = `<p class="no-results">❌ ${e.message}</p>`;
  }
}

// ===== CARICA CATEGORIE =====
async function caricaCategorie() {
  console.log('🔵 caricaCategorie chiamata');
  
  try {
    const res = await fetch(`${API_URL}/collezione/completa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Errore');
    
    categorie = await res.json();
    console.log('✅ Categorie caricate:', categorie.length);
    
    const selectCategoriaLattina = document.getElementById('categoriaLattina');
    const selectCategoriaVariante = document.getElementById('categoriaVariante');
    
    if (selectCategoriaLattina) {
      selectCategoriaLattina.innerHTML = '<option value="">Seleziona categoria</option>';
      categorie.forEach(cat => {
        selectCategoriaLattina.innerHTML += `<option value="${cat._id}">${cat.nome}</option>`;
      });
    }
    
    if (selectCategoriaVariante) {
      selectCategoriaVariante.innerHTML = '<option value="">Seleziona categoria</option>';
      categorie.forEach(cat => {
        selectCategoriaVariante.innerHTML += `<option value="${cat._id}">${cat.nome}</option>`;
      });
    }
    
  } catch(e) {
    console.error('❌ Errore categorie:', e);
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

console.log('✅ admin.js caricato - fine');
console.log('✅ mostraTab definito:', typeof mostraTab);
