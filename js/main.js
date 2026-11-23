/* Pet Hall Pet Shop · interface e animações
   GSAP + ScrollTrigger + SplitText: entrada do hero (bolha, letras pulando, marca-texto), bolhas de sabão,
   contador de banhos, mural de pets revelado, passos do banho acendendo.
   Motion: molas nos botões, botão magnético, lupa de microscópio, rastro de patinhas, latido da logo. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = doc.classList.contains('reduce');
  var M = window.Motion || null;
  var G = window.gsap || null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var spring = function (k, d) { return { type: 'spring', stiffness: k, damping: d }; };

  if (G) {
    if (window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);
    if (window.SplitText) G.registerPlugin(window.SplitText);
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ nav e menu */
  var nav = $('[data-nav]');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 20); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
    doc.classList.toggle('menu-open', open);
    menu.hidden = !open;
    if (open && M && !reduce) {
      M.animate(menu, { opacity: [0, 1] }, { duration: 0.25 });
      M.animate($$('nav a', menu), { opacity: [0, 1], x: [-24, 0] }, { delay: M.stagger ? M.stagger(0.05) : 0, duration: 0.45, ease: [0.22, 0.8, 0.24, 1] });
    }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) setMenu(false); });

  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'loja', 'banho', 'ciencia', 'pets', 'avaliacoes', 'visite', 'redes'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------ horário (fuso de São Paulo) */
  (function hours() {
    var open = { 2: [8, 18.5], 3: [8, 18.5], 4: [8, 18.5], 5: [8, 18.5], 6: [8, 18] };
    var fmt = function (h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + 'h' + (m ? ('0' + m).slice(-2) : ''); };
    var now;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      now = { d: days[get('weekday')], h: parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60 };
    } catch (e) { var d = new Date(); now = { d: d.getDay(), h: d.getHours() + d.getMinutes() / 60 }; }
    var row = $('[data-hours] tr[data-day="' + now.d + '"]');
    if (row) row.classList.add('is-today');
    var today = open[now.d];
    var isOpen = today && now.h >= today[0] && now.h < today[1];
    var status = $('[data-status]');
    var chip = $('[data-open-chip]'), sub = $('[data-open-sub]');
    var names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    var nextOpen = function () {
      for (var i = 1; i <= 7; i++) { var dd = (now.d + i) % 7; if (open[dd]) return i === 1 ? 'amanhã' : names[dd]; }
      return '';
    };
    if (isOpen) {
      status.textContent = 'Aberto agora'; status.classList.add('is-open');
      chip.textContent = 'Aberto agora'; chip.classList.add('is-open');
      sub.textContent = 'hoje até as ' + fmt(today[1]);
    } else {
      status.textContent = 'Fechado agora'; status.classList.add('is-closed');
      chip.textContent = 'Fechado agora'; chip.classList.add('is-closed');
      sub.textContent = (today && now.h < today[0]) ? 'abre hoje às 8h' : 'abre ' + nextOpen() + ' às 8h';
    }
  })();

  /* ------------------------------------------------------------ lupa de microscópio (momento 1) */
  $$('[data-lens]').forEach(function (box) {
    var img = $('img', box);
    var hint = document.createElement('span');
    hint.className = 'lab__hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<svg><use href="#i-lens"/></svg>';
    box.appendChild(hint);
    var lens = document.createElement('span');
    lens.className = 'lens'; lens.setAttribute('aria-hidden', 'true');
    box.appendChild(lens);
    var Z = 2.6;
    var big = null;
    function src() {
      if (big) return big;
      var set = img.getAttribute('srcset');
      if (set) { var all = set.split(',').map(function (s) { return s.trim().split(' ')[0]; }); big = all[all.length - 1]; }
      else big = img.currentSrc || img.src;
      return big;
    }
    function move(x, y) {
      var r = box.getBoundingClientRect();
      var px = Math.max(0, Math.min(r.width, x - r.left)), py = Math.max(0, Math.min(r.height, y - r.top));
      // object-fit: cover → dimensão desenhada
      var iw = img.naturalWidth || r.width, ih = img.naturalHeight || r.height;
      var s = Math.max(r.width / iw, r.height / ih);
      var dw = iw * s, dh = ih * s, ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
      lens.style.left = px + 'px'; lens.style.top = py + 'px';
      lens.style.backgroundSize = (dw * Z) + 'px ' + (dh * Z) + 'px';
      lens.style.backgroundPosition = (-(px - ox) * Z + 75) + 'px ' + (-(py - oy) * Z + 75) + 'px';
    }
    function on(e) {
      lens.style.backgroundImage = 'url("' + src() + '")';
      box.classList.add('is-zoom');
      move(e.clientX, e.clientY);
    }
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') on(e); });
    box.addEventListener('pointermove', function (e) { if (box.classList.contains('is-zoom')) move(e.clientX, e.clientY); });
    box.addEventListener('pointerleave', function () { box.classList.remove('is-zoom'); });
    // toque: segurar e arrastar mostra a lupa; soltar esconde
    box.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') on(e); });
    box.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') box.classList.remove('is-zoom'); });
    box.addEventListener('pointercancel', function () { box.classList.remove('is-zoom'); });
  });

  /* ------------------------------------------------------------ logo que late */
  var stamp = $('[data-stamp]'), woof = $('[data-woof]');
  if (stamp) stamp.addEventListener('click', function () {
    var logo = $('img', stamp);
    if (M && !reduce) {
      M.animate(logo, { y: [0, -18, 0, -6, 0], rotate: [0, -10, 8, -4, 0] }, { duration: 0.8, ease: 'easeOut' });
      M.animate(woof, { opacity: [0, 1, 1, 0], scale: [0.4, 1.08, 1, 0.9], y: [10, 0, 0, -8] }, { duration: 1.4, times: [0, 0.2, 0.75, 1] });
    } else {
      woof.style.opacity = 1; woof.style.transform = 'none';
      setTimeout(function () { woof.style.opacity = 0; }, 1200);
    }
  });

  /* ------------------------------------------------------------ Motion: molas e ímã */
  if (M && !reduce) {
    $$('.btn, .actionbar a, .socials a, .motion-toggle, .stamp').forEach(function (el) {
      el.addEventListener('pointerdown', function () { M.animate(el, { scale: 0.95 }, spring(600, 30)); });
      var up = function () { M.animate(el, { scale: 1 }, spring(420, 14)); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
    });
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          M.animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.3 }, spring(260, 18));
        });
        el.addEventListener('pointerleave', function () { M.animate(el, { x: 0, y: 0 }, spring(260, 14)); });
      });
      // stickers dão um pulinho quando o cartão recebe o ponteiro
      $$('.tile').forEach(function (t) {
        var s = $('.sticker', t);
        t.addEventListener('pointerenter', function () { M.animate(s, { y: [0, -6, 0], scale: [1, 1.06, 1] }, { duration: 0.45 }); });
      });
      // nomes dos pets pulam no mural
      $$('[data-pet]').forEach(function (f) {
        var n = $('.wall__name', f);
        if (n) f.addEventListener('pointerenter', function () { M.animate(n, { y: [0, -8, 0] }, { duration: 0.4 }); });
      });
    }
  }

  /* ------------------------------------------------------------ barras de avaliação */
  var bars = $('[data-bars]');
  if (bars) {
    if (reduce || !('IntersectionObserver' in window)) bars.classList.add('is-in');
    else {
      var bo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bars.classList.add('is-in'); bo.disconnect(); } }, { threshold: 0.4 });
      bo.observe(bars);
    }
  }

  if (!G || reduce) { doc.classList.add('ready'); return; }

  /* ------------------------------------------------------------ bolhas de sabão */
  var hero = $('.hero');
  var bubbleBox = $('[data-bubbles]');
  var loops = [];
  (function bubbles() {
    var n = window.innerWidth < 640 ? 9 : 16;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'bubble';
      var size = G.utils.random(14, window.innerWidth < 640 ? 46 : 70, 1);
      b.style.width = b.style.height = size + 'px';
      b.style.left = G.utils.random(0, 100) + '%';
      bubbleBox.appendChild(b);
      var H = hero.offsetHeight + 160;
      var dur = G.utils.random(9, 18);
      var tw = G.fromTo(b, { y: 0, scale: G.utils.random(.6, 1) }, { y: -H, duration: dur, ease: 'none', repeat: -1, delay: -G.utils.random(0, dur) });
      var wob = G.to(b, { x: G.utils.random(-40, 40), duration: G.utils.random(2.5, 4), ease: 'sine.inOut', yoyo: true, repeat: -1 });
      loops.push(tw, wob);
    }
  })();

  // a bolha da foto "respira"
  var blob = $('[data-hero-blob]'), splash = $('[data-hero-splash]');
  loops.push(G.to(blob, { borderRadius: '44% 56% 48% 52% / 56% 46% 54% 44%', duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  loops.push(G.to(splash, { borderRadius: '54% 46% 44% 56% / 46% 56% 44% 54%', rotate: 4, duration: 6.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  $$('[data-hero-orb]').forEach(function (o, i) {
    loops.push(G.to(o, { y: i ? 12 : -12, duration: 3 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  });

  // pausar animações
  var mt = $('[data-motion-toggle]');
  mt.addEventListener('click', function () {
    var paused = doc.classList.toggle('is-paused');
    loops.forEach(function (t) { paused ? t.pause() : t.resume(); });
    mt.setAttribute('aria-pressed', String(paused));
    $('use', mt).setAttribute('href', paused ? '#i-play' : '#i-pause');
    $('span', mt).textContent = paused ? 'Retomar animações' : 'Pausar animações';
  });

  /* ------------------------------------------------------------ rastro de patinhas no hero */
  if (fine && M) {
    var pawBox = $('[data-paws]'), last = null, side = 1;
    var colors = ['#1f9d3a', '#f7941d', '#3fa9e6', '#ff6f9f'];
    hero.addEventListener('pointermove', function (e) {
      if (doc.classList.contains('is-paused')) return;
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (!last) { last = { x: x, y: y }; return; }
      var dx = x - last.x, dy = y - last.y;
      if (Math.hypot(dx, dy) < 64) return;
      var ang = Math.atan2(dy, dx);
      side = -side;
      var ox = Math.cos(ang + Math.PI / 2) * 10 * side, oy = Math.sin(ang + Math.PI / 2) * 10 * side;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      p.setAttribute('class', 'paw'); p.setAttribute('viewBox', '0 0 64 64');
      p.innerHTML = '<use href="#i-paw"/>';
      p.style.left = (x + ox) + 'px'; p.style.top = (y + oy) + 'px';
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      p.style.transform = 'rotate(' + (ang * 180 / Math.PI + 90) + 'deg)';
      pawBox.appendChild(p);
      M.animate(p, { opacity: [0, .85, 0], scale: [0.4, 1, 0.9] }, { duration: 1.3, times: [0, 0.15, 1] }).finished.then(function () { p.remove(); });
      last = { x: x, y: y };
    });
    hero.addEventListener('pointerleave', function () { last = null; });
  }

  /* ------------------------------------------------------------ entrada do hero (uma vez) */
  (function heroEnter() {
    var title = $('[data-hero-title]');
    var split = null;
    try { if (window.SplitText) split = window.SplitText.create(title, { type: 'words,chars', charsClass: 'ch' }); } catch (e) { split = null; }
    var mark = $('.mark', title);
    var tl = G.timeline({ defaults: { ease: 'expo.out' }, onComplete: function () { doc.classList.add('ready'); } });
    tl.fromTo(splash, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'elastic.out(1, .6)' }, 0)
      .fromTo(blob, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.3, ease: 'elastic.out(1, .55)' }, 0.12)
      .fromTo('[data-hero-img]', { scale: 1.35 }, { scale: 1, duration: 1.8 }, 0.12);
    if (split && split.chars) tl.from(split.chars, { yPercent: 70, opacity: 0, duration: 0.7, stagger: 0.018, ease: 'back.out(2.2)' }, 0.25);
    else tl.from(title, { opacity: 0, y: 30, duration: 0.9 }, 0.25);
    if (mark) tl.fromTo(mark, { '--mk': 0 }, { '--mk': 1, duration: 0.7, ease: 'power3.out' }, 0.95);
    tl.fromTo('[data-hero-fade]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 }, 0.7)
      .fromTo('[data-hero-orb]', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.9, stagger: 0.15, ease: 'back.out(2)' }, 0.9)
      .fromTo('.stamp', { opacity: 0, scale: 0, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.8)', clearProps: 'transform' }, 1.1);
  })();

  if (!window.ScrollTrigger) return;
  var ST = window.ScrollTrigger;

  /* ------------------------------------------------------------ passos do banho acendem conforme a leitura */
  var steps = $$('[data-steps] li');
  steps.forEach(function (li) {
    ST.create({ trigger: li, start: 'top 70%', end: 'bottom 30%', toggleClass: 'is-lit' });
  });

  /* ------------------------------------------------------------ contador e mural de pets (momento 2) */
  var count = $('[data-count]');
  if (count) {
    var obj = { v: 0 };
    ST.create({
      trigger: '.pets', start: 'top 70%', once: true,
      onEnter: function () {
        G.to(obj, { v: 100000, duration: 2.2, ease: 'power3.out', onUpdate: function () { count.textContent = Math.round(obj.v).toLocaleString('pt-BR'); } });
      }
    });
  }
  var pets = $$('[data-pet]');
  if (pets.length) {
    G.set(pets, { clipPath: 'circle(0% at 50% 50%)' });
    ST.create({
      trigger: '[data-wall]', start: 'top 82%', once: true,
      onEnter: function () {
        G.to(pets, { clipPath: 'circle(75% at 50% 50%)', duration: 1.1, ease: 'power3.inOut', stagger: { each: 0.1, from: 'random' }, clearProps: 'clipPath' });
      }
    });
  }

  window.addEventListener('load', function () { ST.refresh(); });
})();
