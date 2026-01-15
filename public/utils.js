// utils.js
async function mostraLinkAdmin() {
  try {
    const res = await fetch('/api/utente');
    const utente = await res.json();
    
    if (['admin', 'beta'].includes(utente.ruolo)) {
      document.querySelectorAll('#linkAdmin, #linkUsers, #linkLogAdmin, #linkBevute')
        .forEach(link => link.style.display = 'block');
    }
  } catch(e) {
    // Non admin → link restano nascosti
  }
}

// Esegui al caricamento pagina
document.addEventListener('DOMContentLoaded', mostraLinkAdmin);
