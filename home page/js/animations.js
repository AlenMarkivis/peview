/* =========================================================
   GSAP + ScrollTrigger animations
   ========================================================= */
(function () {
  'use strict';
  // Fallback: if GSAP failed to load, reveal everything so no content stays hidden.
  function revealFallback() {
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.intro__text .split-word').forEach(function (el) { el.style.opacity = 1; });
  }
  if (!window.gsap || !window.ScrollTrigger) { revealFallback(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (reduce) {
    document.querySelectorAll('.reveal, .reveal-up').forEach(function (el) { el.style.opacity = 1; });
    document.querySelectorAll('.intro__text .split-word').forEach(function (el) { el.style.opacity = 1; });
    return;
  }

  gsap.defaults({ ease: 'power3.out', duration: 1 });

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
      scrollTrigger: opts.trigger === false ? null : {
        trigger: opts.triggerEl || el,
        start: opts.start || 'top 85%',
        once: true
      }
    });
  }

  function revealLines(el) {
    var inners = el.querySelectorAll('.split-inner');
    if (!inners.length) return;
    gsap.set(inners, { yPercent: 110 });
    return gsap.to(inners, {
      yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  }

  /* ---------- Hero entrance ---------- */
  // function hero() {
  //   var lines = document.querySelectorAll('.hero__title .split-inner');
  //   var nav = document.querySelector('.nav');
  //   var mountains = document.querySelector('.hero__mountains');

  //   // Base crop: the photo is sky-heavy (mountains in the lower third). On wide
  //   // viewports `object-fit: cover` shows almost all sky, so scale in to lift the
  //   // mountains into frame; portrait viewports already frame them, so barely zoom.
  //   var heroEl = document.querySelector('.hero');
  //   var ratio = heroEl.clientWidth / heroEl.clientHeight;
  //   var baseScale = ratio <= 1.5 ? 1.12 : Math.min(1.12 + (ratio - 1.5) * 2.4, 1.5);

  //   gsap.set(lines, { yPercent: 115, rotate: 2, transformOrigin: '0% 100%' });
  //   gsap.set(nav, { y: -30, opacity: 0 });
  //   gsap.set(mountains, { scale: baseScale });

  //   var tl = gsap.timeline({ delay: 0.15 });
  //   tl.to(lines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14, ease: 'power4.out' }, 0.45)
  //     .to(nav, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0.9);

  //   // Single, very slow zoom-in once the hero is in view — a gentle push toward
  //   // the mountains, anchored to the bottom. One-way: eases up and holds. Scale
  //   // only, so it never fights the scroll parallax (translate).
  //   gsap.to(mountains, { scale: baseScale + 0.1, duration: 10, ease: 'power1.out', delay: 0.6 });

  //   // Parallax on scroll: mountains sink slightly, title fades upward. Kept small
  //   // so the image never slides out from behind the white curve at the base.
  //   gsap.timeline({
  //     scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  //   })
  //     .to(mountains, { yPercent: 6, ease: 'none' }, 0)
  //     .to('.hero__content', { yPercent: 35, opacity: 0, ease: 'none' }, 0);
  // }

  /* ---------- Hero banner parallax ----------
     Base scale 1.12, a slow one-way zoom to 1.22, and a scrub across the
     pinned banner that drifts the photo 8% down. The headline is deliberately
     left out of the move: `.hero__content` stays fixed while the photo
     drifts behind it. */
  function heroBanner() {
    var banner = document.querySelector('.hero-banner');
    var bg = banner && banner.querySelector('.hero-banner__bg');
    if (!bg) return;

    gsap.set(bg, { scale: 1.12 });

    // slow one-way zoom
    gsap.to(bg, { scale: 1.22, duration: 12, ease: 'power1.out', delay: 0.6 });

    // scroll parallax
    gsap.timeline({
      scrollTrigger: { trigger: banner, start: 'top top', end: 'bottom top', scrub: true }
    })
      .to(bg, { yPercent: 8, ease: 'none' }, 0);
  }

  /* ---------- Intro paragraph: word-by-word scrub ---------- */
  function intro() {
    gsap.fromTo('.intro__tagline', { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 1,
      scrollTrigger: { trigger: '.intro__tagline', start: 'top 88%', once: true }
    });
    // `.intro__text` is intentionally static — no wipe, no word scrub.
  }

  /* ---------- Generic reveals ---------- */
  function reveals() {
    document.querySelectorAll('.reveal:not(.intro__tagline):not(.cta__actions)').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // Grouped staggered card reveals
    var groups = ['.philosophy__stage', '.help-grid', '.masonry__col', '.talent'];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        var items = group.querySelectorAll('.reveal-up');
        if (!items.length) return;
        gsap.fromTo(items, { opacity: 0, y: 60, scale: 0.98 }, {
          opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        });
      });
    });

    // Headings
    document.querySelectorAll('[data-split="chars"]').forEach(function (el) {
      revealChars(el, { each: el.classList.contains('eyebrow') ? 0.012 : 0.035 });
    });
    document.querySelectorAll('[data-split="lines"]').forEach(function (el) {
      if (el.closest('.cta')) return; // the CTA title is timed in cta()
      revealLines(el);
    });
  }

  /* ---------- CTA: entrance held until the block is entering the viewport ----
     The generic reveals keyed each element to its own top edge ('top 85%' for
     the title, 'top 90%' for the buttons). The CTA title is a three-line
     display block, so when its *top* edge reached 85% the lines themselves were
     still below the fold — the wipe-up played out unseen and the section
     arrived already settled. Both parts now share one trigger, measured off the
     content block rather than the section (whose 120-207px of top padding put
     the section edge well ahead of anything visible), and fired at
     CTA_START_VH. That is late enough that the copy is on screen when it moves,
     early enough that it is still running as you scroll in. The animations
     themselves are unchanged — same distances, durations, easings, stagger. */
  var CTA_START_VH = 75; // % of viewport height; lower = fires later

  function cta() {
    var block = document.querySelector('.cta .cta__inner');
    if (!block) return;

    var title = block.querySelector('.cta__title');
    var lines = title ? title.querySelectorAll('.split-inner') : [];
    var actions = block.querySelector('.cta__actions');
    if (!lines.length && !actions) return;

    if (lines.length) gsap.set(lines, { yPercent: 110 });
    if (actions) gsap.set(actions, { opacity: 0, y: 20 });

    // Paused until the trigger fires, so nothing can run ahead of the scroll.
    var tl = gsap.timeline({ paused: true });
    if (lines.length) {
      tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 0);
    }
    if (actions) {
      tl.to(actions, { opacity: 1, y: 0, duration: 0.9 }, lines.length ? 0.25 : 0);
    }

    ScrollTrigger.create({
      trigger: block,
      start: 'top ' + CTA_START_VH + '%',
      once: true,
      onEnter: function () { tl.play(); }
    });
  }

  /* ---------- Competencies: cards stack in one by one ---------- */
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

  /* ---------- Philosophy triad: orbs drift in, arcs draw ---------- */
  function orian() {
    var wrap = document.querySelector('.philosophy__stage');
    if (!wrap) return;
    var trigger = { trigger: wrap, start: 'top 75%', once: true };

    // Orbs settle in place. immediateRender:false + clearProps so the exact
    // Figma geometry is restored afterwards and the hover transform is free.
    var frames = wrap.querySelectorAll('.phil-orb__frame');
    if (frames.length) {
      gsap.fromTo(frames,
        { opacity: 0, scale: 0.94 },
        {
          opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out',
          stagger: 0.14, immediateRender: false,
          clearProps: 'transform,opacity,scale',
          scrollTrigger: trigger
        });
    }

    wrap.querySelectorAll('.philosophy__arc path').forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 1600;
      gsap.fromTo(p,
        { strokeDashoffset: len, opacity: 0 },
        {
          strokeDashoffset: 0, opacity: 1, duration: 1.8, ease: 'power2.out',
          delay: 0.3, immediateRender: false,
          scrollTrigger: trigger
        });
    });
  }

  function philosophy() { /* no-op: parallax removed to match static Figma composition */ }

  /* ---------- Philosophy videos: still poster at rest, play while hovered ---------- */
  function philVideos() {
    var vids = document.querySelectorAll('[data-phil-video]');
    if (!vids.length) return;

    // Buffer once the orb nears the viewport so the first hover starts instantly.
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

    // Matches the opacity transition on .phil-orb__media; the clip keeps running
    // until the still has fully faded back in so the swap never snaps.
    var FADE_MS = 450;

    vids.forEach(function (v) {
      var orb = v.closest('.phil-orb');
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

  /* ---------- Why leaders: infinite vertical card marquee ---------- */
  function whyMarquee() {
    var track = document.querySelector('.why__track');
    if (!track) return;
    var cards = Array.from(track.children);
    // Duplicate for a seamless loop
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

    // The marquee is never paused. It used to stop via a ScrollTrigger on
    // `stack` (onLeave/onLeaveBack) whenever the section left the viewport, so
    // the .feel-card loop only ran while the section happened to be on screen
    // and resumed from wherever it had frozen. `repeat: -1` above already makes
    // it endless, and the travel (loopHeight) matches the duplicated set
    // exactly, so leaving it running keeps the loop continuous. rAF is throttled
    // in background tabs, so an always-on transform tween costs nothing there.

    // Speed burst driven by scroll velocity
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
      var section = img.closest('section, .talent-card__media, .impact__slide');
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Slow zoom-in on the help + CTA backgrounds (like the hero) ------ */
  function bgZoom() {
    ['.help__bg img', '.cta__bg img'].forEach(function (sel) {
      var img = document.querySelector(sel);
      if (!img) return;
      // Plays once when the section enters view, then holds. Scale only, so it
      // never fights the scroll parallax (yPercent translate) on the same image.
      gsap.fromTo(img, { scale: 1 }, {
        scale: 1.12, duration: 10, ease: 'power1.out',
        scrollTrigger: { trigger: img.closest('section'), start: 'top 75%', once: true }
      });
    });
  }

  /* ---------- "How can we help": title drifts, cards float ---------- */
  function help() {
    gsap.to('.help__title', {
      yPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '.help', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Filter bar and float-card entrances ---------- */
  function misc() {
    // fromTo + immediateRender:false + clearProps: never leaves a stuck y offset
    // if the trigger refreshes or never fires.
    gsap.fromTo('.filter__tags .tag',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, immediateRender: false, clearProps: 'transform',
        scrollTrigger: { trigger: '.filter', start: 'top 88%', once: true } });
    // fromTo with immediateRender:false — logos stay visible if the trigger never fires (no stuck opacity:0)
    gsap.fromTo('.logo-grid .logo',
      { opacity: 0, y: 24, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.8, immediateRender: false,
        scrollTrigger: { trigger: '.logo-grid', start: 'top 85%', once: true } });
    gsap.from('.impact__content > *', {
      opacity: 0, y: 30, stagger: 0.12, duration: 1,
      scrollTrigger: { trigger: '.impact', start: 'top 60%', once: true }
    });
    gsap.from('.footer__cols .footer__col', {
      opacity: 0, y: 20, stagger: 0.08, duration: 0.8,
      scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true }
    });
    gsap.from('.footer__logo', {
      opacity: 0, scale: 0.9, duration: 1,
      scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true }
    });
    // Curved edges lift slightly as they enter
    document.querySelectorAll('.help__curve, .cta__curve').forEach(function (c) {
      gsap.from(c, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    splitAll();

    heroBanner();
    intro();
    reveals();
    cta();
    competencies();
    orian();
    philosophy();
    philVideos();
    whyMarquee();
    bgParallax();
    bgZoom();
    help();
    misc();
    ScrollTrigger.refresh();
  }

  // Wait for fonts so line splitting and metrics are accurate
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
