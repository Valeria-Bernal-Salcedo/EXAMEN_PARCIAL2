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

  if (!login || !contrasena) { alert('Introduce usuario y contraseña'); return; }

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
      alert(data?.error ?? data?.message ?? `Error ${res.status} al iniciar sesión`);
      if (loginInput) loginInput.value = '';
      if (passInput) passInput.value = '';
      return;
    }

    if (!data.token) {
      alert('Inicio de sesión correcto pero el servidor no devolvió token. Revisa backend.');
      console.error('LOGIN sin token:', data);
      return;
    }

    localStorage.setItem('token', data.token);
    const cuenta = data.usuario?.cuenta ?? login;
    localStorage.setItem('userName', cuenta);

    alert('Acceso permitido: ' + cuenta);
    updateUILoggedIn(cuenta);

    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'none';
    if (loginInput) loginInput.value = '';
    if (passInput) passInput.value = '';
  } catch (err) {
    console.error('Error de conexión al login:', err);
    alert('Error de conexión con el servidor. Revisa la consola.');
  }
}

async function logout() {
  try {
    const token = safeToken();
    const res = await fetch(`${AUTH_BASE}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token || ''}` }
    });

    if (res.ok) { alert('Sesión cerrada correctamente'); }
    else {
      let data = {};
      try { data = await res.json(); } catch (e) {}
      alert(data?.error ?? 'Error al cerrar sesión en el servidor');
    }
  } catch (err) {
    console.error('Error al conectar con el servidor al hacer logout:', err);
    alert('Error de conexión (no se pudo notificar logout al servidor)');
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
  if (!isLoggedIn()) { alert('Debes iniciar sesión.'); openLoginModal(); return; }
  if (!isPaid(CERT_NAME)) {
    alert('Debes pagar el examen antes de iniciar.');
    const ok = confirm('¿Deseas simular el pago ahora para pruebas?');
    if (!ok) return;
    setPaid(CERT_NAME, true);
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
      alert(data.message ?? data.error ?? `Error ${res.status} al solicitar preguntas.`);
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
      preguntas.forEach(q => {
        const idStr = typeof q.id === 'number' ? q.id : Number(q.id);
        const opts = q.options ?? q.choices ?? [];
        const html = `
          <div class="card">
            <p><strong>${escapeHtml(String(idStr))}.</strong> ${escapeHtml(q.text ?? q.question ?? '')}</p>
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
    alert('Error al cargar preguntas. Revisa la consola.');
    if (btn) { btn.disabled = false; btn.textContent = 'Iniciar examen'; }
  }
}

async function enviarRespuestas(e) {
  e.preventDefault();
  if (!preguntas || preguntas.length === 0) { alert('No hay preguntas cargadas.'); return; }

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

    if (sbtn) { sbtn.textContent = 'Enviar respuestas'; sbtn.disabled = true; }
  } catch (err) {
    console.error('Error submit:', err);
    alert('Error al enviar respuestas. Revisa la consola.');
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
      if (!isLoggedIn()) { alert('No puedes hacer el examen: debes iniciar sesión.'); openLoginModal(); return; }

      if (!isPaid(certName)) {
        alert('No puedes hacer el examen porque no has pagado.');
        const pagarAhora = confirm('¿Deseas pagar el examen ahora?');
        if (pagarAhora) {
          setPaid(certName, true);
          alert('Pago realizado correctamente. Abriendo la página del examen...');
          // si estamos ya en examen.html, cargamos localmente; si no, redirigimos
          const current = window.location.pathname.split('/').pop();
          if (current === 'examen.html') {
            CERT_NAME = certName;
            cargarPreguntas();
            return;
          }
          gotoExamPage(certName);
        } else {
          alert('No puedes iniciar el examen sin pagar.');
        }
        return;
      }

      // si está logueado y pagado => redirigir o cargar si ya en examen.html
      const current = window.location.pathname.split('/').pop();
      if (current === 'examen.html') {
        CERT_NAME = certName;
        cargarPreguntas();
      } else {
        gotoExamPage(certName);
      }
    });
  });
}

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
  const sbtn = document.querySelector('main button[type="submit"], #submitAnswers');
  if (sbtn) sbtn.addEventListener('click', enviarRespuestas);

  // Inicializar tarjetas
  iniciarExamenCards();

  // ---- detectar cert por querystring y auto-cargar en examen.html ----
  const certFromUrl = getQueryParam('cert');
  if (certFromUrl) {
    CERT_NAME = certFromUrl;
    console.log('CERT_NAME seteado desde URL:', CERT_NAME);
  }

  // Si estamos en examen.html, intentar cargar preguntas automáticamente
  const pathname = window.location.pathname.split('/').pop();
  if (pathname === 'examen.html') {
    // cargarPreguntas() validará login/pago y abrirá modal si hace falta
    cargarPreguntas();
  }
});
