/* =========================================================
   Header: scroll state, hide-on-scroll, mega menu, mobile drawer
   ========================================================= */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var mega = document.getElementById('mega');
  var dim = document.querySelector('.page-dim');
  var triggers = Array.from(document.querySelectorAll('.has-menu'));
  var panels = Array.from(mega.querySelectorAll('.mega__panel'));
  var burger = document.querySelector('.nav__burger');
  var hero = document.getElementById('hero');

  var openTimer = null;
  var closeTimer = null;
  var activeKey = null;
  var isDesktop = function () { return window.matchMedia('(min-width: 1025px)').matches; };

  /* ---------- Light nav once we leave the hero ---------- */
  function updateLight() {
    var threshold = (hero ? hero.offsetHeight : 600) - 120;
    header.classList.toggle('is-light', window.scrollY > threshold);
  }

  /* ---------- Hide on scroll down, show on scroll up ---------- */
/* ---------- Hide on scroll down, show on scroll up ---------- */

var lastY = window.scrollY;
var ticking = false;

function onScroll() {
  if (ticking) return;

  ticking = true;

  requestAnimationFrame(function () {
    var y = window.scrollY;
    var delta = y - lastY;

    if (y > 40 && delta > 0 && !header.classList.contains('menu-open')) {
      header.classList.add('is-hidden');
    } else if (delta < 0 || y <= 40) {
      header.classList.remove('is-hidden');
    }

    lastY = y;
    updateLight();
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
updateLight();
  window.addEventListener('scroll', onScroll, { passive: true });
  updateLight();

  /* ---------- Mega menu ---------- */
  function showPanel(key) {
    panels.forEach(function (p) {
      var on = p.dataset.panel === key;
      p.classList.toggle('is-active', on);
    });
    triggers.forEach(function (t) {
      t.classList.toggle('is-open', t.dataset.menu === key);
    });
  }

  function openMenu(key) {
    clearTimeout(closeTimer);
    if (activeKey === key && mega.classList.contains('is-open')) return;
    activeKey = key;
    // Re-trigger tile animations when switching panels
    panels.forEach(function (p) { p.classList.remove('is-active'); });
    void mega.offsetWidth;
    showPanel(key);
    mega.classList.add('is-open');
    mega.setAttribute('aria-hidden', 'false');
    header.classList.add('menu-open');
    header.classList.remove('is-hidden');
    dim.classList.add('is-on');
  }

  function closeMenu() {
    clearTimeout(openTimer);
    closeTimer = setTimeout(function () {
      activeKey = null;
      mega.classList.remove('is-open');
      mega.setAttribute('aria-hidden', 'true');
      header.classList.remove('menu-open');
      if (!header.classList.contains('drawer-open')) dim.classList.remove('is-on');
      triggers.forEach(function (t) { t.classList.remove('is-open'); });
    }, 140);
  }

  triggers.forEach(function (t) {
    var key = t.dataset.menu;
    t.addEventListener('mouseenter', function () {
      if (!isDesktop()) return;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(function () { openMenu(key); }, 90);
    });
    t.addEventListener('mouseleave', function () {
      if (!isDesktop()) return;
      clearTimeout(openTimer);
      closeMenu();
    });
    // Keyboard access
    var focusable = t.matches('a') ? t : t.querySelector('a');
    if (focusable) {
      focusable.addEventListener('focus', function () { if (isDesktop()) openMenu(key); });
      focusable.addEventListener('click', function (e) {
        if (!isDesktop()) return;
        // First click opens the panel, second follows the link
        if (!mega.classList.contains('is-open') || activeKey !== key) { e.preventDefault(); openMenu(key); }
      });
    }
  });

  mega.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
  mega.addEventListener('mouseleave', function () { if (isDesktop()) closeMenu(); });
  dim.addEventListener('click', function () { closeMenu(); closeDrawer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeDrawer(); } });
  mega.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  /* ---------- Mobile drawer ---------- */
  function openDrawer() {
    header.classList.add('drawer-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    dim.classList.add('is-on');
  }
  function closeDrawer() {
    header.classList.remove('drawer-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    if (!mega.classList.contains('is-open')) dim.classList.remove('is-on');
    collapseSubs();
  }
  burger.addEventListener('click', function () {
    header.classList.contains('drawer-open') ? closeDrawer() : openDrawer();
  });
  header.addEventListener('click', function (e) {
    if (!e.defaultPrevented && header.classList.contains('drawer-open') && e.target.closest('a')) closeDrawer();
  });

  /* ---------- Drawer accordions, built from the mega panels ---------- */
  var subItems = [];

  function collapseSubs() {
    subItems.forEach(function (s) {
      s.item.classList.remove('is-expanded');
      s.btn.setAttribute('aria-expanded', 'false');
    });
  }

  Array.from(document.querySelectorAll('.nav__menu .nav__item.has-menu')).forEach(function (item) {
    var key = item.dataset.menu;
    var panel = mega.querySelector('[data-panel="' + key + '"]');
    var link = item.querySelector('.nav__link');
    if (!panel || !link) return;

    var sub = document.createElement('ul');
    sub.className = 'nav__sub';
    sub.id = 'nav-sub-' + key;
    Array.from(panel.querySelectorAll('.mega__tile')).forEach(function (tile) {
      var label = tile.querySelector('span');
      var img = tile.querySelector('img');
      var text = (label ? label.textContent : img ? img.alt : '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = tile.getAttribute('href') || '#';
      a.textContent = text;
      li.appendChild(a);
      sub.appendChild(li);
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav__sub-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', sub.id);
    btn.setAttribute('aria-label', link.textContent.trim() + ' submenu');
    item.appendChild(btn);
    item.appendChild(sub);
    subItems.push({ item: item, btn: btn });

    function toggle(e) {
      if (isDesktop()) return;
      e.preventDefault();
      var open = !item.classList.contains('is-expanded');
      collapseSubs();
      item.classList.toggle('is-expanded', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', toggle);
    link.addEventListener('click', toggle);
  });
  window.addEventListener('resize', function () { if (isDesktop()) closeDrawer(); else closeMenu(); });

  /* ---------- Smooth anchor scrolling (offset for fixed header) ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - 40;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
})();
