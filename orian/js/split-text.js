/* =========================================================
   Tiny SplitText utility (chars / words / lines)
   Mirrors the Anitype "characters / words / lines" layers in Figma.
   Usage: <h2 data-split="chars">…</h2>
   ========================================================= */
(function (global) {
  'use strict';

  function wrap(text, cls) {
    var span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    return span;
  }

  /**
   * Split the text nodes of `el` into spans.
   * Preserves child elements (e.g. <span class="accent">) so colour spans keep working.
   */
  function splitChars(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text.trim()) return;
      var frag = document.createDocumentFragment();
      // Split by words first so line wrapping stays natural, then chars inside each word.
      var parts = text.split(/(\s+)/);
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
          return;
        }
        var word = document.createElement('span');
        word.className = 'split-word';
        Array.from(part).forEach(function (ch) {
          word.appendChild(wrap(ch, 'split-char'));
        });
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return Array.from(el.querySelectorAll('.split-char'));
  }

  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text.trim()) return;
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        frag.appendChild(wrap(part, 'split-word'));
      });
      node.parentNode.replaceChild(frag, node);
    });
    return Array.from(el.querySelectorAll('.split-word'));
  }

  /**
   * Lines: split into words, measure their offsetTop, then group into
   * `.split-line > .split-inner` wrappers (for masked slide-up reveals).
   */
  function splitLines(el) {
    var words = splitWords(el);
    if (!words.length) return [];
    var lines = [];
    var current = null;
    var lastTop = null;

    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        current = [];
        lines.push(current);
        lastTop = top;
      }
      current.push(w);
    });

    var inners = lines.map(function (lineWords) {
      var line = document.createElement('span');
      line.className = 'split-line';
      var inner = document.createElement('span');
      inner.className = 'split-inner';
      line.appendChild(inner);
      var first = lineWords[0];
      // Preserve accent parents by cloning the word (with its parent's class) into the line.
      first.parentNode.insertBefore(line, first);
      lineWords.forEach(function (w, i) {
        var parent = w.parentNode;
        var holder = w;
        if (parent !== line && parent !== el && parent.childNodes.length <= 1 && parent.classList && parent.classList.contains('accent')) {
          holder = parent;
        } else if (parent.classList && parent.classList.contains('accent')) {
          var clone = document.createElement('span');
          clone.className = parent.className;
          clone.appendChild(w);
          holder = clone;
        }
        inner.appendChild(holder);
        if (i < lineWords.length - 1) inner.appendChild(document.createTextNode(' '));
      });
      return inner;
    });

    // Remove now-empty accent spans left behind
    Array.from(el.querySelectorAll('.accent')).forEach(function (a) {
      if (!a.textContent.trim()) a.parentNode.removeChild(a);
    });
    return inners;
  }

  function split(el, type) {
    if (el.dataset.splitDone) return el.__splitResult || [];
    var result;
    if (type === 'chars') result = splitChars(el);
    else if (type === 'lines') result = splitLines(el);
    else result = splitWords(el);
    el.dataset.splitDone = type;
    el.__splitResult = result;
    return result;
  }

  global.SplitText = { split: split, chars: splitChars, words: splitWords, lines: splitLines };
})(window);
