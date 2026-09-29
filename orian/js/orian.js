/* =========================================================
   Orian page — GSAP + ScrollTrigger animations
   ========================================================= */
(function () {
  'use strict';

  function revealFallback() {
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.stage__swap[data-stage="1"]').forEach(function (el) { el.classList.add('is-on'); });
  }
  if (!window.gsap || !window.ScrollTrigger) { revealFallback(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?noanim` renders the final static state (used for design QA screenshots)
  var noanim = reduce || /noanim/.test(location.search);
  if (/noanim/.test(location.search)) document.documentElement.classList.add("qa");

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

  /* ---------- Hero: masked title, eyebrow, nav; slow zoom + scroll parallax ---------- */
  function hero() {
    var lines = document.querySelectorAll('.hero__title .split-inner');
    var nav = document.querySelector('.nav');
    var img = document.querySelector('.hero__img');
    var eyebrow = document.querySelector('.hero__eyebrow');

    gsap.set(lines, { yPercent: 115, rotate: 2, transformOrigin: '0% 100%' });
    gsap.set(nav, { y: -30, opacity: 0 });
    gsap.set(eyebrow, { opacity: 0, y: 20 });
    gsap.set(img, { scale: 1.12 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(lines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14, ease: 'power4.out' }, 0.4)
      .to(eyebrow, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.0)
      .to(nav, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0.85);

    // slow one-way zoom
    gsap.to(img, { scale: 1.22, duration: 12, ease: 'power1.out', delay: 0.6 });

    // Scroll parallax on the background only; the copy stays pinned while the
    // page scrolls up over the sticky hero.
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to(img, { yPercent: 8, ease: 'none' }, 0);
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    ['.caps__grid', '.hard__grid', '.stats'].forEach(function (sel) {
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

  /* ---------- Stat counters ---------- */
  function counters() {
    document.querySelectorAll('.stat__num[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.6, ease: 'power3.out',
        onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* ---------- How Orian powers each stage: pinned, stepped scroll ----------
     The block is pinned for STEPS viewport-heights of scroll and snaps to five
     evenly spaced stops. Each stop is a "stage": the flywheel wedges 1..n light
     up cumulatively (Figma variants Default → Variant5), the labels on those
     wedges switch from grey to their on-colour, the "Orian enables" orb
     changes colour, and every piece of copy crossfades to that stage's text.
     Transitions are timed tweens (not scrubbed) so a flick and a slow drag
     both produce the same clean change. */
  function stage() {
    var stageEl = document.getElementById('stage');
    if (!stageEl) return;

    var swaps = Array.prototype.slice.call(stageEl.querySelectorAll('.stage__swap'));
    var wedges = Array.prototype.slice.call(stageEl.querySelectorAll('.fw-wedge'));
    var labels = Array.prototype.slice.call(stageEl.querySelectorAll('.fw-t'));
    var wheel = stageEl.querySelector('.fw');
    var STEPS = 4;      // 5 stages = 4 transitions
    var VH_PER_STEP = 0.9;
    var current = 0;

    function setStage(n, immediate) {
      if (n === current) return;
      var forward = n > current;
      current = n;
      stageEl.dataset.stage = String(n);
      var dur = immediate ? 0 : 0.55;

      swaps.forEach(function (el) {
        var s = +el.dataset.stage;
        if (s === n) {
          el.classList.add('is-on');
          gsap.fromTo(el, { opacity: 0, y: forward ? 18 : -18 }, {
            opacity: 1, y: 0, duration: dur, delay: immediate ? 0 : 0.16, ease: 'power3.out', overwrite: true
          });
        } else if (el.classList.contains('is-on')) {
          el.classList.remove('is-on');
          gsap.to(el, { opacity: 0, y: forward ? -14 : 14, duration: dur * 0.6, ease: 'power2.in', overwrite: true });
        }
      });

      wedges.forEach(function (w) {
        var on = +w.dataset.stage <= n;
        w.classList.toggle('is-on', on);
        gsap.to(w, { opacity: on ? 1 : 0, duration: dur, ease: 'power2.out', overwrite: true });
      });
      labels.forEach(function (t) {
        var on = +t.dataset.stage <= n;
        gsap.to(t, { fill: on ? t.dataset.on : '#BEBEBE', duration: dur, ease: 'power2.out', overwrite: true });
      });

      if (!immediate && wheel) {
        gsap.fromTo(wheel, { scale: 0.985 }, { scale: 1, duration: 0.7, ease: 'power2.out', overwrite: true });
      }
    }

    // `?nopin&stage=N` renders one stage unpinned (design QA screenshots).
    var qs = new URLSearchParams(location.search);
    if (qs.has("nopin")) {
      stageEl.classList.add("is-static");
      setStage(Math.min(5, Math.max(1, parseInt(qs.get("stage"), 10) || 1)), true);
      return;
    }
    setStage(1, true);

    ScrollTrigger.create({
      trigger: stageEl,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * VH_PER_STEP * STEPS); },
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: noanim ? false : {
        snapTo: 1 / STEPS,
        duration: { min: 0.15, max: 0.5 },
        delay: 0.05,
        ease: 'power1.inOut'
      },
      onUpdate: function (self) {
        setStage(Math.min(STEPS, Math.round(self.progress * STEPS)) + 1, noanim);
      }
    });
  }

  /* ---------- Background parallax + slow zoom (CTA) ---------- */
  function backgrounds() {
    document.querySelectorAll('[data-parallax-bg]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: img.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    var ctaBg = document.querySelector('.cta__bg img');
    if (ctaBg) {
      gsap.fromTo(ctaBg, { scale: 1 }, {
        scale: 1.12, duration: 10, ease: 'power1.out',
        scrollTrigger: { trigger: '.cta', start: 'top 75%', once: true }
      });
    }
  }

  /* ---------- CTA: same sequence as the other pages ---------- */
  function cta() {
    var block = document.querySelector('.cta .cta__inner');
    if (!block) return;
    var lines = block.querySelectorAll('.cta__title .split-inner');
    var rest = block.querySelectorAll('.cta__body, .cta__actions');

    if (lines.length) gsap.set(lines, { yPercent: 110 });
    if (rest.length) gsap.set(rest, { opacity: 0, y: 20 });

    var tl = gsap.timeline({ paused: true });
    if (lines.length) tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 0);
    if (rest.length) tl.to(rest, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, lines.length ? 0.25 : 0);

    ScrollTrigger.create({ trigger: block, start: 'top 75%', once: true, onEnter: function () { tl.play(); } });

    var curve = document.querySelector('.cta__curve');
    if (curve) {
      gsap.from(curve, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: curve, start: 'top bottom', end: 'bottom bottom', scrub: true } });
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

  function init() {
    splitAll();
    if (noanim) {
      revealFallback();
      stage();
      ScrollTrigger.refresh();
      return;
    }
    hero();
    reveals();
    counters();
    stage();
    backgrounds();
    cta();
    footer();
    ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(init); }
  else { window.addEventListener('load', init); }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
