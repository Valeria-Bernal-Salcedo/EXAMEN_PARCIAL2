// -------------------- Inicialización general --------------------
document.addEventListener('DOMContentLoaded', function() {
  // UI state inicial
  const token = safeToken();
  const userName = localStorage.getItem('userName');
  if (token && userName) updateUILoggedIn(userName);
  else updateUILoggedOut();

  // Abrir modal login
  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  const closeModal = document.getElementById('closeModal');
  const logoutBtn = document.getElementById('logoutBtn');
  if (loginBtn && loginModal) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
  if (closeModal && loginModal) closeModal.addEventListener('click', () => loginModal.style.display = 'none');
  window.addEventListener('click', (e) => { if (loginModal && e.target === loginModal) loginModal.style.display = 'none'; });
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Form login
  const form = document.getElementById('formLogin');
  if (form) form.addEventListener('submit', handleLoginSubmit);
  else console.warn('#formLogin no encontrado');

  // Botón cargar preguntas (si existe)
  const btn = document.getElementById('btnCargar');
  if (btn) btn.addEventListener('click', cargarPreguntas);

  // Botón enviar respuestas (main submit o id fallback)
  const sbtn = document.querySelector('#submitAnswers');
  if (sbtn) sbtn.addEventListener('click', enviarRespuestas);

  // Boton enviar formulario de contacto
  const btnContacto = document.querySelector('#btnFormContacto');
  if (btnContacto) btnContacto.addEventListener('click', enviarFormulario);

  // Inicializar tarjetas
  iniciarExamenCards();

  // ---- detectar cert por querystring y auto-cargar en examen.html ----
  const certFromUrl = getQueryParam('cert');
  if (certFromUrl) {
    CERT_NAME = certFromUrl;
    console.log('CERT_NAME seteado desde URL:', CERT_NAME);
  }

});

// app.js - Consolidado y listo para redirigir a examen.html?cert=... y auto-cargar preguntas
const API_BASE = 'http://localhost:3000/api/preguntas';
const AUTH_BASE = 'http://localhost:3000/api/auth';
let CERT_NAME = 'HTML'; // certificación por defecto (se sobrescribirá desde la URL si aplica)

// -------------------- Utilidades --------------------
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getQueryParam(name) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  } catch (e) {
    return null;
  }
}

// Manejo de alerts
function mostrarAlerta(titulo, mensaje, tipo) {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: tipo,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#3085d6'
  });
}


function sanitizeKey(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function setPaid(certName, value = true) {
  const key = 'paid_' + sanitizeKey(certName);
  localStorage.setItem(key, value ? 'true' : 'false');
}

function isPaid(certName) {
  const key = 'paid_' + sanitizeKey(certName);
  return localStorage.getItem(key) === 'true';
}

function safeToken() {
  const t = localStorage.getItem('token');
  if (!t || t === 'undefined' || t === 'null') return null;
  return t;
}

function isLoggedIn() {
  return !!safeToken();
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'block';
}

function clearLocalSession() {
  const prefixes = ['paid_', 'exam_avg_'];
  const exactKeys = ['token', 'userName'];
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (exactKeys.includes(key)) { localStorage.removeItem(key); return; }
    if (prefixes.some(pref => key.startsWith(pref))) { localStorage.removeItem(key); return; }
  });
  try { sessionStorage.clear(); } catch (e) {}
}

// -------------------- UI Actualización --------------------
function updateUILoggedIn(userName) {
  const userEl = document.getElementById('userName');
  if (userEl) userEl.textContent = userName || '';
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  if (loginBtn) loginBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
}

function updateUILoggedOut() {
  const userEl = document.getElementById('userName');
  if (userEl) userEl.textContent = '';
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  if (loginBtn) loginBtn.style.display = 'inline-block';
  if (logoutBtn) logoutBtn.style.display = 'none';
}

// -------------------- Login / Logout --------------------
async function handleLoginSubmit(event) {
  event.preventDefault();
  const loginInput = document.getElementById('login');
  const passInput = document.getElementById('password');
  const login = loginInput ? loginInput.value.trim() : '';
  const contrasena = passInput ? passInput.value : '';

  if (!login || !contrasena) { mostrarAlerta('Campos vacíos', 'Introduce usuario y contraseña','warning'); return; }

  try {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuenta: login, contrasena: contrasena })
    });

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (err) { console.warn('login no JSON:', text); data = {}; }

    console.log('LOGIN response:', res.status, data, text);

    if (!res.ok) {
      mostrarAlerta('Error', data?.error ?? data?.message ?? `Error ${res.status} al inciar sesión`, 'error');
      if (loginInput) loginInput.value = '';
      if (passInput) passInput.value = '';
      return;
    }

    if (!data.token) {
      mostrarAlerta('Error', 'Inicio de sesión correcto pero el servidor no devolvió token. Revisa backend.', 'error');
      console.error('LOGIN sin token:', data);
      return;
    }

    localStorage.setItem('token', data.token);
    const cuenta = data.usuario?.cuenta ?? login;
    localStorage.setItem('userName', cuenta);
    const nombreCompleto = data.nombre ?? login;
    localStorage.setItem('nombre', nombreCompleto);

    mostrarAlerta('Acceso permitido', `Bienvenid@, ${cuenta}`, 'success');
    updateUILoggedIn(cuenta);

    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'none';
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
  } catch (err) {
    console.error('Error de conexión al login:', err);
    mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor. Revisa la consola.', 'error');
  }
}

async function logout() {
  try {
    const token = safeToken();
    const res = await fetch(`${AUTH_BASE}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token || ''}` }
    });

    if (res.ok) { mostrarAlerta('Sesión cerrada', 'Has cerrado sesión correctamente.', 'success');  }
    else {
      let data = {};
      try { data = await res.json(); } catch (e) {}
      mostrarAlerta('Error', data?.error ?? 'Error al cerrar sesión en el servidor', 'error');
    }
  } catch (err) {
    console.error('Error al conectar con el servidor al hacer logout:', err);
    mostrarAlerta('Error', 'Error de conexión (no se pudo notificar logout al servidor)', 'error' );
  } finally {
    clearLocalSession();
    updateUILoggedOut();
  }
}

// -------------------- Manejo de preguntas/examen --------------------
let preguntas = [];
const btnCargar = () => document.getElementById('btnCargar');
const questionsContainer = () => document.getElementById('questionsContainer');
const submitBtn = () => document.querySelector('main button[type="submit"], #submitAnswers');
const resultContainer = () => document.getElementById('resultContainer');

async function cargarPreguntas() {
  const btn = btnCargar();
  if (!isLoggedIn()) { mostrarAlerta('Acceso denegado', 'Debes iniciar sesión.', 'warning'); openLoginModal(); return; }
  
  const currentUser = localStorage.getItem('userName') || 'anon';
  const completedKey = `examCompleted_${sanitizeKey(currentUser)}_${sanitizeKey(CERT_NAME)}`;
  if(localStorage.getItem('examCompleted')){
    mostrarAlerta('Examen realizado', 'El examen solo puede realizarse una vez', 'info');
    return;
  }

  if (!isPaid(CERT_NAME)) {
    Swal.fire({
      title: 'Pago requerido',
      text: 'Debes pagar el examen antes de iniciar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Pagar ahora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        mostrarAlerta('Pagado', 'Pago realizado exitosamente', 'success');
        setPaid(CERT_NAME, true);
      }
    });
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Cargando preguntas...'; }
  if (resultContainer()) resultContainer().innerHTML = '';

  try {
    const token = safeToken();
    // Incluimos cert en el body por si el backend lo requiere
    const res = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ cert: CERT_NAME })
    });

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }

    if (!res.ok) {
      mostrarAlerta('Error', data.message ?? data.error ?? `Error ${res.status} al solicitar preguntas.`, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Iniciar examen'; }
      return;
    }

    console.log('START response:', data);
    // backend puede devolver { questions: [...] } o directamente array
    preguntas = Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : []);

    const container = questionsContainer();
    if (!container) { console.warn('#questionsContainer no encontrado'); return; }

    container.innerHTML = '';

    if (preguntas.length === 0) {
      container.innerHTML = '<p>No se encontraron preguntas para esta certificación.</p>';
    } else {
      preguntas.forEach((q,index) => {
        const idStr = typeof q.id === 'number' ? q.id : Number(q.id);
        const opts = q.options ?? q.choices ?? [];
        const html = `
          <div class="card">
            <p><strong>${index + 1}.</strong> ${escapeHtml(q.text ?? q.question ?? '')}</p>
            ${opts.map(opt => `
              <label>
                <input type="radio" name="q_${escapeHtml(String(idStr))}" value="${escapeHtml(String(opt))}"> ${escapeHtml(String(opt))}
              </label><br>
            `).join('')}
          </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
      });
    }

    const sbtn = submitBtn();
    if (sbtn) { sbtn.disabled = false; sbtn.textContent = 'Enviar respuestas'; }
    if (btn) { btn.textContent = 'Preguntas cargadas'; btn.disabled = true; }
  } catch (err) {
    console.error('Error al pedir preguntas:', err);
    mostrarAlerta('Error', 'Error al cargar preguntas. Revisa la consola.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Iniciar examen'; }
  }
}

async function enviarRespuestas(e) {
  e.preventDefault();
  if (!preguntas || preguntas.length === 0) {  mostrarAlerta('Sin preguntas', 'No hay preguntas cargadas.', 'warning'); return; }

  const answers = preguntas.map(q => {
    const idNum = (typeof q.id === 'number') ? q.id : Number(q.id);
    const selected = document.querySelector(`input[name="q_${idNum}"]:checked`);
    return { id: idNum, answer: selected ? selected.value : '' };
  });

  const sbtn = submitBtn();
  if (sbtn) { sbtn.disabled = true; sbtn.textContent = 'Enviando...'; }

  try {
    const token = safeToken();
    // incluir cert por si el backend lo necesita para puntuar
    const res = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ cert: CERT_NAME, answers })
    });

    const text = await res.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch (e) { body = {}; }

    if (!res.ok) {
      alert(body.message ?? body.error ?? `Error ${res.status} al enviar respuestas.`);
      if (sbtn) { sbtn.disabled = false; sbtn.textContent = 'Enviar respuestas'; }
      return;
    }

    console.log('SUBMIT ->', body);
    const score = body.score;
    const total = body.total;
    const details = Array.isArray(body.details) ? body.details : [];
   
    const currentUser = localStorage.getItem('userName') || 'anon';
    const key = `examCompleted_${sanitizeKey(currentUser)}_${sanitizeKey(CERT_NAME)}`;
    localStorage.setItem(key, 'true');
    mostrarAlerta('¡Examen enviado!', 'Tus respuestas fueron registradas.', 'success');

    if (typeof score !== 'undefined' && typeof total !== 'undefined' && total != 0) {
      const avg = (Number(score) / Number(total)) * 100;
      const key = 'exam_avg_' + sanitizeKey(CERT_NAME);
      localStorage.setItem(key, (Math.round(avg * 100) / 100).toString());
    }

    const rCont = resultContainer();
    if (rCont) {
      rCont.innerHTML = `
        <h2>Resultado: ${escapeHtml(String(score ?? '—'))}/${escapeHtml(String(total ?? '—'))}</h2>
        ${details.map(d => `
          <div class="card">
            <p>${escapeHtml(d.text ?? '')}</p>
            <p>Tu respuesta: ${escapeHtml(d.yourAnswer ?? "(sin responder)")}</p>
            <p>Correcta: ${escapeHtml(d.correctAnswer ?? '')}</p>
            <p class="${d.correct ? 'ok' : 'bad'}">${d.correct ? ' Correcto' : ' Incorrecto'}</p>
          </div>
        `).join('')}
      `;
    }

    if(Number(score)>=7){
      const btnDescargar = document.createElement('button');
      btnDescargar.textContent = 'Descargar certificado';
      btnDescargar.classList.add('btn-certificado');
      btnDescargar.addEventListener('click', async () => {
        const userName = localStorage.getItem('nombre') || 'Usuario';
        const token = safeToken();
        try {
          const res = await fetch(`http://localhost:3000/api/preguntas/certificado`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              cert: CERT_NAME,
              score,
              total,
              nombre: userName
            })
          });

          if (!res.ok) {
            const data = await res.json();
            mostrarAlerta('Error', data?.message || 'No se pudo generar el certificado.', 'error');
            return;
          }

          // Descargar PDF directamente
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Certificado_${CERT_NAME}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

        } catch (err) {
          console.error('Error al descargar certificado:', err);
          mostrarAlerta('Error', 'No se pudo conectar con el servidor.', 'error');
        }
      });

      rCont.appendChild(btnDescargar);
    } else {
      rCont.insertAdjacentHTML('beforeend', `
        <p class="bad">No alcanzaste la calificación mínima para obtener el certificado (7/8).</p>
      `);
    }

    if (sbtn) { sbtn.textContent = 'Enviar respuestas'; sbtn.disabled = true; }
  } catch (err) {
    console.error('Error submit:', err);
    mostrarAlerta('Error', 'No se pudieron enviar las respuestas. Revisa la consola.', 'error');
    if (sbtn) { sbtn.disabled = false; sbtn.textContent = 'Enviar respuestas'; }
  }
}

// -------------------- Redirección / tarjetas --------------------
function gotoExamPage(name) {
  const url = `examen.html?cert=${encodeURIComponent(name)}`;
  window.location.href = url;
}

function iniciarExamenCards() {
  const cards = document.querySelectorAll('.certificacion-card');
  cards.forEach(card => {
    const certName = (card.querySelector('h3')?.textContent || card.dataset.cert || 'certificacion').trim();
    const empezar = card.querySelector('.empezar');
    if (!empezar) return;

    empezar.addEventListener('click', () => {
      if(empezar.id !== 'examen-activo'){
        mostrarAlerta('No disponible', 'Este examen no está disponible actualmente.', 'info');
        return;
      }
 
      if (!isLoggedIn()) {mostrarAlerta('Acceso restringido', 'Debes iniciar sesión para realizar el examen.', 'warning');
                 openLoginModal(); return; }

      if (!isPaid(certName)) {
        Swal.fire({
          title: 'Pago requerido',
          text: 'No puedes hacer el examen porque no has pagado.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Pagar ahora',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33'
        }).then(result => {
          if (result.isConfirmed) {
            setPaid(certName, true);
            mostrarAlerta('Pago completado', 'Pago realizado correctamente. Abriendo el examen...', 'success');
            const current = window.location.pathname.split('/').pop();
            if (current === 'examen.html') {
              CERT_NAME = certName;
              cargarPreguntas();
              return;
            }
            gotoExamPage(certName);
          } else {
            mostrarAlerta('Cancelado', 'No puedes iniciar el examen sin pagar.', 'info');
          }
        });
      }

      // si está logueado y pagado => redirigir o cargar si ya en examen.html
      const current = window.location.pathname.split('/').pop();
      if (current === 'examen.html') {
        CERT_NAME = certName;
        //cargarPreguntas();
      } else {
        gotoExamPage(certName);
      }
    });
  });
}

/* FORMULARIO CONTACTO */
async function enviarFormulario(e) {
  e.preventDefault();
  console.log("Formuario enviado");
  // Capturar los valores del formulario
  const nombre = document.getElementById('nombre')?.value.trim();
  const correo = document.getElementById('email')?.value.trim();
  const mensaje = document.getElementById('mensaje')?.value.trim();

  if (!nombre || !correo || !mensaje) {
    mostrarAlerta('Campos incompletos', 'Por favor llena todos los campos antes de enviar.', 'warning');
    return;
  }

  try {
    // Enviar al backend
    const res = await fetch('http://localhost:3000/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, mensaje })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta('Error', data.message || 'No se pudo enviar el mensaje.', 'error');
      return;
    }

    // Éxito
    mostrarAlerta('Mensaje Enviado', 'Gracias por contactarnos. Te responderemos pronto.', 'success');

    // Limpiar formulario
    document.getElementById('nombre').value = '';
    document.getElementById('email').value = '';
    document.getElementById('mensaje').value = '';
    
  } catch (err) {
    console.error('Error al enviar formulario de contacto:', err);
    mostrarAlerta('Error', 'No se pudo conectar con el servidor.', 'error');
  }
}
