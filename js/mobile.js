/* =========================================================
   Phone behaviour — Figma "mobile-homepage" (node 111:1645)

   Two things only, both cheap on a phone:
   1. the collapsed Filter pill expands the tag list,
   2. a short fade-and-rise as a block scrolls in (IntersectionObserver,
      CSS transition — no scroll listener, no GSAP).
   ========================================================= */
(function () {
  'use strict';

  var mq = window.matchMedia('(max-width: 768px)');
  if (!mq.matches) return;

  /* ---------- Filter pill ---------- */
  var filter = document.querySelector('.filter');
  var label = filter && filter.querySelector('.filter__label');
  if (label) {
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
    label.setAttribute('aria-expanded', 'false');
    var toggle = function () {
      var open = filter.classList.toggle('is-open');
      label.setAttribute('aria-expanded', String(open));
    };
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  /* ---------- Fade-and-rise ---------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll([
    '.intro__text', '.intro__tagline',
    '.section-head', '.phil-orb',
    '.ind-accordion__item', '.comp-card',
    '.help-card', '.post', '.talent-card',
    '.logo-grid', '.partners__cta',
    '.impact__content', '.cta__inner',
    '.footer__col'
  ].join(','));

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  targets.forEach(function (el) {
    el.classList.add('m-in');
    io.observe(el);
  });
})();
