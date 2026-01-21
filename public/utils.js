// utils.js
const API_URL = 'https://monster-app-ocdj.onrender.com/api';

async function mostraLinkAdmin() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) return; // Non loggato
    
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) return;
    
    const utente = await res.json();
    
    if (['admin', 'beta'].includes(utente.ruolo)) {
      document.querySelectorAll('#linkAdmin, #linkUsers, #linkLogAdmin, #linkBevute')
        .forEach(link => {
          if (link) link.style.display = 'block';
        });
    }
  } catch(e) {
    console.log('Utils: utente non admin o errore fetch');
  }
}

// Esegui al caricamento pagina
document.addEventListener('DOMContentLoaded', mostraLinkAdmin);
