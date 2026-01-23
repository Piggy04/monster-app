console.log('ADMIN.JS LOADED');

const token = localStorage.getItem('token');
const ruolo = localStorage.getItem('ruolo');
const API_URL = 'https://monster-app-ocdj.onrender.com/api';

if (!token) window.location.href = 'index.html';

let categorie = [];

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
    document.getElementById('gestioneContainer').innerHTML = '<p style="text-align:center;padding:60px;">TAB GESTISCI OK</p>';
  }
}

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

document.addEventListener('DOMContentLoaded', function() {
  if (ruolo !== 'admin') {
    document.getElementById('accessoNegato').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
  } else {
    caricaCategorie();
  }
});

console.log('ADMIN.JS COMPLETE');
