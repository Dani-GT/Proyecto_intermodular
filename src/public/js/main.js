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

// ─── Animación hero: se activa solo tras el load para no bloquear LCP ─────────
window.addEventListener('load', function () {
  document.querySelectorAll('.hero-bg, .club-hero-bg').forEach(el => {
    el.classList.add('hero-animated');
  });
});

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
      // Leer estado antes de escribir (evita reflow forzado)
      const panels = document.querySelectorAll('.profile-panel');
      const tabs   = document.querySelectorAll('.profile-tab');
      const panel  = document.getElementById('tab-' + target);
      // Agrupar todas las escrituras en un único frame
      requestAnimationFrame(() => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.add('hidden'));
        this.classList.add('active');
        if (panel) panel.classList.remove('hidden');
      });
    });
  });

  // ── Filtros tienda ────────────────────────────────────────────────────
  document.querySelectorAll('.shop-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const cat   = this.dataset.cat;
      const btns  = document.querySelectorAll('.shop-filter-btn');
      const cards = document.querySelectorAll('.product-card-wrap');
      // Leer dataset de todas las tarjetas antes de modificar el DOM
      const visibility = Array.from(cards).map(card =>
        (!cat || cat === 'TODOS' || card.dataset.cat === cat)
      );
      // Escribir todo en un único frame
      requestAnimationFrame(() => {
        btns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        cards.forEach((card, i) => {
          card.classList.toggle('hidden', !visibility[i]);
        });
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
  // Agrupar todas las escrituras de estilo en un único frame
  requestAnimationFrame(() => {
    el.style.transition = 'opacity .3s, max-height .3s, margin .3s, padding .3s';
    el.style.opacity    = '0';
    el.style.maxHeight  = '0';
    el.style.margin     = '0';
    el.style.padding    = '0';
  });
  setTimeout(() => el.remove(), 320);
}

function togglePassword(btn) {
  const input = btn.closest('.password-wrap')?.querySelector('input');
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.textContent = isPass ? '🙈' : '👁️';
}
