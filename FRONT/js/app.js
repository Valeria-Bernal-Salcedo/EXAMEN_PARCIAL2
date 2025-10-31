/* CODIGO JAVASCRIPT */

// --- Manejo del modal de login y logout ---
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay sesión activa al cargar la página
  checkSession();

  // Abrir/cerrar modal de login
  document.getElementById('loginBtn').onclick = () => {
    document.getElementById('loginModal').style.display = 'block';
  };
  
  document.getElementById('closeModal').onclick = () => {
    document.getElementById('loginModal').style.display = 'none';
  };
  
  window.onclick = (e) => {
    if (e.target === document.getElementById('loginModal')) {
      document.getElementById('loginModal').style.display = 'none';
    }
  };

  // Manejar logout
  document.getElementById('logoutBtn').onclick = logout;
});

// Capturamos el formulario
const form = document.getElementById("formLogin");

// Escuchamos el evento "submit"
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // evita que la página se recargue

  // Obtener los valores escritos por el usuario
  const login = document.getElementById("login").value;
  const contrasena = document.getElementById("password").value;

  // Enviar los datos al servidor usando fetch + async/await
  try {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cuenta: login, // nombre del campo esperado el backend
        contrasena: contrasena
      })
    });

    // Intentamos parsear el JSON (puede fallar si el servidor responde vacío)
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn("Respuesta no JSON del servidor", parseErr);
      data = {};
    }

    // Revisar la respuesta
    if (res.ok) {
      const cuenta = data.usuario?.cuenta;
      const token = data.token;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userName', cuenta);
      
      alert("Acceso permitido: " + cuenta);
      console.log("Valeria Bernal Salcedo");
      updateUILoggedIn(cuenta);
      
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById("login").value = "";
      document.getElementById("password").value = "";
    } else {
      alert(data?.error ?? `Error ${res.status}`);
      document.getElementById("login").value = "";
      document.getElementById("password").value = "";
    }

  } catch (err) {
    console.error("Error al conectar con el servidor:", err);
    alert("Error de conexión con el servidor");
  }
});

// --- Función para verificar si hay sesión activa ---
function checkSession() {
  const userName = localStorage.getItem('userName');
  if (userName) {
    updateUILoggedIn(userName);
  } else {
    updateUILoggedOut();
  }
}

// --- Actualizar UI cuando hay sesión ---
function updateUILoggedIn(userName) {
  document.getElementById('userName').textContent = userName;
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'inline-block';
}

// --- Actualizar UI cuando NO hay sesión ---
function updateUILoggedOut() {
  document.getElementById('userName').textContent = '';
  document.getElementById('loginBtn').style.display = 'inline-block';
  document.getElementById('logoutBtn').style.display = 'none';
}

// --- Función para hacer logout ---
async function logout() {
  try {
    const res = await fetch("http://localhost:3000/api/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (res.ok) {
      alert('Sesión cerrada correctamente');
    } else {
      const data = await res.json();
      alert(data?.error ?? `Error al cerrar sesión`);
    }
  } catch (err) {
    console.error("Error al conectar con el servidor:", err);
    alert("Error de conexión");
  } finally {
    // Siempre limpiar localStorage y actualizar UI, incluso si hay error
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    updateUILoggedOut();
  }
}
