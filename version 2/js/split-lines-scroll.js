/* =========================================================
   Split-lines scroll animation
   Port of the effect on text-animation-on-scroll-custom.webflow.io:
   each line gets an overlay mask pinned to its right edge whose width
   scrubs 100% -> 0% as the line crosses the viewport, so the copy wipes
   in left-to-right on scroll down and un-wipes on scroll up.

   Scoped to SL_SELECTOR only — it touches no other element.
   ========================================================= */
(function () {
  'use strict';

  var SL_SELECTOR = '.container--narrow.intro__text, .container--narrow .intro__text';

  var targets = Array.prototype.slice.call(document.querySelectorAll(SL_SELECTOR));
  if (!targets.length) return;

  // No GSAP / reduced motion: leave the text exactly as authored.
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var triggers = [];

  /* ---------- Split one element into .sl-line wrappers ---------- */
  function splitElement(el) {
    // Remember the original markup so resize re-splits from a clean slate.
    if (el.dataset.slOriginal === undefined) el.dataset.slOriginal = el.innerHTML;

    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    // 1. Wrap every word so we can read its offsetTop.
    var frag = document.createDocumentFragment();
    text.split(' ').forEach(function (word, i) {
      if (i) frag.appendChild(document.createTextNode(' '));
      var w = document.createElement('span');
      w.className = 'sl-word';
      w.textContent = word;
      frag.appendChild(w);
    });
    el.innerHTML = '';
    el.appendChild(frag);

    // 2. Group words that share a baseline into lines.
    var words = Array.prototype.slice.call(el.querySelectorAll('.sl-word'));
    var lines = [];
    var current = null;
    var lastTop = null;
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        current = [];
        lines.push(current);
        lastTop = top;
      }
      current.push(w);
    });

    // 3. Rebuild as .sl-line blocks, each carrying its own mask.
    var out = document.createDocumentFragment();
    lines.forEach(function (lineWords) {
      var line = document.createElement('span');
      line.className = 'sl-line';
      lineWords.forEach(function (w, i) {
        if (i) line.appendChild(document.createTextNode(' '));
        line.appendChild(document.createTextNode(w.textContent));
      });
      var mask = document.createElement('span');
      mask.className = 'sl-line__mask';
      line.appendChild(mask);
      out.appendChild(line);
    });
    el.innerHTML = '';
    el.appendChild(out);
  }

  /* ---------- Scrubbed wipe, one ScrollTrigger per line ---------- */
  function animate(el) {
    el.querySelectorAll('.sl-line').forEach(function (line) {
      var mask = line.querySelector('.sl-line__mask');
      if (!mask) return;
      var tween = gsap.fromTo(mask,
        { width: '100%' },
        {
          width: '0%',
          ease: 'none',
          scrollTrigger: {
            trigger: line,
            start: 'top 85%',
            end: 'top 45%',
            scrub: 1
          }
        });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });
  }

  function build() {
    targets.forEach(function (el) {
      splitElement(el);
      animate(el);
    });
    ScrollTrigger.refresh();
  }

  function teardown() {
    triggers.forEach(function (t) { t.kill(); });
    triggers = [];
    targets.forEach(function (el) {
      if (el.dataset.slOriginal !== undefined) el.innerHTML = el.dataset.slOriginal;
    });
  }

  /* ---------- Boot after fonts so line breaks are measured correctly ---------- */
  function start() { build(); }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start);
  }

  // Re-split only when the width actually changes (ignores mobile URL-bar resizes).
  var lastWidth = window.innerWidth;
  var resizeTimer;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      teardown();
      build();
    }, 200);
  });
})();
