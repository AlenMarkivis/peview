/* =========================================================
   Micro-interactions: floating card, ask-me pill, filters,
   load more, impact carousel, HI/AI toggle
   ========================================================= */
(function () {
  'use strict';

  // /* ---------- Floating podcast card (Figma: AFTER_TIMEOUT reaction) ---------- */
  // var floatCard = document.getElementById('float-card');
  // if (floatCard) {
  //   var hero = document.getElementById('hero');
  //   var shown = false;
  //   function maybeShow() {
  //     if (shown) return;
  //     // Hero is sticky (stays on screen for a full hero-height of scroll), so only
  //     // show the card once the page has fully scrolled past it.
  //     var pastHero = window.scrollY > (hero ? hero.offsetHeight : 800);
  //     if (pastHero) {
  //       shown = true;
  //       setTimeout(function () { floatCard.classList.add('is-visible'); }, 900);
  //     }
  //   }
  //   window.addEventListener('scroll', maybeShow, { passive: true });
  //   setTimeout(maybeShow, 4500); // fallback: show after a delay even without scrolling
  //   floatCard.querySelector('.float-card__close').addEventListener('click', function () {
  //     floatCard.classList.remove('is-visible');
  //     floatCard.classList.add('is-dismissed');
  //   });
  // }

  /* ---------- Ask-me pill → search field (Figma: ON_CLICK smart animate) ---------- */
  var ask = document.getElementById('ask');
  if (ask) {
    var pill = ask.querySelector('.ask__pill');
    var form = ask.querySelector('.ask__form');
    var input = form.querySelector('input');

    setTimeout(function () { ask.classList.add('is-visible'); }, 1600);

    function dockAsk() {
      // The pill sits beside the intro in the design; once you scroll it docks to the corner.
      ask.classList.toggle('is-docked', window.scrollY > 700 || window.innerHeight < 1000);
    }
    dockAsk();
    window.addEventListener('scroll', dockAsk, { passive: true });
    window.addEventListener('resize', dockAsk);

    pill.addEventListener('click', function () {
      ask.classList.add('is-open');
      pill.setAttribute('aria-expanded', 'true');
      setTimeout(function () { input.focus(); }, 350);
    });
    function closeAsk() {
      ask.classList.remove('is-open');
      pill.setAttribute('aria-expanded', 'false');
    }
    document.addEventListener('click', function (e) {
      if (ask.classList.contains('is-open') && !ask.contains(e.target)) closeAsk();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAsk(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      input.value = '';
      input.placeholder = 'Searching “' + q + '”…';
      setTimeout(function () { input.placeholder = 'Find case studies in Fintech...'; }, 1800);
    });
  }

  /* ---------- Insights filter tags ---------- */
  var tags = Array.from(document.querySelectorAll('.filter [data-filter]'));
  var posts = Array.from(document.querySelectorAll('#masonry .post'));
  var active = new Set();
  var clearBtn = document.getElementById('clear-filter');
  function applyFilter() {
    posts.forEach(function (p) {
      var show = active.size === 0 || active.has(p.dataset.type);
      p.classList.toggle('is-hidden', !show);
    });
    if (clearBtn) clearBtn.hidden = active.size === 0;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function setTag(t, on) {
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  tags.forEach(function (t) {
    t.addEventListener('click', function () {
      var key = t.dataset.filter;
      if (active.has(key)) { active.delete(key); setTag(t, false); }
      else { active.add(key); setTag(t, true); }
      applyFilter();
    });
  });
  /* Clear filter — resets every selected tag and shows all posts */
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      active.clear();
      tags.forEach(function (t) { setTag(t, false); });
      applyFilter();
    });
  }
  applyFilter();

  /* ---------- Load more (expands the faded masonry) ---------- */
  var masonry = document.getElementById('masonry');
  var loadMore = document.getElementById('load-more');
  if (masonry && loadMore) {
    masonry.classList.add('is-collapsed');
    loadMore.addEventListener('click', function () {
      var from = masonry.offsetHeight;
      masonry.classList.remove('is-collapsed');
      var to = masonry.offsetHeight;
      if (window.gsap) {
        gsap.fromTo(masonry, { height: from, overflow: 'hidden' }, {
          height: to, duration: 0.9, ease: 'power3.inOut',
          onComplete: function () { gsap.set(masonry, { clearProps: 'height,overflow' }); if (window.ScrollTrigger) ScrollTrigger.refresh(); }
        });
      }
      loadMore.textContent = 'Show less';
      loadMore.dataset.state = 'open';
      loadMore.onclick = function () {
        masonry.classList.add('is-collapsed');
        loadMore.textContent = 'Load more';
        loadMore.onclick = null;
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        masonry.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  /* ---------- Impact carousel ---------- */
  var impact = document.getElementById('impact');
  if (impact) {
    var slides = Array.from(impact.querySelectorAll('.impact__slide'));
    var title = impact.querySelector('.impact__title');
    var sub = impact.querySelector('.impact__sub');
    var cta = impact.querySelector('.impact__cta');
    var index = 0;
    var timer = null;

    function go(to) {
      var next = (to + slides.length) % slides.length;
      if (next === index && slides[index].classList.contains('is-active')) return;
      slides[index].classList.remove('is-active');
      index = next;
      var s = slides[index];
      s.classList.add('is-active');

      var swap = function () {
        title.textContent = s.dataset.title;
        sub.textContent = s.dataset.sub;
        cta.firstChild.nodeValue = s.dataset.cta + ' ';
      };
      if (window.gsap) {
        var tl = gsap.timeline();
        tl.to([title, sub, cta], { y: 24, opacity: 0, duration: 0.35, stagger: 0.05, ease: 'power2.in', onComplete: swap })
          .to([title, sub, cta], { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
      } else swap();
      restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(index + 1); }, 6500);
    }
    impact.querySelector('.impact__arrow--next').addEventListener('click', function () { go(index + 1); });
    impact.querySelector('.impact__arrow--prev').addEventListener('click', function () { go(index - 1); });
    impact.addEventListener('mouseenter', function () { clearInterval(timer); });
    impact.addEventListener('mouseleave', restart);
    restart();
  }

  /* ---------- HI / AI toggle in the nav ---------- */
  var toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var mode = document.documentElement.dataset.mode === 'ai' ? 'hi' : 'ai';
      document.documentElement.dataset.mode = mode;
      if (window.gsap) {
        gsap.fromTo(toggle.querySelector('img'), { rotate: 0 }, { rotate: 360, duration: 0.9, ease: 'power3.inOut' });
      }
    });
  }
})();
