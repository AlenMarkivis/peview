/* =========================================================
   House of X-Factors — GSAP + ScrollTrigger animations
   Same motion vocabulary as the home page and the HI/AI page:
   masked line reveals, char-split headings, scroll reveals and
   scrubbed background parallax.
   ========================================================= */
(function () {
  'use strict';

  function revealFallback() {
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* ---------- Video card: swap the poster for the film ---------- */
  // Runs before the GSAP guards below so the film still plays with reduced motion.
  function videoPlayer() {
    document.querySelectorAll('.video-card[data-video]').forEach(function (card) {
      var frame = card.querySelector('.video-card__frame');
      var play = card.querySelector('.video-card__play');
      if (!frame || !play) return;

      function start() {
        if (card.classList.contains('is-playing')) return;
        var src = card.dataset.video;
        if (!src) return;

        var video = document.createElement('video');
        video.src = src;
        video.poster = card.querySelector('.video-card__img').src;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'auto';

        frame.appendChild(video);
        frame.hidden = false;
        card.classList.add('is-playing');

        // The click is a user gesture, so sound is normally allowed; if the
        // browser still blocks it, fall back to a muted autoplay.
        var p = video.play();
        if (p && p.catch) {
          p.catch(function () {
            video.muted = true;
            video.play();
          });
        }
      }

      play.addEventListener('click', start);
      // Clicking anywhere on the poster starts it too; once playing the video
      // owns the pointer, so this never steals its own controls.
      card.addEventListener('click', function (e) {
        if (card.classList.contains('is-playing')) return;
        if (e.target === play || play.contains(e.target)) return;
        start();
      });
    });
  }
  videoPlayer();

  if (!window.gsap || !window.ScrollTrigger) { revealFallback(); cultureTabs(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?noanim` renders the final static state (used for design QA screenshots)
  if (reduce || /noanim/.test(location.search)) { revealFallback(); cultureTabs(); return; }

  gsap.defaults({ ease: 'power3.out', duration: 1 });

  function splitAll() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      SplitText.split(el, el.dataset.split);
    });
  }

  function revealChars(el, opts) {
    opts = opts || {};
    var chars = el.querySelectorAll('.split-char');
    if (!chars.length) return;
    gsap.set(el, { perspective: 600 });
    gsap.set(chars, { yPercent: 110, opacity: 0, rotateX: -40, transformOrigin: '50% 100%' });
    gsap.to(chars, {
      yPercent: 0, opacity: 1, rotateX: 0, duration: 0.9,
      stagger: { each: opts.each || 0.028, from: opts.from || 'start' },
      ease: 'power4.out',
      scrollTrigger: { trigger: opts.triggerEl || el, start: opts.start || 'top 85%', once: true }
    });
  }

  /* ---------- Hero ---------- */
  function hero() {
    var lines = document.querySelectorAll('.hero__title .split-inner');
    var nav = document.querySelector('.nav');
    var photo = document.querySelector('.hero__photo');
    var eyebrow = document.querySelector('.hero__eyebrow');

    gsap.set(lines, { yPercent: 115, rotate: 2, transformOrigin: '0% 100%' });
    gsap.set(nav, { y: -30, opacity: 0 });
    gsap.set(eyebrow, { opacity: 0, y: 20 });
    gsap.set(photo, { scale: 1.12 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(lines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14, ease: 'power4.out' }, 0.4)
      .to(eyebrow, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.0)
      .to(nav, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0.85);

    // slow one-way zoom
    gsap.to(photo, { scale: 1.22, duration: 12, ease: 'power1.out', delay: 0.6 });

    // Scroll parallax on the background only. The hero copy is deliberately left
    // alone so it stays pinned in place while the page scrolls up over it.
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to(photo, { yPercent: 8, ease: 'none' }, 0);
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // The competency cards have their own entrance — see competencies().

    document.querySelectorAll('[data-split="chars"]').forEach(function (el) {
      // The CTA heading shares cta()'s trigger so it plays with that sequence.
      var ctaSection = el.closest('.cta-hoax');
      revealChars(el, ctaSection
        ? { each: 0.03, triggerEl: ctaSection, start: 'top 70%' }
        : { each: 0.03 });
    });
  }

  /* ---------- Brain: the image settles in, then the two skill columns
     uncover outward — left first, right second — mirroring the HI/AI
     column reveal. The panel behind them fades up with the group. ---------- */
  function brain() {
    var stage = document.querySelector('.brain__stage');
    if (!stage) return;
    var img = stage.querySelector('.brain__img');
    var panel = stage.querySelector('.brain__panel');
    var left = stage.querySelector('.brain__col--left');
    var right = stage.querySelector('.brain__col--right');
    if (!img || !left || !right) return;

    var leftItems = Array.prototype.slice.call(left.children);
    var rightItems = Array.prototype.slice.call(right.children);

    // Set start states up front rather than relying on from() tweens inside a
    // timeline, whose immediateRender behaviour would let the columns flash in
    // at full opacity before the trigger fires.
    gsap.set(leftItems.concat(rightItems), { opacity: 0, y: 28 });
    gsap.set(img, { opacity: 0, scale: 0.92, y: 30 });
    if (panel) gsap.set(panel, { opacity: 0, scaleY: 0.9, transformOrigin: '50% 100%' });

    // A fresh vars object per tween — GSAP writes internal state onto the one it
    // is handed, so the two column steps must not share it.
    function step() {
      return {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out',
        clearProps: 'opacity,transform'
      };
    }

    var tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 78%', once: true } });
    if (panel) tl.to(panel, { opacity: 1, scaleY: 1, duration: 1.1, ease: 'power3.out' }, 0);
    tl.to(img, { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out' }, 0)
      .to(leftItems, step(), 0.45)
      .to(rightItems, step(), '>');

    // A very slight counter-drift keeps the brain feeling buoyant on scroll.
    gsap.to(img, {
      yPercent: -4, ease: 'none',
      scrollTrigger: { trigger: '.brain', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Video card: scales up on entry, poster drifts on scroll ---------- */
  function videoCard() {
    var card = document.querySelector('.video-card');
    if (!card) return;
    var img = card.querySelector('.video-card__img');
    var title = card.querySelector('.video-card__title');
    var play = card.querySelector('.video-card__play');

    gsap.fromTo(card, { scale: 0.94, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });
    gsap.fromTo(title, { opacity: 0, x: -40 }, {
      opacity: 1, x: 0, duration: 1.1, ease: 'power3.out', delay: 0.25,
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });
    gsap.fromTo(play, { opacity: 0, scale: 0.7 }, {
      opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.7)', delay: 0.45,
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });
    if (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ---------- Cultural engine: the initiative list ticks in from the left ---------- */
  function culture() {
    var list = document.querySelector('.culture__list');
    var panel = document.querySelector('.culture__panel');
    if (list) {
      var items = list.querySelectorAll('.culture__item');
      // This is the rows' only entrance tween — they no longer carry .reveal,
      // whose separate y-tween fought this one and left a stray x offset.
      gsap.fromTo(items, { opacity: 0, x: -24 }, {
        opacity: 1, x: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: list, start: 'top 82%', once: true }
      });
    }
    if (panel) {
      gsap.fromTo(panel, { opacity: 0, y: 40, scale: 0.97 }, {
        opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: panel, start: 'top 85%', once: true }
      });
    }
  }

  /* ---------- Background parallax ---------- */
  // Same two-layer treatment as the home page CTA: a scrubbed ±8% drift plus a
  // slow one-shot zoom. Scale and translate live on separate tweens so they
  // never fight each other on the same image.
  function backgrounds() {
    var hills = document.querySelector('.cta-hoax__hills img');
    if (hills) {
      gsap.fromTo(hills, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.cta-hoax', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(hills, { scale: 1 }, {
        scale: 1.12, duration: 10, ease: 'power1.out',
        scrollTrigger: { trigger: '.cta-hoax', start: 'top 75%', once: true }
      });
    }
  }

  /* ---------- CTA: plays once the section scrolls into view ----------
     The landscape rises and fades in, then the two buttons pop up in turn.
     The heading's char reveal comes from reveals(), retargeted here to the
     same trigger so the three read as one sequence. The hills wrapper is
     animated rather than its img, which already carries the parallax and
     zoom tweens. */
  function cta() {
    var section = document.querySelector('.cta-hoax');
    if (!section) return;
    var hills = section.querySelector('.cta-hoax__hills');
    var btns = section.querySelectorAll('.cta-hoax__actions .btn');

    if (hills) gsap.set(hills, { opacity: 0, y: 80 });
    if (btns.length) gsap.set(btns, { opacity: 0, y: 30, scale: 0.9 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 70%', once: true } });
    if (hills) tl.to(hills, { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, 0);
    if (btns.length) {
      tl.to(btns, {
        opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.12, ease: 'back.out(1.6)',
        clearProps: 'opacity,transform'
      }, 0.7);
    }
  }

  /* ---------- Footer ---------- */
  function footer() {
    gsap.from('.footer__cols .footer__col', {
      opacity: 0, y: 20, stagger: 0.08, duration: 0.8,
      scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true }
    });
    gsap.from('.footer__logo', {
      opacity: 0, scale: 0.9, duration: 1,
      scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true }
    });
  }

  /* ---------- Cultural engine tabs (works with or without GSAP) ----------
     Declared as a hoisted function so the no-GSAP early return above can
     still call it. */
  function cultureTabs() {
    var items = document.querySelectorAll('.culture__item');
    var panel = document.getElementById('culture-panel');
    if (!items.length || !panel) return;
    var img = panel.querySelector('.culture__media img');
    var title = panel.querySelector('.culture__title');
    var text = panel.querySelector('.culture__text');

    // Phones get an accordion: the one panel opens under whichever row is
    // active (CSS moves it there with `order`) and slides open and shut.
    // Desktop and tablet keep the tab list with its cross-fade.
    var phone = window.matchMedia('(max-width: 480px)');
    var $panel = window.jQuery ? window.jQuery(panel) : null;
    var SLIDE = 350;

    function fill(item) {
      title.textContent = item.dataset.title;
      text.textContent = item.dataset.text;
      if (item.dataset.img) img.src = item.dataset.img;
    }

    function activate(item) {
      items.forEach(function (i) {
        i.classList.remove('is-active', 'is-open');
        i.setAttribute('aria-selected', 'false');
      });
      item.classList.add('is-active');
      item.setAttribute('aria-selected', 'true');
    }

    function slideDown(item) {
      item.classList.add('is-open');
      if ($panel) $panel.stop(true).slideDown(SLIDE);
      else panel.style.display = '';
    }

    function slideUp(item, done) {
      item.classList.remove('is-open');
      if ($panel) $panel.stop(true).slideUp(SLIDE, done);
      else { panel.style.display = 'none'; if (done) done(); }
    }

    function phoneClick(item) {
      var open = panel.style.display !== 'none';
      if (item.classList.contains('is-active')) {
        // The open row toggles shut and back open.
        if (item.classList.contains('is-open')) slideUp(item);
        else slideDown(item);
        return;
      }
      var current = document.querySelector('.culture__item.is-active');
      function openNew() {
        activate(item);
        fill(item);
        slideDown(item);
      }
      if (open && current) slideUp(current, openNew);
      else openNew();
    }

    function desktopClick(item) {
      if (item.classList.contains('is-active')) return;
      activate(item);
      item.classList.add('is-open');

      // Fade the panel out, swap the content, fade it back in.
      panel.classList.add('is-swapping');
      window.setTimeout(function () {
        fill(item);
        panel.classList.remove('is-swapping');
      }, 280);
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        if (phone.matches) phoneClick(item);
        else desktopClick(item);
      });
    });

    // Leaving the phone layout with the accordion shut would strand the panel
    // hidden on desktop, so the slide's inline styles are cleared and the
    // active row is marked open again.
    function onChange() {
      if (phone.matches) return;
      if ($panel) $panel.stop(true, true);
      panel.style.display = '';
      var active = document.querySelector('.culture__item.is-active');
      if (active) active.classList.add('is-open');
    }
    if (phone.addEventListener) phone.addEventListener('change', onChange);
    else if (phone.addListener) phone.addListener(onChange);
  }

  /* ---------- Competency cards: stack in one by one ----------
     Same entrance as the home page Competencies row (home page/js/animations.js
     competencies()). */
  function competencies() {
    var cards = gsap.utils.toArray('.comp-row .comp-card');
    if (!cards.length) return;
    var trigger = { trigger: '.comp-row', start: 'top 80%', once: true };
    // Cards rise and sharpen into focus in a left-to-right wave (blur + scale settle).
    gsap.fromTo(cards,
      { opacity: 0, yPercent: 26, scale: 0.9, filter: 'blur(9px)' },
      {
        opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)',
        duration: 1.0, ease: 'expo.out',
        stagger: { each: 0.09, from: 'start' },
        immediateRender: false,
        // Clear inline transform/filter so the CSS hover state isn't blocked.
        clearProps: 'transform,filter',
        scrollTrigger: trigger
      });
    // The image inside each card slides up and un-zooms slightly behind the card's
    // clipped edge, giving the reveal depth. Lands a touch after the card.
    var imgs = gsap.utils.toArray('.comp-card a > img');
    gsap.fromTo(imgs,
      { yPercent: 18, scale: 1.14 },
      {
        yPercent: 0, scale: 1, duration: 1.15, ease: 'expo.out',
        stagger: { each: 0.09, from: 'start' }, delay: 0.12, immediateRender: false,
        clearProps: 'transform',
        scrollTrigger: trigger
      });
    // Titles fade up last for a crisp finish.
    var titles = gsap.utils.toArray('.comp-card__title');
    gsap.fromTo(titles,
      { opacity: 0, y: 14 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        stagger: { each: 0.09, from: 'start' }, delay: 0.22, immediateRender: false,
        clearProps: 'transform,opacity',
        scrollTrigger: trigger
      });
  }

  function init() {
    splitAll();
    hero();
    reveals();
    brain();
    videoCard();
    competencies();
    culture();
    cta();
    backgrounds();
    footer();
    cultureTabs();
    ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(init); }
  else { window.addEventListener('load', init); }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

/* ============================================================
   COMPETENCIES — drag to scroll the phone rail.
   Ported from the home page (home page/js/interactions.js).

   Below 768 the row becomes a horizontal snap strip (css/hoax.css).
   Touch scrolls it natively, but a pointer drag never scrolls an overflow
   container in any browser, so with a mouse or pen — including a desktop
   window resized to phone width, and touch-screen laptops — the rail looks
   frozen.

   The guard is whether the row actually overflows, not a media query, so it
   is inert while the desktop five-up row is laid out and switches itself on
   across a resize or orientation change without re-reading a breakpoint.
   ============================================================ */
(function () {
  var row = document.querySelector('.comp-row');
  if (!row || !window.PointerEvent) return;

  var THRESHOLD = 5;     // px of travel before a press counts as a drag
  var THROW_MS  = 120;   // how far a flick coasts, as ms of its exit velocity

  var id = null, startX = 0, startScroll = 0, dragged = false;
  var lastX = 0, lastT = 0, velocity = 0;

  function scrollable() { return row.scrollWidth - row.clientWidth > 1; }

  row.addEventListener('pointerdown', function (e) {
    // Touch already scrolls natively, with momentum no script matches.
    if (e.pointerType === 'touch') return;
    if (e.button !== 0 || !scrollable()) return;

    id = e.pointerId;
    startX = lastX = e.clientX;
    startScroll = row.scrollLeft;
    lastT = e.timeStamp;
    velocity = 0;
    dragged = false;
    // Capture is deliberately deferred to the threshold below: capturing on
    // pointerdown retargets the click to the row, so a plain click would no
    // longer land on the card's link.
  });

  row.addEventListener('pointermove', function (e) {
    if (id === null || e.pointerId !== id) return;

    var dx = e.clientX - startX;
    if (!dragged) {
      if (Math.abs(dx) < THRESHOLD) return;   // still a click; let it be one
      dragged = true;
      row.classList.add('is-dragging');
      row.setPointerCapture(id);
      // scroll-snap:x mandatory re-snaps on every scrollLeft assignment, which
      // makes a manual drag stutter. Off while dragging, handed back to the
      // stylesheet on release so letting go still settles on a card.
      row.style.scrollSnapType = 'none';
    }

    var dt = e.timeStamp - lastT;
    if (dt > 0) velocity = (e.clientX - lastX) / dt;   // px per ms
    lastX = e.clientX;
    lastT = e.timeStamp;

    row.scrollLeft = startScroll - dx;
    e.preventDefault();
  });

  function endDrag(e) {
    if (id === null || (e && e.pointerId !== id)) return;
    if (row.hasPointerCapture(id)) row.releasePointerCapture(id);
    id = null;
    if (!dragged) return;

    row.classList.remove('is-dragging');
    row.style.scrollSnapType = '';

    var thrown = velocity * THROW_MS;
    if (Math.abs(thrown) > 10) {
      row.scrollTo({ left: row.scrollLeft - thrown, behavior: 'smooth' });
    }
  }

  row.addEventListener('pointerup', endDrag);
  row.addEventListener('pointercancel', endDrag);

  // A drag ends in a click on whichever card is under the pointer. Capture
  // phase so it lands before the link, and only after real travel, so an
  // ordinary tap still follows the card.
  row.addEventListener('click', function (e) {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  }, true);

  row.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();
