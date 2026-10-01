/* =========================================================
   Version 3 interactions: hero load state + sheet hand-off,
   industries tabs / accordion, help cards on touch, partner-logo
   carousel (phone). No GSAP dependency — plain DOM.
   ========================================================= */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noAnim = params.has('noanim') || reduce;
  if (noAnim) document.documentElement.classList.add('no-anim');

  /* ---------- QA: ?y=<px> scrolls to a fixed position after load ---------- */
  if (params.has('y')) {
    document.documentElement.style.scrollBehavior = 'auto';
    window.addEventListener('load', function () {
      setTimeout(function () { window.scrollTo(0, +params.get('y') || 0); }, 400);
    });
  }

  /* ---------- Hero: dark + blurred start frame -> clear, then the nav ----------
     Matches the prototype: the page opens on the dark "Start here" frame and
     holds there for HOLD; then it cuts to the next frame (sharp, half as dark,
     scene and headline still low) and eases up into the mountains + headline,
     and the nav slides in after. Scrolling before the hold is up runs the same
     hand-off early, so an early scroll never sits behind the blur. */
  var stage = document.querySelector('.hero3__stage');
  var CLEAR = 1200;       // matches --hero-intro in css/sections.css
  var HOLD = 2000;        // the "Start here" frame holds this long after load
  var revealed = false;
  var holdTimer = null;
  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(holdTimer);
    window.removeEventListener('scroll', onFirstScroll);
    if (stage) {
      if (!noAnim) stage.classList.add('is-intro');
      stage.classList.remove('is-loading');
      if (!noAnim) {
        void stage.offsetWidth; // commit the .is-intro frame so the ease starts from it
        stage.classList.remove('is-intro');
      }
    }
    setTimeout(function () { document.body.classList.remove('hero-loading'); }, noAnim ? 0 : CLEAR * 0.55);
  }
  function onFirstScroll() { if (window.scrollY > 0) reveal(); }
  if (noAnim) reveal();
  else {
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    onFirstScroll(); // opened mid-page (anchor / restored scroll): no blur hold
    if (!revealed) holdTimer = setTimeout(reveal, HOLD);
  }

  /* ---------- Hero scale ----------
     --u = live px per Figma design px: the "cover" scale of the 1920 x 1080
     frame for the stage (the CSS fallback uses 100vw, which includes the
     scrollbar). js/animations.js uses the same unit for its offsets. */
  function heroU() {
    return stage ? Math.max(stage.offsetWidth / 1920, stage.offsetHeight / 1080) : 1;
  }
  function setU() { if (stage) stage.style.setProperty('--u', heroU() + 'px'); }
  setU();
  window.v3HeroU = heroU;

  /* ---------- Hero sheet -> page hand-off ----------
     The white sheet (curve + intro) ends the pin with its top at 806 design
     px. .page-below must start exactly where the sheet ends, so its top
     margin = sheet bottom - stage height. Recomputed on resize. */
  var sheet = document.querySelector('.hero3__sheet');
  var below = document.querySelector('.page-below');
  function syncSheet() {
    if (!sheet || !below || !stage) return;
    var H = stage.offsetHeight;
    var top = 806 * heroU();
    below.style.marginTop = Math.max(0, Math.round(top + sheet.offsetHeight - H)) + 'px';
  }
  syncSheet();
  window.v3SyncSheet = syncSheet;
  var lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    setU();
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    syncSheet();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncSheet);
  if ('ResizeObserver' in window && sheet) {
    new ResizeObserver(function () {
      syncSheet();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }).observe(sheet);
  }

  /* ---------- Industries: tabs change the copy only ----------
     Desktop: hover / click / focus a tab swaps the body copy.
     <=1024: each tab becomes an accordion row with its own copy + button. */
  var ind = document.getElementById('industries');
  if (ind) {
    var tabs = Array.from(ind.querySelectorAll('.ind3__tab'));
    var copy = ind.querySelector('#ind3-copy');
    var cta = ind.querySelector('.ind3__cta');
    var eyebrow = ind.querySelector('.ind3__eyebrow');
    var title = ind.querySelector('#ind3-title');
    var activeTab = tabs.find(function (t) { return t.classList.contains('is-active'); });
    var current = activeTab ? activeTab.dataset.ind : (tabs[0] && tabs[0].dataset.ind);
    var swapTimer = null;
    var accordion = window.matchMedia('(max-width: 1024px)');

    // accordion panels, one per tab. On mobile .ind3__body (the shared
    // eyebrow/headline) is hidden by CSS, so each row gets its own copy of
    // that eyebrow + headline above its paragraph — it travels with whichever
    // row is open instead of being pinned once above the whole list.
    tabs.forEach(function (t) {
      var acc = document.createElement('div');
      acc.className = 'ind3__acc';
      acc.id = 'ind3-acc-' + t.dataset.ind;
      var inner = document.createElement('div');
      inner.className = 'ind3__acc-inner';
      if (eyebrow) inner.appendChild(eyebrow.cloneNode(true));
      if (title) {
        var titleClone = title.cloneNode(true);
        titleClone.removeAttribute('id');
        inner.appendChild(titleClone);
      }
      var p = document.createElement('p');
      p.textContent = t.dataset.copy;
      inner.appendChild(p);
      if (cta) inner.appendChild(cta.cloneNode(true));
      acc.appendChild(inner);
      t.parentNode.appendChild(acc);
      t.setAttribute('aria-controls', acc.id);
    });

    function setOpen(key) {
      tabs.forEach(function (t) {
        var acc = document.getElementById('ind3-acc-' + t.dataset.ind);
        var on = t.dataset.ind === key;
        if (acc) acc.style.maxHeight = on && accordion.matches ? acc.scrollHeight + 'px' : '';
        t.setAttribute('aria-expanded', on && accordion.matches ? 'true' : 'false');
      });
    }

    function activate(key, force) {
      if (key === current && !force) return;
      current = key;
      tabs.forEach(function (t) {
        var on = t.dataset.ind === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      setOpen(key);
      var tab = tabs.find(function (t) { return t.dataset.ind === key; });
      if (!tab || !copy) return;
      var text = tab.dataset.copy;
      if (noAnim || accordion.matches) { copy.textContent = text; return; }
      clearTimeout(swapTimer);
      copy.classList.add('is-swapping');
      swapTimer = setTimeout(function () {
        copy.textContent = text;
        copy.classList.remove('is-swapping');
      }, 260);
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        // accordion: tapping the open row closes it
        if (accordion.matches && t.dataset.ind === current && t.getAttribute('aria-expanded') === 'true') {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
          setOpen(null); return;
        }
        activate(t.dataset.ind, true);
        if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 520);
      });
    });
    ind.querySelector('.ind3__tabs').addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
      var i = tabs.findIndex(function (t) { return t.dataset.ind === current; });
      var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      activate(next.dataset.ind);
      e.preventDefault();
    });
    var mqChange = function () { setOpen(current); };
    if (accordion.addEventListener) accordion.addEventListener('change', mqChange);
    setOpen(current);
    // the open row's max-height is measured from scrollHeight at this point,
    // but the display webfont can still swap in after and reflow the copy
    // taller (more visible at narrow widths, where lines wrap more), leaving
    // the panel too short and clipping its button; re-measure once it loads.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setOpen(current); });
  }

  /* ---------- Help cards: tap toggles the white state on touch ---------- */
  var helpCards = Array.from(document.querySelectorAll('.help3-card'));
  if (helpCards.length) {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) {
      helpCards.forEach(function (c) {
        c.addEventListener('click', function () {
          var open = !c.classList.contains('is-open');
          helpCards.forEach(function (o) { o.classList.remove('is-open'); });
          c.classList.toggle('is-open', open);
        });
      });
    }
    helpCards.forEach(function (c) {
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('is-open'); }
      });
    });
  }

  /* ---------- Partner logos: phone marquee ----------
     Below 768 the 3x3 grid becomes a continuously auto-scrolling strip.
     The track is duplicated once so a linear -50% translate loops
     seamlessly; paused on hover/touch, skipped under reduced motion. */
  var logos = document.getElementById('logos3');
  if (logos) {
    var track = logos.querySelector('.logos3__track');
    var originals = Array.from(track.children);
    var mobile = window.matchMedia('(max-width: 768px)');
    var duplicated = false;

    // each logo is half the strip's own width (so two show at a time, as
    // before); flex-basis can't be a % here since the track's width is
    // itself content-based, so it's measured and written as a px variable.
    function sizeLogos() { logos.style.setProperty('--logo-w', (logos.clientWidth / 2) + 'px'); }

    function setMarquee(on) {
      if (on && !duplicated) {
        originals.forEach(function (li) { track.appendChild(li.cloneNode(true)); });
        duplicated = true;
      } else if (!on && duplicated) {
        Array.from(track.children).forEach(function (li) {
          if (originals.indexOf(li) < 0) li.remove();
        });
        duplicated = false;
      }
      if (on) sizeLogos();
      logos.classList.toggle('is-marquee', on && !noAnim);
    }
    setMarquee(mobile.matches);
    if (mobile.addEventListener) mobile.addEventListener('change', function (e) { setMarquee(e.matches); });
    window.addEventListener('resize', function () { if (mobile.matches) sizeLogos(); });

    logos.addEventListener('mouseenter', function () { logos.classList.add('is-paused'); });
    logos.addEventListener('mouseleave', function () { logos.classList.remove('is-paused'); });
    logos.addEventListener('touchstart', function () { logos.classList.add('is-paused'); }, { passive: true });
    logos.addEventListener('touchend', function () { logos.classList.remove('is-paused'); }, { passive: true });
  }
})();
