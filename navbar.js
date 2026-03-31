/* ══════════════════════════════════════════════════════
   navbar.js — ChambaYa
   Script compartido por todas las páginas logueadas.
   Incluilo con: <script src="navbar.js"></script>
   ANTES de este script tiene que estar cargado Supabase.
══════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://jfcqvxrzloveggntwgie.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmY3F2eHJ6bG92ZWdnbnR3Z2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDQxMjcsImV4cCI6MjA5MDIyMDEyN30.LiKYSuce1HorUFa8c_lND0z1y9LV9fFOzUWOTZtBOTU';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Inicializa navbar: chequea sesión, muestra foto/inicial y nombre
async function initNavbar() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  const user   = session.user;
  const foto   = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const nombre = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  // Avatar
  const av = document.getElementById('nav-av');
  if (av) {
    if (foto) {
      av.innerHTML = `<img src="${foto}" alt="${nombre}">`;
    } else {
      const ini = document.getElementById('nav-av-inicial');
      if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
    }
  }

  // Nombre en el dropdown
  const ddNombre = document.getElementById('dd-nombre');
  if (ddNombre) ddNombre.textContent = nombre;

  // Exponemos el user globalmente por si la página lo necesita
  window.chambaUser = user;

  // Chequear badges de notificaciones y mensajes
  checkNavBadges(user.id);
  setInterval(() => checkNavBadges(user.id), 45000);
}

// Abre/cierra el dropdown al clickear el avatar
function toggleDropdown(e) {
  e.stopPropagation();
  document.getElementById('nav-dropdown')?.classList.toggle('open');
}

// Cierra el dropdown al clickear fuera
document.addEventListener('click', () => {
  document.getElementById('nav-dropdown')?.classList.remove('open');
});

// Cerrar sesión — index.html está en la raíz, NO en /pages/
async function cerrarSesion() {
  await db.auth.signOut();
  window.location.replace('/index.html');
}

// Toast global reutilizable en cualquier página
let _toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── BADGES DE NOTIFICACIONES Y MENSAJES ──
// Inyecta un punto rojo en el navbar cuando hay items sin leer.
// Funciona en CUALQUIER página que tenga navbar.js cargado,
// siempre que el link tenga id="nav-notif-link" o id="nav-mensajes-link".

function inyectarPunto(elementId, mostrar) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.position = 'relative';
  el.querySelector('.nav-badge-dot')?.remove();
  if (mostrar) {
    el.insertAdjacentHTML('beforeend',
      `<span class="nav-badge-dot" style="
        position:absolute;top:3px;right:0px;
        width:8px;height:8px;border-radius:50%;
        background:#EF4444;border:2px solid #fff;
        display:block;pointer-events:none;
      "></span>`
    );
  }
}

async function checkNavBadges(userId) {
  try {
    // Notificaciones no leídas
    const { count: notifCount } = await db.from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leida', false);
    inyectarPunto('nav-notif-link', notifCount > 0);

    // Mensajes no leídos: buscar en conversaciones donde participo
    // Primero buscar mis conv_ids (ofertas aceptadas donde soy parte)
    const { data: comoTasker } = await db.from('ofertas')
      .select('id').eq('estado', 'aceptada').eq('tasker_id', userId);

    const { data: tareasComoDueno } = await db.from('tareas')
      .select('ofertas!inner(id)')
      .eq('user_id', userId)
      .eq('ofertas.estado', 'aceptada');

    const convIds = [
      ...(comoTasker || []).map(o => o.id),
      ...(tareasComoDueno || []).flatMap(t => (t.ofertas || []).map(o => o.id))
    ];

    if (convIds.length) {
      const { count: msgCount } = await db.from('mensajes')
        .select('id', { count: 'exact', head: true })
        .in('conv_id', convIds)
        .eq('leido', false)
        .neq('user_id', userId);
      inyectarPunto('nav-mensajes-link', msgCount > 0);
    } else {
      inyectarPunto('nav-mensajes-link', false);
    }

    // Actualizar título del tab con total no leído
    const total = (notifCount || 0);
    if (total > 0) {
      const base = document.title.replace(/^\(\d+\)\s/, '');
      document.title = `(${total}) ${base}`;
    }
  } catch(e) { /* silencioso */ }
}

// Arranca todo al cargar
initNavbar();
