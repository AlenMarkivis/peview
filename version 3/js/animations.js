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

  /* ---------- HERO: scroll-driven parallax sequence ----------
     Offsets are the Figma "Scroll Test" frames (1920 x 1080 viewport, design
     px) times the hero scale --u (js/v3.js), so layers, copy and the white
     sheet stay registered at any size. Each Figma frame is a hold where
     nothing moves, so its line can be read before the next move. Progress
     0 -> 1 spans the pin.
       0.00-0.08  hold on the headline; "We believe" fades in behind the forest
       0.08-0.38  stage 3 -> 4: sky + mountains rise 369, headline only 257
                  (so the ridge slides over it), "We believe" 470, forest 139,
                  sheet 156, "Together" starts rising from behind the sheet
       0.38-0.52  hold: "We believe" mid-screen
       0.52-0.82  stage 4 -> 5: sky + mountains hold, headline and "We
                  believe" leave the top, forest rises 249, "Together" lands
                  over the forest, sheet lands at 806
       0.82-1.00  hold on the white "Together"
     After the pin everything scrolls away together (stage 5 -> 6 -> final);
     "Together" turns green over the first stretch of that (stage 6). */
  function heroScroll() {
    var hero = document.querySelector('.hero3');
    if (!hero) return;
    var stage = hero.querySelector('.hero3__stage');
    var q = function (sel) { return hero.querySelector(sel); };
    var sky = q('.hero3__layer--sky'), mtn = q('.hero3__layer--mtn'), forest = q('.hero3__layer--forest');
    var green = q('.hero3__green');
    var title = q('.hero3__txt--title'), believe = q('.hero3__txt--believe'), together = q('.hero3__txt--together');
    var accent = q('.hero3__together--accent'), sheet = q('.hero3__sheet');

    // design px -> live px (same unit as the CSS --u)
    var u = window.v3HeroU || function () { return Math.max(stage.offsetWidth / 1920, stage.offsetHeight / 1080); };
    var d = function (px) { return function () { return px * u(); }; };
    var MOVE = 'power1.inOut'; // eases into and out of each hold

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });

    // stage 3: headline hold
    tl.fromTo(believe, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0);

    // 3 -> 4, then hold on "We believe"
    var B = 0.08, BD = 0.30;
    tl.fromTo([sky, mtn], { y: 0 }, { y: d(-369), duration: BD, ease: MOVE }, B)
      .fromTo(title, { y: 0, opacity: 1 }, { y: d(-257), opacity: 0.37, duration: BD, ease: MOVE }, B)
      .fromTo(believe, { y: 0 }, { y: d(-470), duration: BD, ease: MOVE }, B)
      .fromTo(forest, { y: 0 }, { y: d(-139), duration: BD, ease: MOVE }, B)
      .fromTo(green, { y: 0 }, { y: d(-149), duration: BD, ease: MOVE }, B)
      .fromTo(together, { y: 0, opacity: 0 }, { y: d(-127), opacity: 1, duration: BD, ease: MOVE }, B)
      .fromTo(sheet, { y: 0 }, { y: d(-156), duration: BD, ease: MOVE }, B);

    // 4 -> 5, then hold on "Together" (still white)
    var C = 0.52, CD = 0.30;
    tl.to(title, { y: d(-636), opacity: 0, duration: CD, ease: MOVE }, C)
      .to(believe, { y: d(-899), opacity: 0.3, duration: CD, ease: MOVE }, C)
      .to(forest, { y: d(-388), duration: CD, ease: MOVE }, C)
      .to(green, { y: d(-317), duration: CD, ease: MOVE }, C)
      .to(together, { y: d(-615), duration: CD, ease: MOVE }, C)
      .to(sheet, { y: d(-313), duration: CD, ease: MOVE }, C)
      .to({}, { duration: 0.18 }, 0.82); // keeps the timeline at 1.0 for the final hold

    // 5 -> 6 is the first 231 design px of normal scroll after the pin: the
    // sheet travels with the page, "Together" lags it by 16 (Figma stage 6)
    // and turns green on the way. Animates the inner copy so the pin's
    // timeline keeps sole ownership of the wrapper's transform.
    var copy = together.querySelectorAll('.hero3__together');
    gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: {
        trigger: hero,
        start: 'bottom bottom',
        end: function () { return '+=' + 231 * u(); },
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    })
      .fromTo(accent, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0)
      .fromTo(copy, { y: 0 }, { y: d(16), duration: 1 }, 0);
  }

  /* ---------- PHILOSOPHY: artworks travel up toward the headline ----------
     Each artwork starts lower (data-phil-speed scales the distance) and
     scrubs into the Figma layout (92:6779) as the section comes up; it is at
     rest once the headline reaches the upper part of the viewport, matching
     the prototype. */
  function philosophyParallax() {
    var row = document.querySelector('.phil3__row');
    if (!row) return;
    gsap.utils.toArray('.phil3__item').forEach(function (item) {
      var speed = parseFloat(item.dataset.philSpeed || '1');
      gsap.fromTo(item, { y: function () { return Math.min(vh(20), 220) * speed; } }, {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top 100%',
          end: 'top 40%',
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      });
    });
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal:not(.cta__actions)').forEach(function (el) {
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
      if (el.closest('.cta')) return; // timed in cta()
      revealLines(el);
    });
  }

  /* ---------- CTA: title lines + buttons share one trigger ---------- */
  function cta() {
    var block = document.querySelector('.cta .cta__inner');
    if (!block) return;
    var title = block.querySelector('.cta__title');
    var lines = title ? title.querySelectorAll('.split-inner') : [];
    var actions = block.querySelector('.cta__actions');
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
    ['.help3__bg img', '.cta__bg img'].forEach(function (sel) {
      var img = document.querySelector(sel);
      if (!img) return;
      gsap.fromTo(img, { scale: 1 }, {
        scale: 1.1, duration: 10, ease: 'power1.out',
        scrollTrigger: { trigger: img.closest('section'), start: 'top 75%', once: true }
      });
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
    document.querySelectorAll('.help3__curve, .cta__curve').forEach(function (c) {
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
