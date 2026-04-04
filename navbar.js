/* ══════════════════════════════════════════════════════
   navbar.js — ChambaYa
   Script compartido por todas las páginas logueadas.
   Incluilo con: <script src="../navbar.js"></script>
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
  const nombre = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  // Nombre en el dropdown
  const ddNombre = document.getElementById('dd-nombre');
  if (ddNombre) ddNombre.textContent = nombre;

  // Exponemos el user globalmente
  window.chambaUser = user;

  // ── ACTUALIZAR ÚLTIMA VEZ VISTO ──
  // Se hace en cada carga de página para que cualquier visitante
  // vea la actividad real del usuario. Fire-and-forget, no bloquea.
  db.from('profiles')
    .upsert({ id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: 'id' })
    .then(() => {})
    .catch(() => {});

  // ── FOTO DE PERFIL ──
  // Prioridad: foto subida por el usuario en profiles > foto de Google OAuth
  try {
    const { data: perfil } = await db.from('profiles').select('foto_url').eq('id', user.id).maybeSingle();
    const fotoDb    = perfil?.foto_url || null;
    const fotoOauth = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    const foto      = fotoDb || fotoOauth;

    const av = document.getElementById('nav-av');
    if (av) {
      if (foto) {
        av.innerHTML = `<img src="${foto}" alt="${nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        const ini = document.getElementById('nav-av-inicial');
        if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
      }
    }
  } catch(e) {
    const ini = document.getElementById('nav-av-inicial');
    if (ini) ini.textContent = nombre.charAt(0).toUpperCase();
  }

  checkNotifBadge(session.user.id);
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

// ── BADGE DE NOTIFICACIONES ──
// Pone un punto rojo animado en el link de Notificaciones del navbar
async function checkNotifBadge(userId) {
  try {
    const { count } = await db.from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leida', false);

    const link = document.getElementById('nav-notif-link');
    if (!link) return;

    // Remover badge existente para re-evaluar
    link.querySelector('.nav-notif-dot')?.remove();

    if (count > 0) {
      link.style.position = 'relative';
      link.insertAdjacentHTML('beforeend',
        `<span class="nav-notif-dot" style="
          position:absolute;top:4px;right:2px;
          width:8px;height:8px;border-radius:50%;
          background:#EF4444;border:2px solid #fff;
          display:block;
        "></span>`
      );
      // Actualizar el title del tab del navegador también
      const base = document.title.replace(/^\(\d+\)\s/, '');
      document.title = `(${count}) ${base}`;
    }
  } catch(e) { /* silencioso */ }
}

// Arranca todo al cargar
initNavbar();

// Re-chequear badge cada 45 segundos sin recargar
setInterval(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) checkNotifBadge(session.user.id);
}, 45000);
