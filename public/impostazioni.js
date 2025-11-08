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

  caricaTema();
  caricaInfoProfilo();
});

// CARICA E APPLICA TEMA
async function caricaTema() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      const tema = user.tema || 'light';
      document.documentElement.setAttribute('data-theme', tema);
      
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.querySelector(`.theme-btn.${tema}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  } catch (err) {
    console.error('Errore caricamento tema:', err);
  }
}

// CAMBIA TEMA
async function cambiaTema(nuovoTema) {
  try {
    document.documentElement.setAttribute('data-theme', nuovoTema);
    
    const response = await fetch(`${API_URL}/auth/me/tema`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tema: nuovoTema })
    });
    
    if (response.ok) {
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.theme-btn.${nuovoTema}`).classList.add('active');
    }
    
    const drawer = document.getElementById('themeDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  } catch (err) {
    console.error('Errore cambio tema:', err);
  }
}

// TOGGLE THEME DRAWER
function toggleThemeDrawer() {
  const drawer = document.getElementById('themeDrawer');
  drawer.classList.toggle('active');
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// CARICA INFO PROFILO
async function caricaInfoProfilo() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      
      document.getElementById('infoUsername').textContent = user.username;
      document.getElementById('infoEmail').textContent = user.email;
      document.getElementById('infoRuolo').textContent = user.ruolo === 'admin' ? 'Admin' : user.ruolo === 'beta' ? 'Beta Tester' : 'User';
      
      const data = new Date(user.createdAt);
      document.getElementById('infoData').textContent = data.toLocaleDateString('it-IT');
    }
  } catch (err) {
    console.error('Errore caricamento profilo:', err);
  }
}

// CAMBIA USERNAME
async function cambiaUsername() {
  const nuovoUsername = document.getElementById('nuovoUsername').value.trim();
  
  if (!nuovoUsername) {
    alert('⚠️ Inserisci un nuovo username');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/cambia-username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username: nuovoUsername })
    });
    
    if (response.ok) {
      alert('✓ Username aggiornato!');
      localStorage.setItem('username', nuovoUsername);
      document.getElementById('nuovoUsername').value = '';
      caricaInfoProfilo();
      document.getElementById('nomeUtente').textContent = `Ciao, ${nuovoUsername}!`;
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'aggiornamento');
  }
}

// CAMBIA EMAIL
async function cambiaEmail() {
  const nuovaEmail = document.getElementById('nuovaEmail').value.trim();
  
  if (!nuovaEmail) {
    alert('⚠️ Inserisci una nuova email');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/cambia-email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email: nuovaEmail })
    });
    
    if (response.ok) {
      alert('✓ Email aggiornata!');
      document.getElementById('nuovaEmail').value = '';
      caricaInfoProfilo();
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'aggiornamento');
  }
}

// CAMBIA PASSWORD
async function cambiaPassword() {
  const passwordVecchia = document.getElementById('passwordVecchia').value;
  const nuovaPassword = document.getElementById('nuovaPassword').value;
  const confermaPassword = document.getElementById('confermaPassword').value;
  
  if (!passwordVecchia || !nuovaPassword || !confermaPassword) {
    alert('⚠️ Compila tutti i campi');
    return;
  }
  
  if (nuovaPassword !== confermaPassword) {
    alert('⚠️ Le password non coincidono');
    return;
  }
  
  if (nuovaPassword.length < 4) {
    alert('⚠️ La password deve avere almeno 4 caratteri');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/cambia-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        passwordVecchia,
        nuovaPassword
      })
    });
    
    if (response.ok) {
      alert('✓ Password aggiornata!');
      document.getElementById('passwordVecchia').value = '';
      document.getElementById('nuovaPassword').value = '';
      document.getElementById('confermaPassword').value = '';
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'aggiornamento');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'aggiornamento');
  }
}

// ELIMINA ACCOUNT
function confermahiEliminazioneAccount() {
  if (!confirm('⚠️ Sei SICURO? Questa azione è IRREVERSIBILE e cancellerà TUTTI i tuoi dati!')) {
    return;
  }
  
  if (!confirm('🔴 ULTIMA CONFERMA: Digita "ELIMINA" nella finestra successiva per confermare')) {
    return;
  }
  
  const conferma = prompt('Digita ELIMINA per confermare l\'eliminazione del tuo account:');
  
  if (conferma !== 'ELIMINA') {
    alert('Operazione annullata');
    return;
  }
  
  eliminaAccount();
}

async function eliminaAccount() {
  try {
    const response = await fetch(`${API_URL}/auth/elimina-account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      alert('✓ Account eliminato');
      localStorage.clear();
      window.location.href = 'index.html';
    } else {
      const data = await response.json();
      alert(data.errore || 'Errore nell\'eliminazione');
    }
  } catch (err) {
    console.error('Errore:', err);
    alert('Errore nell\'eliminazione');
  }
}
