/* =========================================================
   HI/AI page — GSAP + ScrollTrigger animations
   ========================================================= */
(function () {
  'use strict';

  function revealFallback() {
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
  }
  if (!window.gsap || !window.ScrollTrigger) { revealFallback(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?noanim` renders the final static state (used for design QA screenshots)
  if (reduce || /noanim/.test(location.search)) { revealFallback(); return; }

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
    var fern = document.querySelector('.hero__fern');
    var eyebrow = document.querySelector('.hero__eyebrow');

    gsap.set(lines, { yPercent: 115, rotate: 2, transformOrigin: '0% 100%' });
    gsap.set(nav, { y: -30, opacity: 0 });
    gsap.set(eyebrow, { opacity: 0, y: 20 });
    gsap.set(fern, { scale: 1.12 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(lines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14, ease: 'power4.out' }, 0.4)
      .to(eyebrow, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.0)
      .to(nav, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0.85);

    // slow one-way zoom
    gsap.to(fern, { scale: 1.22, duration: 12, ease: 'power1.out', delay: 0.6 });

    // scroll parallax
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to(fern, { yPercent: 8, ease: 'none' }, 0)
      .to('.hero__content', { yPercent: 30, opacity: 0, ease: 'none' }, 0);
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    var groups = ['.aspects__grid'];
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

  /* ---------- Yin-yang: gentle float + rotate on scroll ---------- */
  function yinyang() {
    var yy = document.querySelector('.hiai__yy');
    if (!yy) return;
    gsap.fromTo(yy, { rotate: -8, scale: 0.92, opacity: 0 }, {
      rotate: 0, scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.hiai__stage', start: 'top 78%', once: true }
    });
    gsap.to(yy, {
      rotate: 6, ease: 'none',
      scrollTrigger: { trigger: '.hiai', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- HI / AI columns: top-to-bottom reveal, HI then AI ----------
     Each column's children are staggered in DOM order, which is also their
     visual order (letter, label, equation, caption), so the column uncovers
     downward. The AI column starts only once the HI column has settled.
     The yin-yang itself is deliberately left out — it is driven by yinyang(). */
  function columns() {
    var stage = document.querySelector('.hiai__stage');
    if (!stage) return;
    var hi = stage.querySelector('.hiai__col--hi');
    var ai = stage.querySelector('.hiai__col--ai');
    if (!hi || !ai) return;

    var toArray = function (col) { return Array.prototype.slice.call(col.children); };
    var hiItems = toArray(hi);
    var aiItems = toArray(ai);
    if (!hiItems.length || !aiItems.length) return;

    // Set the start state up front rather than relying on from() tweens inside a
    // timeline, whose immediateRender behaviour would let the columns flash in
    // at full opacity before the trigger fires.
    gsap.set(hiItems.concat(aiItems), { opacity: 0, y: 28 });

    // A fresh vars object per tween — GSAP writes internal state onto the one it
    // is handed, so the two steps must not share it.
    function step() {
      return {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out',
        // Hand the styles back to the stylesheet once the reveal has played.
        clearProps: 'opacity,transform'
      };
    }

    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 78%', once: true } })
      .to(hiItems, step(), 0)
      .to(aiItems, step(), '>');
  }

  /* ---------- Flywheel: fades in, then turns with the scroll ---------- */
  function flywheel() {
    var fw = document.querySelector('.way__flywheel');
    if (!fw) return;

    // Fade/scale in once, so the wheel has arrived before it starts turning.
    gsap.fromTo(fw, { scale: 0.9, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: fw, start: 'top 85%', once: true }
    });

    // Rotation is mapped straight onto scroll position: a small left-to-right
    // tilt over the wheel's travel through the viewport, so it is upright in the
    // middle of the section and the labels stay readable throughout. `scrub: 1`
    // gives the tween ~1s to catch up with the scrollbar, which is what turns a
    // flicked wheel or trackpad into a smooth turn rather than a jump. Sizes are
    // read fresh on refresh so the mapping survives resize and orientation change.
    gsap.fromTo(fw, { rotation: -12 }, {
      rotation: 12, ease: 'none',
      scrollTrigger: {
        trigger: fw,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    // Settle the section centred. This range runs from 'wheel centre at the
    // bottom of the viewport' to 'wheel centre at the top', so progress 0.5 is
    // exactly the wheel sitting in the middle of the screen — which is also the
    // midpoint of the tilt above, so it settles upright. The snap only bites once
    // the reader has stopped within ~16% of that point; anywhere else the
    // progress is handed back untouched, so scrolling straight past the section
    // is never hijacked. Touch-only devices are skipped because momentum
    // scrolling fights a snap — drop the isTouch check to enable it there too.
    if (ScrollTrigger.isTouch !== 1) {
      ScrollTrigger.create({
        trigger: fw,
        start: 'center bottom',
        end: 'center top',
        invalidateOnRefresh: true,
        snap: {
          snapTo: function (progress) {
            return Math.abs(progress - 0.5) < 0.16 ? 0.5 : progress;
          },
          duration: { min: 0.2, max: 0.55 },
          delay: 0.1,
          ease: 'power2.inOut'
        }
      });
    }
  }

  /* ---------- Background parallax + slow zoom ---------- */
  function backgrounds() {
    var beach = document.querySelector('.quote__bg img');
    if (beach) {
      gsap.fromTo(beach, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
    var quoteCard = document.querySelector('.quote__card');
    if (quoteCard) {
      gsap.from(quoteCard, { y: 40, opacity: 0, duration: 1.1,
        scrollTrigger: { trigger: quoteCard, start: 'top 85%', once: true } });
    }
    var hills = document.querySelector('.cta-hiai__hills img');
    if (hills) {
      gsap.fromTo(hills, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.cta-hiai', start: 'top bottom', end: 'bottom top', scrub: true }
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

  function init() {
    splitAll();
    hero();
    reveals();
    yinyang();
    columns();
    flywheel();
    backgrounds();
    footer();
    ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(init); }
  else { window.addEventListener('load', init); }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
