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

    var groups = ['.power__row'];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        var items = group.querySelectorAll('.reveal-up');
        if (!items.length) return;
        gsap.fromTo(items, { opacity: 0, y: 60, scale: 0.98 }, {
          opacity: 1, y: 0, scale: 1, duration: 1.05, stagger: 0.12, ease: 'power3.out',
          immediateRender: false, clearProps: 'transform',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        });
      });
    });

    document.querySelectorAll('[data-split="chars"]').forEach(function (el) {
      revealChars(el, { each: 0.03 });
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
      gsap.fromTo(items, { opacity: 0, x: -24 }, {
        opacity: 1, x: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out',
        clearProps: 'transform',
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
  function backgrounds() {
    var hills = document.querySelector('.cta-hoax__hills img');
    if (hills) {
      gsap.fromTo(hills, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.cta-hoax', start: 'top bottom', end: 'bottom top', scrub: true }
      });
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

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        if (item.classList.contains('is-active')) return;
        items.forEach(function (i) {
          i.classList.remove('is-active');
          i.setAttribute('aria-selected', 'false');
        });
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');

        // Fade the panel out, swap the content, fade it back in.
        panel.classList.add('is-swapping');
        window.setTimeout(function () {
          title.textContent = item.dataset.title;
          text.textContent = item.dataset.text;
          if (item.dataset.img) img.src = item.dataset.img;
          panel.classList.remove('is-swapping');
        }, 280);
      });
    });
  }

  function init() {
    splitAll();
    hero();
    reveals();
    brain();
    videoCard();
    culture();
    backgrounds();
    footer();
    cultureTabs();
    ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(init); }
  else { window.addEventListener('load', init); }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
