/* =========================================================
   Split-lines scroll animation (intro copy)
   Each line of the intro is wrapped in .sl-line and its --sl-p custom
   property is scrubbed 0% -> 100% as the line crosses the viewport, so the
   ink sweeps in left-to-right over a faint copy of the same line (see
   .sl-line in css/sections.css). Re-splits on width changes.
   Scoped to SL_SELECTOR only.
   ========================================================= */
(function () {
  'use strict';

  var SL_SELECTOR = '.container--narrow .intro__text';
  var targets = Array.prototype.slice.call(document.querySelectorAll(SL_SELECTOR));
  if (!targets.length) return;

  var params = new URLSearchParams(window.location.search);
  if (params.has('noanim')) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var triggers = [];

  function splitElement(el) {
    if (el.dataset.slOriginal === undefined) el.dataset.slOriginal = el.innerHTML;

    // Honour the authored <br> breaks: measure with them in place.
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === 'BR') {
        // keep <br> only while it is still displayed (CSS may hide it)
        frag.appendChild(node.cloneNode(false));
        return;
      }
      var text = node.textContent;
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'sl-word';
        w.textContent = part;
        frag.appendChild(w);
      });
    });
    el.innerHTML = '';
    el.appendChild(frag);

    var words = Array.prototype.slice.call(el.querySelectorAll('.sl-word'));
    var lines = [], current = null, lastTop = null;
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) { current = []; lines.push(current); lastTop = top; }
      current.push(w);
    });

    var out = document.createDocumentFragment();
    lines.forEach(function (lineWords) {
      var line = document.createElement('span');
      line.className = 'sl-line';
      line.textContent = lineWords.map(function (w) { return w.textContent; }).join(' ');
      out.appendChild(line);
    });
    el.innerHTML = '';
    el.appendChild(out);
  }

  function animate(el) {
    el.querySelectorAll('.sl-line').forEach(function (line) {
      var tween = gsap.fromTo(line, { '--sl-p': '0%' }, {
        '--sl-p': '100%',
        ease: 'none',
        scrollTrigger: { trigger: line, start: 'top 88%', end: 'top 48%', scrub: 1 }
      });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });
  }

  function build() {
    targets.forEach(function (el) { splitElement(el); animate(el); });
    ScrollTrigger.refresh();
  }

  function teardown() {
    triggers.forEach(function (t) { t.kill(); });
    triggers = [];
    targets.forEach(function (el) {
      if (el.dataset.slOriginal !== undefined) el.innerHTML = el.dataset.slOriginal;
    });
  }

  function start() { build(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener('load', start);

  var lastWidth = window.innerWidth, resizeTimer;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { teardown(); build(); }, 200);
  });
})();
