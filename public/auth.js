const API_URL = 'http://localhost:3000/api';

function mostraLogin() {
  document.getElementById('formLogin').style.display = 'block';
  document.getElementById('formRegister').style.display = 'none';
  document.querySelectorAll('.tab')[0].classList.add('active');
  document.querySelectorAll('.tab')[1].classList.remove('active');
}

function mostraRegister() {
  document.getElementById('formLogin').style.display = 'none';
  document.getElementById('formRegister').style.display = 'block';
  document.querySelectorAll('.tab')[0].classList.remove('active');
  document.querySelectorAll('.tab')[1].classList.add('active');
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.utente.username);
      localStorage.setItem('email', data.utente.email);
      localStorage.setItem('ruolo', data.utente.ruolo);
      
      window.location.href = 'collezione.html';
    } else {
      document.getElementById('erroreLogin').textContent = data.errore;
    }
  } catch (errore) {
    document.getElementById('erroreLogin').textContent = 'Errore di connessione';
  }
});

document.getElementById('formRegister').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.utente.username);
      localStorage.setItem('email', data.utente.email);
      localStorage.setItem('ruolo', data.utente.ruolo);
      
      window.location.href = 'collezione.html';
    } else {
      document.getElementById('erroreRegister').textContent = data.errore;
    }
  } catch (errore) {
    document.getElementById('erroreRegister').textContent = 'Errore di connessione';
  }
});
