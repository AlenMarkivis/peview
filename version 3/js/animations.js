/* =========================================================
   GSAP + ScrollTrigger animations — version 3
   Hero scroll sequence, philosophy parallax, section reveals.
   QA: `?noanim` renders every final state with no motion.
   ========================================================= */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var noAnim = params.has('noanim');

  // Fallback: if GSAP failed to load, reveal everything so no content stays hidden.
  function revealFallback() {
    document.documentElement.classList.add('no-anim');
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
  }
  if (noAnim || !window.gsap || !window.ScrollTrigger) { revealFallback(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { revealFallback(); return; }

  gsap.defaults({ ease: 'power3.out', duration: 1 });

  var vh = function (n) { return window.innerHeight * n / 100; };

  /* ---------- Helpers ---------- */
  function splitAll() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      SplitText.split(el, el.dataset.split);
    });
  }

  function revealChars(el, opts) {
    opts = opts || {};
    var chars = el.querySelectorAll('.split-char');
    if (!chars.length) return;
    gsap.set(chars, { yPercent: 110, opacity: 0, rotateX: -40, transformOrigin: '50% 100%' });
    gsap.set(el, { perspective: 600 });
    return gsap.to(chars, {
      yPercent: 0, opacity: 1, rotateX: 0,
      duration: 0.9,
      stagger: { each: opts.each || 0.03, from: opts.from || 'start' },
      ease: 'power4.out',
      scrollTrigger: { trigger: opts.triggerEl || el, start: opts.start || 'top 85%', once: true }
    });
  }

  function revealLines(el, start) {
    var inners = el.querySelectorAll('.split-inner');
    if (!inners.length) return;
    gsap.set(inners, { yPercent: 110 });
    return gsap.to(inners, {
      yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: start || 'top 85%', once: true }
    });
  }

  /* ---------- HERO: scroll-driven sequence ----------
     Mirrors the Figma "Scroll Test" frames. Progress 0→1 runs across the
     pinned distance (.hero3 height − viewport):
       · sky / mountains / forest drift up at 14 / 34 / 36 vh (parallax)
       · 0.00–0.32  headline lifts and fades out
       · 0.16–0.34  "We believe…" fades up in, 0.46–0.62 fades up out
       · 0.56–0.80  "Together we create" fades up in and holds
     .page-below (with its curve) rides over the stage for the last
     --hero-overlap of the pin on its own — it is normal document flow. */
  function heroScroll() {
    var hero = document.querySelector('.hero3');
    if (!hero) return;
    var sky = hero.querySelector('.hero3__layer--sky');
    var mtn = hero.querySelector('.hero3__layer--mtn');
    var forest = hero.querySelector('.hero3__layer--forest');
    var green = hero.querySelector('.hero3__green');
    var title = hero.querySelector('.hero3__title');
    var believe = hero.querySelector('.hero3__believe');
    var together = hero.querySelector('.hero3__together');

    var isPhone = function () { return window.innerWidth <= 768; };

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    // layers (function values so a resize re-computes the vh distances)
    tl.to(sky, { y: function () { return -vh(isPhone() ? 10 : 14); }, scale: 1.08 }, 0)
      .to(mtn, { y: function () { return -vh(isPhone() ? 28 : 34); } }, 0)
      .to(forest, { y: function () { return -vh(isPhone() ? 30 : 36); } }, 0)
      .to(green, { y: function () { return -vh(isPhone() ? 30 : 36); } }, 0);

    // headline out
    tl.fromTo(title, { y: 0, opacity: 1 }, { y: function () { return -vh(26); }, opacity: 0, duration: 0.32 }, 0);

    // "We believe" in, hold, out
    tl.fromTo(believe, { y: function () { return vh(12); }, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18 }, 0.16)
      .to(believe, { y: function () { return -vh(14); }, opacity: 0, duration: 0.16 }, 0.46);

    // "Together we create" in and hold
    tl.fromTo(together, { y: function () { return vh(14); }, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24 }, 0.56)
      .to(together, { y: 0, duration: 0.2 }, 0.8);
  }

  /* ---------- PHILOSOPHY: artworks travel up toward the headline ----------
     Each artwork starts lower (data-phil-speed scales the distance: the
     centre Orian ring furthest, the brain least) and scrubs to its resting
     place as the row scrolls into view — the "distance between the title and
     the elements reduces on scroll" parallax. */
  function philosophyParallax() {
    var row = document.querySelector('.phil3__row');
    if (!row) return;
    var items = gsap.utils.toArray('.phil3__item');
    items.forEach(function (item) {
      var speed = parseFloat(item.dataset.philSpeed || '1');
      gsap.fromTo(item, { y: function () { return Math.min(vh(22), 240) * speed; } }, {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top 100%',
          end: 'top 18%',
          scrub: 0.4,
          invalidateOnRefresh: true
        }
      });
    });
    // the headline itself eases up a touch slower than the page (gentle parallax)
    var head = document.querySelector('.phil3__head');
    if (head) {
      gsap.fromTo(head, { y: 0 }, {
        y: -40, ease: 'none',
        scrollTrigger: { trigger: head, start: 'top 60%', end: 'bottom 10%', scrub: 0.4 }
      });
    }
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal:not(.cta3__actions)').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    var groups = ['.help3-grid', '.masonry__col', '.careers3'];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        var items = group.querySelectorAll('.reveal-up');
        if (!items.length) return;
        gsap.fromTo(items, { opacity: 0, y: 60, scale: 0.98 }, {
          opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        });
      });
    });

    document.querySelectorAll('[data-split="chars"]').forEach(function (el) {
      revealChars(el, { each: el.classList.contains('eyebrow') ? 0.012 : 0.035 });
    });
    document.querySelectorAll('[data-split="lines"]').forEach(function (el) {
      if (el.closest('.cta3')) return; // timed in cta()
      revealLines(el);
    });
  }

  /* ---------- CTA: title lines + buttons share one trigger ---------- */
  function cta() {
    var block = document.querySelector('.cta3 .cta3__inner');
    if (!block) return;
    var title = block.querySelector('.cta3__title');
    var lines = title ? title.querySelectorAll('.split-inner') : [];
    var actions = block.querySelector('.cta3__actions');
    if (!lines.length && !actions) return;

    if (lines.length) gsap.set(lines, { yPercent: 110 });
    if (actions) gsap.set(actions, { opacity: 0, y: 20 });

    var tl = gsap.timeline({ paused: true });
    if (lines.length) tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 0);
    if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.9 }, lines.length ? 0.25 : 0);

    ScrollTrigger.create({ trigger: block, start: 'top 75%', once: true, onEnter: function () { tl.play(); } });
  }

  /* ---------- Competencies: cards stack in one by one (v2) ---------- */
  function competencies() {
    var cards = gsap.utils.toArray('.comp-row .comp-card');
    if (!cards.length) return;
    var trigger = { trigger: '.comp-row', start: 'top 80%', once: true };
    gsap.fromTo(cards,
      { opacity: 0, yPercent: 26, scale: 0.9, filter: 'blur(9px)' },
      {
        opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)',
        duration: 1.0, ease: 'expo.out',
        stagger: { each: 0.09, from: 'start' },
        immediateRender: false,
        clearProps: 'transform,filter',
        scrollTrigger: trigger
      });
    var imgs = gsap.utils.toArray('.comp-card a > img');
    gsap.fromTo(imgs,
      { yPercent: 18, scale: 1.14 },
      {
        yPercent: 0, scale: 1, duration: 1.15, ease: 'expo.out',
        stagger: { each: 0.09, from: 'start' }, delay: 0.12, immediateRender: false,
        clearProps: 'transform',
        scrollTrigger: trigger
      });
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

  /* ---------- Philosophy videos: still at rest, play while hovered ---------- */
  function philVideos() {
    var vids = document.querySelectorAll('[data-phil-video]');
    if (!vids.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.preload = 'auto';
          entry.target.load();
          io.unobserve(entry.target);
        });
      }, { rootMargin: '300px' });
      vids.forEach(function (v) { io.observe(v); });
    }
    var FADE_MS = 450;
    vids.forEach(function (v) {
      var orb = v.closest('.phil3__item');
      if (!orb) return;
      var timer = null;
      var play = function () {
        if (timer) { clearTimeout(timer); timer = null; }
        var p = v.play();
        if (p && p.catch) { p.catch(function () {}); }
      };
      var rewind = function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          timer = null;
          v.pause();
          try { v.currentTime = 0; } catch (e) {}
        }, FADE_MS);
      };
      orb.addEventListener('mouseenter', play);
      orb.addEventListener('focusin', play);
      orb.addEventListener('mouseleave', rewind);
      orb.addEventListener('focusout', rewind);
    });
  }

  /* ---------- Why clients: infinite vertical card marquee (v2) ---------- */
  function whyMarquee() {
    var track = document.querySelector('.why__track');
    if (!track) return;
    var cards = Array.from(track.children);
    cards.forEach(function (c) { track.appendChild(c.cloneNode(true)); });

    var gap = parseFloat(getComputedStyle(track).gap) || 40;
    var loopHeight = cards.reduce(function (sum, c) { return sum + c.offsetHeight + gap; }, 0);

    var tween = gsap.to(track, {
      y: -loopHeight,
      duration: cards.length * 4.2,
      ease: 'none',
      repeat: -1,
      modifiers: { y: gsap.utils.unitize(function (y) { return parseFloat(y) % loopHeight; }) }
    });

    var stack = document.querySelector('.why__stack');
    stack.addEventListener('mouseenter', function () { gsap.to(tween, { timeScale: 0.15, duration: 0.6 }); });
    stack.addEventListener('mouseleave', function () { gsap.to(tween, { timeScale: 1, duration: 0.6 }); });

    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 800, 3);
        if (v > 0.2) gsap.to(tween, { timeScale: 1 + v, duration: 0.3, overwrite: true, onComplete: function () { gsap.to(tween, { timeScale: 1, duration: 1.2 }); } });
      }
    });
  }

  /* ---------- Background parallax for full-bleed sections ---------- */
  function bgParallax() {
    document.querySelectorAll('[data-parallax-bg]').forEach(function (img) {
      var section = img.closest('section');
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Slow zoom on the help background ---------- */
  function bgZoom() {
    var img = document.querySelector('.help3__bg img');
    if (!img) return;
    gsap.fromTo(img, { scale: 1 }, {
      scale: 1.1, duration: 10, ease: 'power1.out',
      scrollTrigger: { trigger: img.closest('section'), start: 'top 75%', once: true }
    });
  }

  /* ---------- "How can we help": title drifts ---------- */
  function help() {
    var t = document.querySelector('.help3__title');
    if (!t) return;
    gsap.to(t, {
      yPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '.help3', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Industries panel entrance ---------- */
  function industries() {
    var panel = document.querySelector('.ind3__panel');
    if (!panel) return;
    gsap.fromTo(panel, { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: panel, start: 'top 85%', once: true }
    });
    var tabs = gsap.utils.toArray('.ind3__tab');
    gsap.fromTo(tabs, { opacity: 0, x: -16 }, {
      opacity: 1, x: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: panel, start: 'top 80%', once: true }
    });
  }

  /* ---------- Filter bar, logos, footer entrances ---------- */
  function misc() {
    gsap.fromTo('.filter__tags .tag',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, immediateRender: false, clearProps: 'transform',
        scrollTrigger: { trigger: '.filter', start: 'top 88%', once: true } });
    if (window.innerWidth > 768) {
      gsap.fromTo('.logos3 .logo3',
        { opacity: 0, y: 24, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.8, immediateRender: false, clearProps: 'transform',
          scrollTrigger: { trigger: '.logos3', start: 'top 85%', once: true } });
    }
    gsap.from('.footer__cols .footer__col', {
      opacity: 0, y: 20, stagger: 0.08, duration: 0.8,
      scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true }
    });
    gsap.from('.footer__logo', {
      opacity: 0, scale: 0.9, duration: 1,
      scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true }
    });
    document.querySelectorAll('.help3__curve, .cta3__curve').forEach(function (c) {
      gsap.from(c, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    splitAll();
    heroScroll();
    philosophyParallax();
    reveals();
    cta();
    competencies();
    philVideos();
    whyMarquee();
    bgParallax();
    bgZoom();
    help();
    industries();
    misc();
    ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
