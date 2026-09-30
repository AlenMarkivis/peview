/* =========================================================
   Version 3 interactions: hero load state, industries tabs,
   help cards on touch, partner-logo carousel (phone).
   No GSAP dependency — everything here is plain DOM.
   ========================================================= */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var noAnim = params.has('noanim') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (params.has('noanim')) document.documentElement.classList.add('no-anim');

  /* ---------- QA: ?y=<px> scrolls to a fixed position after load (headless captures) ---------- */
  if (params.has('y')) {
    document.documentElement.style.scrollBehavior = 'auto';
    window.addEventListener('load', function () {
      setTimeout(function () { window.scrollTo(0, +params.get('y') || 0); }, 400);
    });
  }

  /* ---------- Hero: dark + blurred "Start here" frame → clear ----------
     The stage boots with .is-loading (53% black tint, 16px blur, headline at
     36%). Dropping the class lets the CSS transitions carry it to the stage-1
     look. Skipped for the static QA render. */
  var stage = document.querySelector('.hero3__stage');
  if (stage) {
    if (!noAnim) {
      stage.classList.add('is-loading');
      var clear = function () { stage.classList.remove('is-loading'); };
      // one frame so the loading state is actually painted first
      requestAnimationFrame(function () { setTimeout(clear, 350); });
    }
  }

  /* ---------- Industries: tab hover / click swaps photo + copy ---------- */
  var ind = document.getElementById('industries');
  if (ind) {
    var tabs = Array.from(ind.querySelectorAll('.ind3__tab'));
    var bgs = Array.from(ind.querySelectorAll('.ind3__bg'));
    var copy = ind.querySelector('#ind3-copy');
    var current = 'consumer';
    var swapTimer = null;

    function activate(key) {
      if (key === current) return;
      current = key;
      tabs.forEach(function (t) {
        var on = t.dataset.ind === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      bgs.forEach(function (b) { b.classList.toggle('is-active', b.dataset.indBg === key); });

      var tab = tabs.find(function (t) { return t.dataset.ind === key; });
      if (!tab || !copy) return;
      var text = tab.dataset.copy;
      if (noAnim) { copy.textContent = text; return; }
      clearTimeout(swapTimer);
      copy.classList.add('is-swapping');
      swapTimer = setTimeout(function () {
        copy.textContent = text;
        copy.classList.remove('is-swapping');
      }, 260);
    }

    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.ind); });
      if (canHover) t.addEventListener('mouseenter', function () { activate(t.dataset.ind); });
      t.addEventListener('focus', function () { activate(t.dataset.ind); });
    });
    // keyboard: arrows move between tabs
    ind.querySelector('.ind3__tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var i = tabs.findIndex(function (t) { return t.dataset.ind === current; });
      var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      e.preventDefault();
    });
  }

  /* ---------- Help cards: tap toggles the open state on touch ---------- */
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
     Below 768 the 3x3 grid becomes a snap strip showing two logos at a time.
     Autoplays every 2.8s, pauses while the user is touching it, and draws
     one dot per page. Above 768 the strip is a grid and this stays inert
     (the `scrollable()` guard, not a media query). */
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
      var n = pageCount();
      for (var i = 0; i < n; i++) {
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
      var next = (pageIndex() + 1) % pageCount();
      track.scrollTo({ left: track.clientWidth * next, behavior: 'smooth' });
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

    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      drawDots(); restart();
    });
    drawDots();
    restart();
  }
})();
