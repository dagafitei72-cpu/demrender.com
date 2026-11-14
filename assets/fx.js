/* demrender.com — the extra motion layer (v12). Loaded after site.js; everything here is decoration and the page
 * works the same without it. Nothing runs with prefers-reduced-motion. */
(function () {
  'use strict';
  var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (mm('(prefers-reduced-motion: reduce)')) return;
  var fine = mm('(hover: hover) and (pointer: fine)');
  var small = window.innerWidth < 760;
  var root = document.documentElement;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  root.classList.add('fx-on');

  var hero = document.getElementById('hero');
  // the hero's beat (site.js writes --hit on the hero while its clip plays)
  var hit = function () { return hero ? (+hero.style.getPropertyValue('--hit') || 0) : 0; };

  /* ================================================= scroll speed, shared by everything */
  var lastY = window.scrollY, vel = 0, lastT = performance.now();
  function sampleScroll(now) {
    var y = window.scrollY, dt = Math.max(1, now - lastT);
    var v = (y - lastY) / dt * 16.7;                 // px per 60 Hz frame
    vel += (v - vel) * 0.18;
    if (Math.abs(vel) < 0.01) vel = 0;
    lastY = y; lastT = now;
  }

  /* ========================================================== the starfield */
  var cv = document.createElement('canvas');
  cv.className = 'stars'; cv.setAttribute('aria-hidden', 'true');
  var aurora = document.querySelector('.aurora');
  if (aurora && aurora.nextSibling) aurora.parentNode.insertBefore(cv, aurora.nextSibling); else document.body.insertBefore(cv, document.body.firstChild);
  var cx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, stars = [];
  var TINTS = ['220, 238, 255', '170, 215, 255', '200, 175, 255', '255, 205, 160', '255, 255, 255'];
  function makeStars() {
    DPR = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    var n = Math.round(clamp(W * H / (small ? 9000 : 6500), 60, 260));
    stars = [];
    for (var i = 0; i < n; i++) {
      var z = Math.random();                       // 0 far .. 1 near
      stars.push({
        x: Math.random() * W, y: Math.random() * H, z: z,
        r: 0.35 + z * z * 1.5, tw: Math.random() * 6.28, ts: 0.6 + Math.random() * 1.8,
        c: TINTS[Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 4) : 1 + Math.floor(Math.random() * 3)],
      });
    }
  }
  makeStars();
  var mx = 0, my = 0, pmx = 0, pmy = 0;            // pointer parallax (-1..1)

  function drawStars(t) {
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.clearRect(0, 0, W, H);
    pmx += (mx - pmx) * 0.04; pmy += (my - pmy) * 0.04;
    var warp = clamp(Math.abs(vel), 0, 90), dir = vel >= 0 ? 1 : -1;
    var flash = hit(), ccx = W / 2, ccy = H * 0.45, diag = Math.sqrt(ccx * ccx + ccy * ccy);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], depth = 0.15 + s.z * 0.85;
      // a slow drift up; while the page scrolls fast, a jump to light speed: out of the middle going down, into it going up
      var ox = s.x - ccx, oy = s.y - ccy, od = Math.sqrt(ox * ox + oy * oy) || 1;
      var ux = ox / od, uy = oy / od, push = warp * depth * 0.32 * (0.25 + od / diag) * dir;
      s.x += 0.015 * depth + ux * push;
      s.y += -0.06 * depth + uy * push;
      var out = s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30;
      if (out && dir > 0 && warp > 0.5) {           // reborn near the middle, so the jump keeps going
        var ra = Math.random() * 6.283, rr = diag * (0.05 + Math.random() * 0.25);
        s.x = ccx + Math.cos(ra) * rr; s.y = ccy + Math.sin(ra) * rr;
      } else if (out || (dir < 0 && od < diag * 0.04)) {   // drifted off, or fell into the middle: back at an edge
        if (Math.random() < 0.5) { s.x = Math.random() * W; s.y = Math.random() < 0.5 ? -20 : H + 20; }
        else { s.y = Math.random() * H; s.x = Math.random() < 0.5 ? -20 : W + 20; }
        if (!(warp > 0.5)) { s.x = Math.random() * W; s.y = H + 20; }
      }
      var x = s.x + pmx * 14 * depth, y = s.y + pmy * 10 * depth;
      var a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.ts + s.tw))) * (0.35 + 0.65 * s.z);
      a = Math.min(1, a * (1 + flash * 0.9 * s.z));
      var len = warp * depth * 2.2 * (0.3 + od / diag);
      if (len > 1.5) {                              // warp: the faster the scroll, the longer the streak
        var ex = x - ux * len * dir, ey = y - uy * len * dir;
        var g = cx.createLinearGradient(x, y, ex, ey);
        g.addColorStop(0, 'rgba(' + s.c + ',' + a + ')');
        g.addColorStop(1, 'rgba(' + s.c + ',0)');
        cx.strokeStyle = g; cx.lineWidth = s.r * 1.3; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(ex, ey); cx.stroke();
      } else {
        cx.fillStyle = 'rgba(' + s.c + ',' + a + ')';
        cx.beginPath(); cx.arc(x, y, s.r * (1 + flash * 0.6 * s.z), 0, 6.283); cx.fill();
        if (s.z > 0.86) {                          // the nearest ones get a soft halo
          cx.fillStyle = 'rgba(' + s.c + ',' + (a * 0.12) + ')';
          cx.beginPath(); cx.arc(x, y, s.r * 4.5, 0, 6.283); cx.fill();
        }
      }
    }
  }
  requestAnimationFrame(function () { cv.classList.add('on'); });
  window.addEventListener('resize', function () { small = window.innerWidth < 760; makeStars(); });

  /* ============================================ the pointer: a light and a ring */
  var aura = null, ring = null, ax = -999, ay = -999, rx = -999, ry = -999, px = -999, py = -999, rs = 0.4, rsT = 0.4;
  if (fine) {
    aura = document.createElement('div'); aura.className = 'aura'; aura.setAttribute('aria-hidden', 'true');
    ring = document.createElement('div'); ring.className = 'ring'; ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(aura); document.body.appendChild(ring);
    var HOT = 'a, button, summary, .clip, .mq-item, .plan, [data-dl]';
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      mx = px / window.innerWidth * 2 - 1; my = py / window.innerHeight * 2 - 1;
      if (ax < -900) { ax = rx = px; ay = ry = py; }
      aura.classList.add('on'); ring.classList.add('on');
      var over = e.target && e.target.closest && e.target.closest(HOT);
      aura.classList.toggle('hot', !!over); ring.classList.toggle('hot', !!over);
      rsT = over ? 1.35 : 0.45;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { aura.classList.remove('on'); ring.classList.remove('on'); });
    window.addEventListener('pointerdown', function () { rs = 0.25; }, { passive: true });
    // nothing over the videos in the lightbox
    var lb = document.getElementById('lightbox');
    if (lb) new MutationObserver(function () { var o = lb.open; aura.style.display = ring.style.display = o ? 'none' : ''; }).observe(lb, { attributes: true, attributeFilter: ['open'] });
  }
  function drawPointer() {
    if (!aura || ax < -900) return;
    ax += (px - ax) * 0.12; ay += (py - ay) * 0.12;
    rx += (px - rx) * 0.35; ry += (py - ry) * 0.35;
    rs += (rsT - rs) * 0.18;
    aura.style.setProperty('--ax', ax.toFixed(1) + 'px'); aura.style.setProperty('--ay', ay.toFixed(1) + 'px');
    aura.style.setProperty('--as', (1 + hit() * 0.25).toFixed(3));
    ring.style.setProperty('--rx2', rx.toFixed(1) + 'px'); ring.style.setProperty('--ry2', ry.toFixed(1) + 'px');
    ring.style.setProperty('--rs', rs.toFixed(3));
  }

  /* ===================================================== sparks on the buttons */
  var sp = document.createElement('canvas');
  sp.className = 'sparks'; sp.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sp);
  var sx = sp.getContext('2d'), parts = [];
  var SPARK = ['143, 214, 255', '176, 124, 255', '255, 95, 168', '255, 190, 90', '255, 255, 255'];
  function burst(x, y, big) {
    var n = big ? 46 : 26;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = (big ? 3.5 : 2.4) + Math.random() * (big ? 7 : 4.5);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, life: 1, d: 0.014 + Math.random() * 0.02,
        r: 1 + Math.random() * 2.2, c: SPARK[(Math.random() * SPARK.length) | 0] });
    }
    parts.push({ ring: true, x: x, y: y, life: 1, d: 0.03, r: 6 });
  }
  document.addEventListener('pointerdown', function (e) {
    var t = e.target && e.target.closest && e.target.closest('.btn, [data-dl], .mq-item, .clip, .period button, .sound, .wn-sound');
    if (t) burst(e.clientX, e.clientY, t.classList.contains('btn-primary') || t.hasAttribute('data-dl'));
  }, { passive: true });
  function drawSparks() {
    if (!parts.length) { if (sp.width) { sp.width = 0; sp.height = 0; } return; }
    var w = window.innerWidth, h = window.innerHeight, d = Math.min(2, window.devicePixelRatio || 1);
    if (sp.width !== Math.round(w * d)) { sp.width = Math.round(w * d); sp.height = Math.round(h * d); }
    sx.setTransform(d, 0, 0, d, 0, 0);
    sx.clearRect(0, 0, w, h);
    sx.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= p.d;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.ring) {
        p.r += 5.5;
        sx.strokeStyle = 'rgba(143, 214, 255,' + (p.life * 0.7) + ')'; sx.lineWidth = 2 * p.life;
        sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 6.283); sx.stroke();
        continue;
      }
      p.vx *= 0.94; p.vy = p.vy * 0.94 + 0.16;
      var ox = p.x, oy = p.y;
      p.x += p.vx; p.y += p.vy;
      sx.strokeStyle = 'rgba(' + p.c + ',' + p.life + ')'; sx.lineWidth = p.r * p.life; sx.lineCap = 'round';
      sx.beginPath(); sx.moveTo(ox - p.vx * 1.5, oy - p.vy * 1.5); sx.lineTo(p.x, p.y); sx.stroke();
    }
    sx.globalCompositeOperation = 'source-over';
  }

  /* ========================================== labels that decode themselves */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>+=';
  function scramble(el) {
    var nodes = [];
    (function walk(n) {
      Array.prototype.forEach.call(n.childNodes, function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) nodes.push({ n: c, t: c.textContent });
        else if (c.nodeType === 1 && !c.classList.contains('dot')) walk(c);
      });
    })(el);
    if (!nodes.length) return;
    var total = nodes.reduce(function (s, x) { return s + x.t.length; }, 0);
    var t0 = performance.now(), dur = Math.min(1100, 420 + total * 18);
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1), done = Math.floor(k * total), at = 0;
      nodes.forEach(function (x) {
        var out = '';
        for (var i = 0; i < x.t.length; i++, at++) {
          var ch = x.t.charAt(i);
          out += at < done || /[\s ·&]/.test(ch) ? ch : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        x.n.textContent = out;
      });
      if (k < 1) requestAnimationFrame(step);
      else nodes.forEach(function (x) { x.n.textContent = x.t; });
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var eo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { eo.unobserve(e.target); setTimeout(function () { scramble(e.target); }, 120); } });
    }, { threshold: 0.8 });
    document.querySelectorAll('.eyebrow').forEach(function (el) { eo.observe(el); });

    /* the line of light at the top of each section */
    var so = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lit'); so.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -25% 0px' });
    document.querySelectorAll('.section').forEach(function (el) { so.observe(el); });
  }

  /* ============================================== holographic plan cards */
  if (fine) {
    document.querySelectorAll('.plan').forEach(function (card) {
      var foil = document.createElement('span'); foil.className = 'foil'; foil.setAttribute('aria-hidden', 'true');
      card.appendChild(foil);
      // only once the cards have come in: their entrance keeps its own timing
      var arm = function () { if (card.parentNode.classList.contains('in')) setTimeout(function () { card.classList.add('holo'); }, 1400); else setTimeout(arm, 400); };
      arm();
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--prx', ((0.5 - y) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--pry', ((x - 0.5) * 11).toFixed(2) + 'deg');
        card.style.setProperty('--fx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--fy', (y * 100).toFixed(1) + '%');
        card.style.setProperty('--fa', ((x - 0.5) * 60).toFixed(1) + 'deg');
      });
      card.addEventListener('pointerleave', function () { card.style.setProperty('--prx', '0deg'); card.style.setProperty('--pry', '0deg'); });
    });
  }

  /* ========================================= the strip and the hero follow the scroll */
  var marquee = document.querySelector('.marquee');
  var mqAnim = null;
  var mqTrack = document.getElementById('mqTrack');
  function strip() {
    if (!marquee) return;
    if (!mqAnim && mqTrack && mqTrack.getAnimations) mqAnim = mqTrack.getAnimations()[0] || null;
    // scrolling down pushes the strip on, scrolling up runs it backwards
    if (mqAnim) mqAnim.playbackRate = clamp(1 + vel * 0.9, -14, 16);
    marquee.style.setProperty('--skew', clamp(-vel * 0.35, -7, 7).toFixed(2) + 'deg');
  }
  function heroOut() {
    if (!hero) return;
    var r = hero.getBoundingClientRect();
    var k = clamp(-r.top / Math.max(1, r.height * 0.85), 0, 1);
    hero.style.setProperty('--ho', k.toFixed(3));
  }

  /* ================================================================ one loop */
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) { lastT = performance.now(); lastY = window.scrollY; requestAnimationFrame(frame); }
  });
  function frame(now) {
    if (!running) return;
    sampleScroll(now);
    drawStars(now);
    drawPointer();
    drawSparks();
    strip();
    heroOut();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
