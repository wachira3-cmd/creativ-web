/* ==========================================================================
   CREATIVHABITS — MOTION SYSTEM (behaviour layer, v2)
   Adds: portfolio filtering, lightbox, tilt-on-hover, hero collage parallax.
   Everything else (preloader sequencing, reveal choreography, reduced-motion
   handling) carries over from v1 unchanged.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var html = document.documentElement;

  /* ------------------------------------------------------------------
     1. PRELOADER
     ------------------------------------------------------------------ */
  function initPreloader (onRevealReady) {
    if (reduced) {
      html.classList.add('is-ready', 'is-loaded');
      assignStagger();
      if (onRevealReady) onRevealReady();
      return;
    }
    requestAnimationFrame(function () { html.classList.add('is-ready'); });
    var minTime = 550, start = Date.now(), settled = false;
    function reveal () {
      if (settled) return;
      settled = true;
      var wait = Math.max(0, minTime - (Date.now() - start));
      setTimeout(function () {
        html.classList.add('is-loaded');
        assignStagger();
        if (onRevealReady) onRevealReady();
      }, wait);
    }
    window.addEventListener('load', reveal);
    setTimeout(reveal, 1800);
  }

  function assignStagger () {
    document.querySelectorAll('[data-hero] .pre-reveal').forEach(function (el, i) {
      el.style.setProperty('--stagger', String(i * 90));
    });
  }

  /* ------------------------------------------------------------------
     2. NAV
     ------------------------------------------------------------------ */
  function initNav () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    function onScroll () { nav.classList.toggle('is-scrolled', window.scrollY > 40); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = document.querySelector('.nav__toggle');
    if (toggle) {
      toggle.addEventListener('click', function () { html.classList.toggle('menu-open'); });
      document.querySelectorAll('.menu-overlay__links a').forEach(function (a) {
        a.addEventListener('click', function () { html.classList.remove('menu-open'); });
      });
    }
  }

  /* ------------------------------------------------------------------
     3. SCROLL REVEALS
     ------------------------------------------------------------------ */
  function initReveals () {
    var targets = document.querySelectorAll('.reveal, .line-mask, .img-mask');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var groups = {};
    targets.forEach(function (el) {
      var g = el.getAttribute('data-stagger-group') || '__solo_' + Math.random();
      groups[g] = groups[g] || [];
      groups[g].push(el);
    });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (el, i) { el.style.setProperty('--d', String(Math.min(i, 5) * 70)); });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  var splitGroupId = 0;
  function initTextSplits () {
    document.querySelectorAll('[data-split-lines]').forEach(function (parent) {
      if (parent.dataset.split) return;
      parent.dataset.split = 'true';
      var group = 'split-' + (splitGroupId++);
      var kids = Array.prototype.slice.call(parent.children);
      kids.forEach(function (child) {
        var text = child.textContent.trim();
        child.outerHTML = '<span class="line-mask" data-stagger-group="' + group + '"><span class="line">' + text + '</span></span>';
      });
    });
  }

  /* ------------------------------------------------------------------
     4. MARQUEE
     ------------------------------------------------------------------ */
  function initMarquee () {
    var track = document.querySelector('.marquee__track');
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }

  /* ------------------------------------------------------------------
     5. TESTIMONIALS
     ------------------------------------------------------------------ */
  function initTestimonials () {
    var root = document.querySelector('[data-testimonials]');
    if (!root) return;
    var slides = root.querySelectorAll('.testi__slide');
    var dots = root.querySelectorAll('.testi__dot');
    var i = 0, timer;
    function show (n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === i); });
    }
    function next () { show(i + 1); }
    dots.forEach(function (d, idx) { d.addEventListener('click', function () { show(idx); restart(); }); });
    function restart () { clearInterval(timer); if (!reduced) timer = setInterval(next, 7000); }
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);
    show(0);
    restart();
  }

  /* ------------------------------------------------------------------
     6. CURSOR RETICLE
     ------------------------------------------------------------------ */
  function initReticle () {
    if (reduced || !fineHover) return;
    var tiles = document.querySelectorAll('.p-tile');
    if (!tiles.length) return;
    var el = document.createElement('div');
    el.className = 'cursor-reticle';
    el.innerHTML = '<svg class="reg-mark" viewBox="0 0 26 26" width="26" height="26">' +
      '<circle cx="13" cy="13" r="7"/><circle class="dot" cx="13" cy="13" r="1.1"/>' +
      '<line x1="13" y1="0" x2="13" y2="4"/><line x1="13" y1="22" x2="13" y2="26"/>' +
      '<line x1="0" y1="13" x2="4" y2="13"/><line x1="22" y1="13" x2="26" y2="13"/></svg>';
    document.body.appendChild(el);
    var tx = 0, ty = 0, x = 0, y = 0;
    function loop () { x += (tx - x) * 0.18; y += (ty - y) * 0.18; el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    tiles.forEach(function (t) {
      t.addEventListener('mouseenter', function () { el.classList.add('is-active'); });
      t.addEventListener('mouseleave', function () { el.classList.remove('is-active'); });
    });
  }

  /* ------------------------------------------------------------------
     7. PORTFOLIO TILT — subtle, capped, fine-pointer only
     ------------------------------------------------------------------ */
  function initTilt () {
    if (reduced || !fineHover) return;
    document.querySelectorAll('.p-tile__frame').forEach(function (frame) {
      var tile = frame.closest('.p-tile');
      function onMove (e) {
        var r = frame.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        var maxDeg = 5;
        frame.style.transform = 'rotateY(' + (px * maxDeg * 2) + 'deg) rotateX(' + (py * -maxDeg * 2) + 'deg)';
      }
      function onLeave () { frame.style.transform = 'rotateY(0deg) rotateX(0deg)'; }
      tile.addEventListener('mousemove', onMove);
      tile.addEventListener('mouseleave', onLeave);
    });
  }

  /* ------------------------------------------------------------------
     8. PORTFOLIO FILTER
     ------------------------------------------------------------------ */
  function initFilters () {
    var bar = document.querySelector('.p-filters');
    if (!bar) return;
    var buttons = bar.querySelectorAll('.p-filter');
    var tiles = document.querySelectorAll('.p-tile');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var cat = btn.getAttribute('data-filter');
        tiles.forEach(function (tile) {
          var match = cat === 'all' || tile.getAttribute('data-cat') === cat;
          tile.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     10. LIGHTBOX
     ------------------------------------------------------------------ */
  function initLightbox () {
    var lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;
    var img = lightbox.querySelector('img');
    var badge = lightbox.querySelector('[data-lb-badge]');
    var title = lightbox.querySelector('[data-lb-title]');
    var desc = lightbox.querySelector('[data-lb-desc]');
    var closeBtn = lightbox.querySelector('.lightbox__close');
    var lastFocus = null;

    function open (tile) {
      var src = tile.querySelector('img').getAttribute('src');
      img.setAttribute('src', src);
      img.setAttribute('alt', tile.querySelector('img').getAttribute('alt') || '');
      badge.className = 'badge ' + (tile.dataset.catClass || '');
      badge.textContent = tile.dataset.catLabel || '';
      title.textContent = tile.dataset.title || '';
      desc.textContent = tile.dataset.desc || '';
      lastFocus = document.activeElement;
      lightbox.classList.add('is-open');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }
    function close () {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll('.p-tile').forEach(function (tile) {
      tile.addEventListener('click', function (e) { e.preventDefault(); open(tile); });
      tile.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(tile); } });
    });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close(); });
  }

  /* ------------------------------------------------------------------
     init
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initTextSplits();
    initNav();
    initMarquee();
    initTestimonials();
    initReticle();
    initTilt();
    initFilters();
    initLightbox();
    initPreloader(initReveals);
  });
})();
