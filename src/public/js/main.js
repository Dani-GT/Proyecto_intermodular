/* ═══════════════════════════════════════════════════════════════════════
   CB GRANOLLERS — main.js
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Tema claro / oscuro ───────────────────────────────────────────────────
const THEME_KEY = 'cbg-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Cargar tema guardado antes de pintar la página (evita flash)
(function () {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);
})();

// ─── DOM Ready ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // ── Toggle de tema ────────────────────────────────────────────────────
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // ── Navbar hamburger / menú móvil ─────────────────────────────────────
  const hamburger  = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ── Dropdown usuario ──────────────────────────────────────────────────
  const userBtn      = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');

  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => userDropdown.classList.remove('open'));
    userDropdown.addEventListener('click', e => e.stopPropagation());
  }

  // ── Cerrar alertas ────────────────────────────────────────────────────
  document.querySelectorAll('.alert').forEach(alert => {
    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) closeBtn.addEventListener('click', () => fadeOut(alert));
    setTimeout(() => fadeOut(alert), 5000);
  });

  // ── Toggle contraseña ─────────────────────────────────────────────────
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const input = this.closest('.password-wrap')?.querySelector('input');
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      this.textContent = isPassword ? '🙈' : '👁️';
    });
  });

  // ── Confirmaciones ────────────────────────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', function (e) {
      if (!confirm(this.dataset.confirm || '¿Estás seguro?')) e.preventDefault();
    });
  });

  // ── Smooth scroll ─────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  // ── Tabs de perfil ────────────────────────────────────────────────────
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      const target = this.dataset.tab;
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-panel').forEach(p => p.style.display = 'none');
      this.classList.add('active');
      const panel = document.getElementById('tab-' + target);
      if (panel) panel.style.display = 'block';
    });
  });

  // ── Filtros tienda ────────────────────────────────────────────────────
  document.querySelectorAll('.shop-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      document.querySelectorAll('.product-card-wrap').forEach(card => {
        card.style.display = (!cat || cat === 'TODOS' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });

  // ── Marcar página activa en nav ───────────────────────────────────────
  const seg = window.location.pathname.split('/')[1] || '';
  document.querySelectorAll('[data-page]').forEach(el => {
    if (el.dataset.page === seg) el.classList.add('active');
  });

});

// ─── Utilidades globales ───────────────────────────────────────────────────
function fadeOut(el) {
  if (!el) return;
  el.style.transition = 'opacity .3s, max-height .3s, margin .3s, padding .3s';
  el.style.opacity = '0';
  el.style.maxHeight = '0';
  el.style.margin = '0';
  el.style.padding = '0';
  setTimeout(() => el.remove(), 320);
}

function togglePassword(btn) {
  const input = btn.closest('.password-wrap')?.querySelector('input');
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.textContent = isPass ? '🙈' : '👁️';
}
