/* ============================================================
   INDUSTRIES — touch / narrow-viewport support.

   The desktop hover expansion is pure CSS (see industries.css). Below
   1025px that row becomes a horizontal snap-scrolling strip, and this
   file covers the two things CSS cannot do there:

     1. tap to open  — :hover never fires on touch, so the first tap on a
        card opens it, the second follows the link, tapping outside closes.
     2. drag to scroll — a pointer drag never scrolls an overflow container
        in any browser; that is a built-in behaviour only touch gets. The
        strip is therefore unswipeable with a mouse or pen (including a
        desktop browser resized to tablet width, and touch-screen laptops).

   Touch is deliberately left to native scrolling — it already has
   momentum and rubber-banding that no script reproduces as well.

   No dependencies, safe to defer.
   ============================================================ */
(function () {
  var row = document.getElementById('indAccordion');
  if (!row) return;

  // desktop handles everything in CSS
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  function closeAll() {
    var open = row.querySelectorAll('.is-open');
    for (var i = 0; i < open.length; i++) open[i].classList.remove('is-open');
    row.classList.remove('has-open');
  }

  row.addEventListener('click', function (e) {
    var item = e.target.closest('.ind-accordion__item');
    if (!item) return;

    if (!item.classList.contains('is-open')) {
      e.preventDefault();          // first tap opens, second follows the link
      closeAll();
      item.classList.add('is-open');
      row.classList.add('has-open');
    }
  });

  document.addEventListener('click', function (e) {
    if (!row.contains(e.target)) closeAll();
  });
})();

/* ------------------------------------------------------------
   Drag to scroll the strip with a mouse or pen.

   Runs on every device, including desktop: the guard is whether the row
   actually overflows, not a media query, so it is inert while the desktop
   accordion is laid out (there the row never scrolls) and switches itself on
   the moment the strip takes over. That also keeps it correct across a resize
   or an orientation change without re-reading any breakpoint.
   ------------------------------------------------------------ */
(function () {
  var row = document.getElementById('indAccordion');
  if (!row || !window.PointerEvent) return;

  var THRESHOLD = 5;      // px of travel before a press counts as a drag
  var THROW_MS  = 120;    // how far a flick coasts, as ms of its exit velocity

  var id = null, startX = 0, startScroll = 0, dragged = false;
  var lastX = 0, lastT = 0, velocity = 0;

  function scrollable() { return row.scrollWidth - row.clientWidth > 1; }

  row.addEventListener('pointerdown', function (e) {
    // Touch already scrolls natively — leave it completely alone.
    if (e.pointerType === 'touch') return;
    if (e.button !== 0 || !scrollable()) return;

    id = e.pointerId;
    startX = lastX = e.clientX;
    startScroll = row.scrollLeft;
    lastT = e.timeStamp;
    velocity = 0;
    dragged = false;
    // NB: the pointer is deliberately NOT captured here. Capturing on
    // pointerdown retargets the resulting click to the row, so a plain click
    // would no longer land on the card's link. Capture waits until the drag
    // threshold is crossed, below, by which point the click is unwanted anyway.
  });

  row.addEventListener('pointermove', function (e) {
    if (id === null || e.pointerId !== id) return;

    var dx = e.clientX - startX;
    if (!dragged) {
      // Below the threshold this is still a click, so let it be one.
      if (Math.abs(dx) < THRESHOLD) return;
      dragged = true;
      row.classList.add('is-dragging');
      // Now that it is a drag, capture so it keeps tracking outside the row.
      row.setPointerCapture(id);
      // scroll-snap:x mandatory re-snaps on every assignment to scrollLeft,
      // which makes a manual drag stutter. Off while dragging, back on release
      // (clearing the inline value hands it to the stylesheet) so letting go
      // still settles on a card.
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

    // A flick coasts a little; the restored snap then settles it on a card.
    var thrown = velocity * THROW_MS;
    if (Math.abs(thrown) > 10) {
      row.scrollTo({ left: row.scrollLeft - thrown, behavior: 'smooth' });
    }
  }

  row.addEventListener('pointerup', endDrag);
  row.addEventListener('pointercancel', endDrag);

  // A drag ends in a click on whichever card is under the pointer. Capture
  // phase so this lands before the tap-to-open handler above and before the
  // link, and it only fires after real travel, so ordinary taps still work.
  row.addEventListener('click', function (e) {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  }, true);

  // Native image/link dragging would hijack the gesture mid-swipe.
  row.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();
