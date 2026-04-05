/* ══════════════════════════════════════════════════════
   navbar.js — ChambaYa
   Incluilo con: <script src="../navbar.js"></script>
   ANTES de este script tiene que estar cargado Supabase.
══════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://jfcqvxrzloveggntwgie.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmY3F2eHJ6bG92ZWdnbnR3Z2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDQxMjcsImV4cCI6MjA5MDIyMDEyN30.LiKYSuce1HorUFa8c_lND0z1y9LV9fFOzUWOTZtBOTU';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── INYECTAR ELEMENTOS MÓVILES EN EL DOM ──
// Se hace antes de initNavbar para que estén listos al cargar
(function inyectarMovil() {
  const nav = document.querySelector('nav.nav');
  if (!nav) return;

  // 1. Hamburger (☰) — va como primer hijo del nav
  const ham = document.createElement('button');
  ham.className = 'nav-mob-ham';
  ham.setAttribute('aria-label', 'Menú');
  ham.innerHTML = '<span></span><span></span><span></span>';
  ham.addEventListener('click', function() { abrirDrawer(); });
  nav.insertBefore(ham, nav.firstChild);

  // 2. Botón (+) — va como último hijo del nav
  const plus = document.createElement('a');
  plus.className = 'nav-mob-plus';
  plus.href = 'publicar.html';
  plus.setAttribute('aria-label', 'Publicar tarea');
  plus.textContent = '+';
  nav.appendChild(plus);

  // 3. Drawer — se agrega al body, fuera del nav
  const drawer = document.createElement('div');
  drawer.id = 'nav-drawer';
  drawer.className = 'nav-drawer';
  drawer.innerHTML =
    '<div class="nav-drawer-overlay" id="nav-drawer-overlay"></div>' +
    '<div class="nav-drawer-panel">' +
      '<a href="home.html" class="nav-drawer-logo">Chamba<em>Ya</em></a>' +
      '<a href="perfil.html" class="nav-drawer-perfil" id="drawer-perfil-link">' +
        '<div class="nav-drawer-av" id="drawer-av"><span id="drawer-ini">?</span></div>' +
        '<div>' +
          '<div class="nav-drawer-nombre" id="drawer-nombre">Cargando...</div>' +
          '<div class="nav-drawer-sub">Ver perfil público</div>' +
        '</div>' +
      '</a>' +
      '<a href="explorar.html"       class="nav-drawer-link">Explorar tareas</a>' +
      '<a href="mistareas.html"      class="nav-drawer-link">Mis tareas</a>' +
      '<a href="mensajes.html"       class="nav-drawer-link">Mensajes</a>' +
      '<a href="notificaciones.html" class="nav-drawer-link">Notificaciones</a>' +
      '<div class="nav-drawer-sep"></div>' +
      '<a href="configuracion.html"  class="nav-drawer-link">Configuración</a>' +
      '<a href="ayuda.html"          class="nav-drawer-link">Ayuda</a>' +
      '<div class="nav-drawer-sep"></div>' +
      '<a href="#" class="nav-drawer-link rojo" id="drawer-cerrar-sesion">Cerrar sesión</a>' +
    '</div>';
  document.body.appendChild(drawer);

  // Overlay cierra el drawer
  drawer.querySelector('#nav-drawer-overlay').addEventListener('click', cerrarDrawer);

  // Cerrar sesión desde drawer
  drawer.querySelector('#drawer-cerrar-sesion').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });

  // Escape cierra el drawer
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarDrawer();
  });
})();

function abrirDrawer() {
  const d = document.getElementById('nav-drawer');
  if (d) { d.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function cerrarDrawer() {
  const d = document.getElementById('nav-drawer');
  if (d) { d.classList.remove('open'); document.body.style.overflow = ''; }
}

// ── INIT NAVBAR ──
async function initNavbar() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  const user   = session.user;
  const nombre = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  // Nombre en dropdown desktop
  const ddNombre = document.getElementById('dd-nombre');
  if (ddNombre) ddNombre.textContent = nombre;

  // Nombre en drawer móvil
  const drawerNombre = document.getElementById('drawer-nombre');
  if (drawerNombre) drawerNombre.textContent = nombre;

  window.chambaUser = user;

  // ── ACTUALIZAR ÚLTIMA VEZ VISTO ──
  db.from('profiles')
    .upsert({ id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: 'id' })
    .then(() => {}).catch(() => {});

  // ── FOTO DE PERFIL (desktop + drawer móvil) ──
  try {
    const { data: perfil } = await db.from('profiles').select('foto_url').eq('id', user.id).maybeSingle();
    const fotoDb    = perfil?.foto_url || null;
    const fotoOauth = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    const foto      = fotoDb || fotoOauth;

    // Avatar desktop
    const av = document.getElementById('nav-av');
    if (av) {
      if (foto) {
        av.innerHTML = `<img src="${foto}" alt="${nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        const ini = document.getElementById('nav-av-inicial');
        if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
      }
    }

    // Avatar drawer móvil
    const drawerAv = document.getElementById('drawer-av');
    if (drawerAv) {
      if (foto) {
        drawerAv.innerHTML = `<img src="${foto}" alt="${nombre}">`;
      } else {
        const ini = document.getElementById('drawer-ini');
        if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
      }
    }

  } catch(e) {
    const ini = document.getElementById('nav-av-inicial');
    if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
    const di = document.getElementById('drawer-ini');
    if (di) di.textContent = nombre.charAt(0).toUpperCase();
  }

  checkNotifBadge(session.user.id);
}

function toggleDropdown(e) {
  e.stopPropagation();
  document.getElementById('nav-dropdown')?.classList.toggle('open');
}

document.addEventListener('click', () => {
  document.getElementById('nav-dropdown')?.classList.remove('open');
});

async function cerrarSesion() {
  await db.auth.signOut();
  window.location.replace('/index.html');
}

let _toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

async function checkNotifBadge(userId) {
  try {
    const { count } = await db.from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leida', false);

    const link = document.getElementById('nav-notif-link');
    if (!link) return;
    link.querySelector('.nav-notif-dot')?.remove();

    if (count > 0) {
      link.style.position = 'relative';
      link.insertAdjacentHTML('beforeend',
        `<span class="nav-notif-dot" style="position:absolute;top:4px;right:2px;width:8px;height:8px;border-radius:50%;background:#EF4444;border:2px solid #fff;display:block;"></span>`
      );
      const base = document.title.replace(/^\(\d+\)\s/, '');
      document.title = `(${count}) ${base}`;
    }
  } catch(e) { /* silencioso */ }
}

initNavbar();

setInterval(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) checkNotifBadge(session.user.id);
}, 45000);
