let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const username = localStorage.getItem('username');
const ruolo = localStorage.getItem('ruolo');

document.addEventListener('DOMContentLoaded', () => {
  const nomeElement = document.getElementById('nomeUtente');
  if (nomeElement) {
    nomeElement.textContent = `Ciao, ${username}!`;
  }

  if (ruolo === 'admin') {
    const linkAdmin = document.getElementById('linkAdmin');
    const linkUsers = document.getElementById('linkUsers');
    if (linkAdmin) linkAdmin.style.display = 'block';
    if (linkUsers) linkUsers.style.display = 'block';
  }

  caricaTema(); // ← Usa theme.js
  mostraData();
});

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// MOSTRA DATA
function mostraData() {
  const dataElement = document.getElementById('dataVersione');
  if (dataElement) {
    const data = new Date();
    dataElement.textContent = data.toLocaleDateString('it-IT');
  }
}
