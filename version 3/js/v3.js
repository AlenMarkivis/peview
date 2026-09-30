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
     Matches the prototype: the page opens on the dark "Start here" frame,
     clears to the mountains + headline, and the nav slides in after. */
  var stage = document.querySelector('.hero3__stage');
  var HOLD = 900;         // ms on the dark frame
  var CLEAR = 1400;       // matches the CSS transitions
  function reveal() {
    if (stage) stage.classList.remove('is-loading');
    setTimeout(function () { document.body.classList.remove('hero-loading'); }, noAnim ? 0 : CLEAR * 0.55);
  }
  if (noAnim) reveal();
  else if (document.readyState === 'complete') setTimeout(reveal, HOLD);
  else window.addEventListener('load', function () { setTimeout(reveal, HOLD); });
  setTimeout(reveal, 4500); // safety: never stay dark if load stalls

  /* ---------- Hero sheet -> page hand-off ----------
     The white sheet (curve + intro) ends the pin with its top at 806/1080 of
     the viewport. .page-below must start exactly where the sheet ends, so its
     top margin = sheet bottom - stage height. Recomputed on resize. */
  var sheet = document.querySelector('.hero3__sheet');
  var below = document.querySelector('.page-below');
  function syncSheet() {
    if (!sheet || !below || !stage) return;
    var H = stage.offsetHeight;
    var top = H * 806 / 1080;
    below.style.marginTop = Math.max(0, Math.round(top + sheet.offsetHeight - H)) + 'px';
  }
  syncSheet();
  window.v3SyncSheet = syncSheet;
  var lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
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
    var current = 'consumer';
    var swapTimer = null;
    var accordion = window.matchMedia('(max-width: 1024px)');

    // accordion panels, one per tab
    tabs.forEach(function (t) {
      var acc = document.createElement('div');
      acc.className = 'ind3__acc';
      acc.id = 'ind3-acc-' + t.dataset.ind;
      var inner = document.createElement('div');
      inner.className = 'ind3__acc-inner';
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

    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        // accordion: tapping the open row closes it
        if (accordion.matches && t.dataset.ind === current && t.getAttribute('aria-expanded') === 'true') {
          setOpen(null); return;
        }
        activate(t.dataset.ind, true);
        if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 520);
      });
      t.addEventListener('mouseenter', function () { if (canHover.matches && !accordion.matches) activate(t.dataset.ind); });
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

  /* ---------- Partner logos: phone carousel ----------
     Below 768 the 3x3 grid becomes a snap strip showing two logos at a time,
     autoplaying every 2.8s with one dot per page. Inert while it is a grid. */
  var logos = document.getElementById('logos3');
  if (logos) {
    var track = logos.querySelector('.logos3__track');
    var dotsWrap = logos.querySelector('.logos3__dots');
    var timer = null;
    var paused = false;

    function scrollable() { return track.scrollWidth - track.clientWidth > 4; }
    function pageCount() { return Math.max(1, Math.round(track.scrollWidth / track.clientWidth)); }
    function pageIndex() { return Math.round(track.scrollLeft / track.clientWidth); }

    function drawDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      if (!scrollable()) return;
      for (var i = 0; i < pageCount(); i++) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'logos3__dot' + (i === pageIndex() ? ' is-active' : '');
        d.setAttribute('aria-label', 'Logos page ' + (i + 1));
        d.dataset.page = i;
        d.addEventListener('click', function (e) {
          track.scrollTo({ left: track.clientWidth * (+e.currentTarget.dataset.page), behavior: 'smooth' });
          restart();
        });
        dotsWrap.appendChild(d);
      }
    }
    function syncDots() {
      if (!dotsWrap) return;
      var idx = pageIndex();
      Array.from(dotsWrap.children).forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }
    function advance() {
      if (paused || !scrollable() || noAnim) return;
      track.scrollTo({ left: track.clientWidth * ((pageIndex() + 1) % pageCount()), behavior: 'smooth' });
    }
    function restart() {
      clearInterval(timer);
      if (scrollable() && !noAnim) timer = setInterval(advance, 2800);
    }

    track.addEventListener('scroll', syncDots, { passive: true });
    track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    track.addEventListener('touchend', function () { paused = false; restart(); }, { passive: true });
    track.addEventListener('mouseenter', function () { paused = true; });
    track.addEventListener('mouseleave', function () { paused = false; });

    var logoW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === logoW) return;
      logoW = window.innerWidth;
      drawDots(); restart();
    });
    drawDots();
    restart();
  }
})();
