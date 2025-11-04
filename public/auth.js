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

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'nascondi';
  } else {
    input.type = 'password';
    button.textContent = 'mostra';
  }
}



const token = localStorage.getItem('token');

if (token) {
  window.location.href = 'collezione.html';
}

// Form Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;  // ← CAMBIATO
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })  // ← CAMBIATO
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('ruolo', data.ruolo);
      localStorage.setItem('tema', data.tema || 'light');
      window.location.href = 'collezione.html';
    } else {
      const data = await response.json();
      document.getElementById('erroreLogin').textContent = data.errore || 'Errore login';
    }
  } catch (errore) {
    document.getElementById('erroreLogin').textContent = 'Errore connessione';
  }
});

document.getElementById('formRegister').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;  // ← CAMBIATO
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })  // ← CAMBIATO
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('ruolo', data.ruolo);
      localStorage.setItem('tema', 'light');
      window.location.href = 'collezione.html';
    } else {
      const data = await response.json();
      document.getElementById('erroreRegister').textContent = data.errore || 'Errore registrazione';
    }
  } catch (errore) {
    document.getElementById('erroreRegister').textContent = 'Errore connessione';
  }
});


// Form Register
document.getElementById('formRegister').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('ruolo', data.ruolo);
      localStorage.setItem('tema', 'light');
      window.location.href = 'collezione.html';
    } else {
      const data = await response.json();
      document.getElementById('erroreRegister').textContent = data.errore || 'Errore registrazione';
    }
  } catch (errore) {
    document.getElementById('erroreRegister').textContent = 'Errore connessione';
  }
});


mostraLogin();
