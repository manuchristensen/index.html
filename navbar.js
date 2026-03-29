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

// Cerrar sesión
async function cerrarSesion() {
  await db.auth.signOut();
  window.location.replace('../index.html');
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

// Arranca todo al cargar
initNavbar();
