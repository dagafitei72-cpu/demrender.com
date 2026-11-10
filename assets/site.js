/* demrender.com — download link from the latest GitHub release, the hero sound toggle,
 * the clip gallery (moves on hover, plays with sound on click). No cookies, no tracking. */
(function () {
  'use strict';
  var REPO = 'dagafitei72-cpu/demrender-releases';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ download: newest installer */
  // The big button offers the visitor's own system; the line under it offers the other one.
  function mb(n) { return Math.round(n / 1048576) + ' MB'; }
  var ua = navigator.userAgent || '';
  var forced = /[?&]os=(linux|windows)\b/i.exec(location.search);   // demrender.com/?os=linux links straight to the AppImage
  var onLinux = forced ? forced[1].toLowerCase() === 'linux'
    : /Linux|X11/.test(navigator.platform || ua) && !/Android|CrOS/i.test(ua);
  var OS = {
    win: { label: 'Download for Windows', alt: 'Windows', req: 'Windows 10 and 11 (64-bit)', test: /^DemRender-Setup-.*\.exe$/i },
    linux: { label: 'Download for Linux', alt: 'Linux (AppImage)', req: 'Linux AppImage (64-bit)', test: /^DemRender-.*\.AppImage$/i },
  };
  function setAll(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  // Each system gets the newest release that carries its file: a new Windows version can go out before
  // its Linux build, and the Linux link then simply stays on the previous version.
  var ver = function (rel) { return String(rel.tag_name).replace(/^v/, ''); };
  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=15', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (list) {
      if (!list || !list.length) return;
      var rels = list.filter(function (r) { return !r.draft && !r.prerelease && r.assets; });
      var find = function (os) {
        for (var i = 0; i < rels.length; i++) {
          var a = rels[i].assets.filter(function (x) { return OS[os].test.test(x.name); })[0];
          if (a) return { file: a, rel: rels[i] };
        }
        return null;
      };
      var files = { win: find('win'), linux: find('linux') };
      var main = onLinux && files.linux ? 'linux' : 'win';
      var other = main === 'win' ? 'linux' : 'win';
      if (!files[main]) return;
      setAll('[data-dl]', function (a) { a.href = files[main].file.browser_download_url; });
      setAll('[data-dl-label]', function (s) { s.textContent = OS[main].label; });
      var date = new Date(files[main].rel.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      var info = document.querySelector('[data-info]');
      if (info) {
        info.textContent = '';
        var b = document.createElement('b');
        b.textContent = 'Version ' + ver(files[main].rel);
        info.appendChild(b);
        info.appendChild(document.createTextNode(' · ' + mb(files[main].file.size) + ' · ' + date + ' · Free · ' + OS[main].req));
      }
      // the other system, under the button
      if (files[other]) {
        var sameVer = ver(files[other].rel) === ver(files[main].rel);
        setAll('[data-dl-alt]', function (a) { a.href = files[other].file.browser_download_url; a.textContent = OS[other].alt; });
        setAll('[data-alt-size]', function (s) { s.textContent = ' · ' + mb(files[other].file.size) + (sameVer ? '' : ' · version ' + ver(files[other].rel)); });
        setAll('[data-alt]', function (p) { p.hidden = false; });
      }
    })
    .catch(function () { /* offline or rate-limited: the links keep pointing at the releases page */ });

  /* ----------------------------------------------------------- hero video */
  var hv = document.getElementById('heroVideo');
  var hs = document.getElementById('heroSound');
  if (hv) {
    if (reduceMotion) hv.removeAttribute('autoplay');
    else hv.play().catch(function () { /* autoplay blocked: the poster stays */ });
  }
  if (hv && hs) {
    hs.addEventListener('click', function () {
      var on = hs.getAttribute('aria-pressed') !== 'true';
      hv.muted = !on;
      hs.setAttribute('aria-pressed', String(on));
      hs.title = on ? 'Sound off' : 'Sound on';
      if (on) { hv.currentTime = 0; hv.play().catch(function () {}); }
    });
  }

  /* --------------------------------------------- gallery: posters, hover, play */
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.clip').forEach(function (el) {
    var id = el.getAttribute('data-clip');
    var name = el.getAttribute('data-name');
    el.setAttribute('aria-label', 'Play ' + name + ' with sound');
    var pic = document.createElement('picture');
    pic.innerHTML = '<source srcset="/assets/media/' + id + '.webp" type="image/webp">';
    var img = document.createElement('img');
    img.src = '/assets/media/' + id + '.jpg'; img.alt = ''; img.loading = 'lazy'; img.width = 1280; img.height = 720;
    pic.appendChild(img);
    el.appendChild(pic);
    var meta = document.createElement('span');
    meta.className = 'meta';
    meta.innerHTML = '<span class="name"></span><span class="fam"></span>';
    meta.firstChild.textContent = name;
    meta.lastChild.textContent = el.getAttribute('data-family');
    el.appendChild(meta);
    var p = document.createElement('span');
    p.className = 'play'; p.innerHTML = PLAY;
    el.appendChild(p);

    var v = null;
    function start() {
      if (reduceMotion || !finePointer) return;
      if (!v) {
        v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
        v.src = '/assets/media/' + id + '.mp4';
        el.insertBefore(v, meta);
      }
      v.currentTime = 0;
      v.play().then(function () { el.classList.add('playing'); }).catch(function () {});
    }
    function stop() { if (v) { v.pause(); el.classList.remove('playing'); } }
    el.addEventListener('mouseenter', start);
    el.addEventListener('mouseleave', stop);
    el.addEventListener('click', function () { stop(); openClip(id, name); });
  });

  /* lightbox with sound */
  var lb = document.getElementById('lightbox');
  var lbv = document.getElementById('lbVideo');
  var lbn = document.getElementById('lbName');
  function openClip(id, name) {
    if (!lb || !lb.showModal) { window.location.href = '/assets/media/' + id + '.mp4'; return; }
    if (hv && !hv.muted) { hv.muted = true; hs && hs.setAttribute('aria-pressed', 'false'); }
    lbv.src = '/assets/media/' + id + '.mp4';
    lbv.poster = '/assets/media/' + id + '.jpg';
    lbn.textContent = name + ' · made in DemRender';
    lb.showModal();
    lbv.muted = false;
    lbv.play().catch(function () {});
  }
  function closeClip() { lbv.pause(); lbv.removeAttribute('src'); lbv.load(); if (lb.open) lb.close(); }
  if (lb) {
    document.getElementById('lbClose').addEventListener('click', closeClip);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeClip(); });
    lb.addEventListener('close', function () { lbv.pause(); });
  }

  /* ------------------------- videos that only play while seen (the phone, the band) */
  var autos = document.querySelectorAll('video[data-auto]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.play().catch(function () {});
        else en.target.pause();
      });
    }, { threshold: 0.15 });
    autos.forEach(function (v) { io.observe(v); });
  }

  /* ======================================================== motion on scroll */
  var root = document.documentElement;

  // reveal: things fade up as they come into view; groups come in one after another
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 8)); });
  });
  var revealables = document.querySelectorAll('[data-reveal], [data-stagger]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        ro.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { ro.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }
  // the hero shows straight away, one line after the other
  document.querySelectorAll('.hero [data-reveal]').forEach(function (el, i) {
    el.style.setProperty('--i', i);
    requestAnimationFrame(function () { el.classList.add('in'); });
  });
  root.classList.add('fx-ready');

  // numbers count up when they appear
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    el.textContent = '0';
    var co = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      co.disconnect();
      var t0 = performance.now();
      (function tick(now) {
        var k = Math.min(1, (now - t0) / 1400);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    });
    co.observe(el);
  });

  // one scroll handler, run once per frame: progress bar, header, rising screenshots, steps line, band parallax
  var progress = document.getElementById('progress');
  var top = document.querySelector('.top');
  var tilts = document.querySelectorAll('[data-tilt]');
  var steps = document.getElementById('steps');
  var bandBg = document.querySelector('.band-bg');
  var gate = document.getElementById('gate');
  var smooth = function (a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = root.scrollHeight - vh;
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (top) top.classList.toggle('scrolled', y > 24);
    if (reduceMotion) return;
    tilts.forEach(function (el) {
      var r = el.getBoundingClientRect();
      // 1 while still below the fold, 0 once its top has risen to 60% of the screen
      var k = Math.max(0, Math.min(1, (r.top - vh * 0.6) / (vh * 0.45)));
      el.style.setProperty('--tilt', k.toFixed(3));
    });
    if (gate) {
      // pinned for (its height - one screen): the doors part over most of that, then the view holds open
      var gr = gate.getBoundingClientRect();
      var run = gate.offsetHeight - vh;
      var gp = run > 0 ? Math.max(0, Math.min(1, -gr.top / run)) : 1;
      gate.style.setProperty('--g', smooth(0.04, 0.7, gp).toFixed(4));
    }
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var s = Math.max(0, Math.min(1, (vh * 0.85 - sr.top) / (sr.height + vh * 0.25)));
      steps.style.setProperty('--line', s.toFixed(3));
    }
    if (bandBg) {
      var br = bandBg.parentNode.getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh) bandBg.style.setProperty('--py', ((br.top + br.height / 2 - vh / 2) * -0.15).toFixed(1) + 'px');
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // gallery cards lean towards the mouse, with a light that follows it
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.clip').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  // the endless strip: the list twice, so it can loop; a click plays the clip with sound
  var mq = document.getElementById('mqTrack');
  if (mq) {
    Array.prototype.slice.call(mq.children).forEach(function (b) {
      var c = b.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; mq.appendChild(c);
    });
    mq.addEventListener('click', function (e) {
      var b = e.target.closest('.mq-item');
      if (b) openClip(b.getAttribute('data-clip'), b.getAttribute('data-name'));
    });
  }

  /* ================================================ the hero moves with the beat */
  // The clip's beat, worked out from its sound ahead of time (tools/site/envelope.py), so the glow and the
  // equalizer follow the music even while the clip plays muted.
  var hero = document.getElementById('hero');
  var eq = document.getElementById('heroEq');
  var ALPH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var val = function (s, i) { var k = ALPH.indexOf(s.charAt(i)); return k < 0 ? 0 : k / 61; };
  var beatP = fetch('/assets/media/hero-trap.beat.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  if (hv && hero && eq && !reduceMotion) {
    var beat = null, visible = true, raf = 0;
    beatP.then(function (b) { beat = b; if (beat) loop(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && beat && !raf) loop(); }).observe(hero);
    }
    var ctx = eq.getContext('2d');
    var bars = [];
    var draw = function (f) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = eq.clientWidth, h = eq.clientHeight;
      if (eq.width !== Math.round(w * dpr) || eq.height !== Math.round(h * dpr)) { eq.width = Math.round(w * dpr); eq.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var nb = beat.bands, n = Math.max(24, Math.floor(w / 11)), gap = 3;
      var bw = (w - gap * (n - 1)) / n;
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#ff7a2a'); grad.addColorStop(0.5, '#ffd23f'); grad.addColorStop(1, '#3fb2ff');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255, 150, 60, .55)'; ctx.shadowBlur = 10;
      for (var i = 0; i < n; i++) {
        // mirrored: lows in the middle, highs to the sides — like the visualizer itself
        var pos = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
        var b = Math.min(nb - 1, Math.floor(pos * nb));
        var v = val(beat.spec, f * nb + b);
        bars[i] = Math.max(v, (bars[i] || 0) * 0.86);          // fall back slowly, like a meter
        var bh = Math.max(2, bars[i] * (h - 4));
        var x = i * (bw + gap), yy = (h - bh) / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, yy, bw, bh, Math.min(bw / 2, 3)); else ctx.rect(x, yy, bw, bh);
        ctx.fill();
      }
    };
    var loop = function () {
      raf = 0;
      if (!visible || !beat) return;
      var f = Math.floor((hv.currentTime || 0) * beat.fps) % beat.frames;
      hero.style.setProperty('--hit', val(beat.hit, f).toFixed(3));
      hero.style.setProperty('--bass', val(beat.bass, f).toFixed(3));
      hero.style.setProperty('--energy', val(beat.energy, f).toFixed(3));
      draw(f);
      raf = requestAnimationFrame(loop);
    };
  }

  /* ========================== the download band: waves of light on the same beat */
  var band = document.getElementById('bandViz');
  if (band) {
    var bctx = band.getContext('2d');
    var bandOn = false, braf = 0, bbeat = null, t0 = performance.now();
    var COLORS = ['63, 178, 255', '176, 124, 255', '255, 95, 168', '255, 160, 60'];
    var drawBand = function (now) {
      braf = 0;
      if (!bandOn || !bbeat) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = band.clientWidth, h = band.clientHeight;
      if (band.width !== Math.round(w * dpr) || band.height !== Math.round(h * dpr)) { band.width = Math.round(w * dpr); band.height = Math.round(h * dpr); }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, w, h);
      var t = ((now || performance.now()) - t0) / 1000;
      var f = Math.floor(t * bbeat.fps) % bbeat.frames;
      var nb = bbeat.bands, hit = val(bbeat.hit, f), energy = val(bbeat.energy, f);
      bctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < 4; k++) {
        var amp = h * (0.2 + 0.4 * energy + 0.3 * hit) / (1 + k * 0.35);
        bctx.beginPath();
        for (var x = 0; x <= w; x += 6) {
          var u = x / w, y = 0;
          // each band of the spectrum is one ripple along the line
          for (var b = 0; b < nb; b += 3) {
            var a = val(bbeat.spec, f * nb + b);
            y += a * Math.sin(u * (2 + b * 0.55) * Math.PI + t * (0.8 + b * 0.07) + k * 1.7);
          }
          y = h / 2 + (y / (nb / 3)) * amp * Math.sin(u * Math.PI);          // calm at both ends
          if (x === 0) bctx.moveTo(x, y); else bctx.lineTo(x, y);
        }
        bctx.strokeStyle = 'rgba(' + COLORS[k] + ',' + (0.55 - k * 0.08) + ')';
        bctx.lineWidth = 2.2 - k * 0.3;
        bctx.shadowColor = 'rgba(' + COLORS[k] + ', .9)';
        bctx.shadowBlur = 14 + 22 * hit;
        bctx.stroke();
      }
      bctx.globalCompositeOperation = 'source-over';
      if (!reduceMotion) braf = requestAnimationFrame(drawBand);
    };
    beatP.then(function (b) {
      bbeat = b;
      if (!b) return;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          bandOn = en[0].isIntersecting;
          if (bandOn && !braf) braf = requestAnimationFrame(drawBand);
        }).observe(band);
      } else { bandOn = true; drawBand(); }
    });
  }
})();

/* ======================================================================
   The lower page: headings rise word by word, the gallery is dealt from a
   stack, the features tell a story beside one screen, the formats frame
   changes shape, a sentence lights up, buttons pull towards the pointer,
   FAQ answers slide open, the name rises at the end.
   ====================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (a, b, x) { var u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  var easeOut = function (u) { return 1 - Math.pow(1 - u, 3); };

  /* FAQ answers slide open and shut (also without motion preferences it stays a normal <details>) */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var s = d.querySelector('summary');
    if (!s || reduceMotion || !d.animate) return;
    s.addEventListener('click', function (e) {
      e.preventDefault();
      var from = d.offsetHeight, to;
      if (d.open) {
        to = s.offsetHeight;
        d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.75,.15,1)' })
          .onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        to = d.offsetHeight;
        d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 380, easing: 'cubic-bezier(.2,.75,.15,1)' });
      }
    });
  });

  if (reduceMotion) return;

  /* headings: wrap every word so it can rise out of its own slot */
  document.querySelectorAll('h2[data-reveal]').forEach(function (h) {
    var i = 0;
    var wrapWord = function (content) {
      var w = document.createElement('span'); w.className = 'w';
      var wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--wi', i++);
      if (typeof content === 'string') wi.textContent = content; else wi.appendChild(content);
      w.appendChild(wi);
      return w;
    };
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            frag.appendChild(/^\s+$/.test(p) ? document.createTextNode(p) : wrapWord(p));
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('grad')) {            // a gradient phrase moves as one piece
            var holder = document.createElement('span');
            n.parentNode.replaceChild(holder, n);
            holder.parentNode.replaceChild(wrapWord(n), holder);
          } else walk(n);
        }
      });
    })(h);
    h.setAttribute('data-split', '');
  });

  /* the sentence: one span per word */
  var statement = document.querySelector('[data-words]');
  var words = [];
  if (statement) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'sw'; s.textContent = p; words.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(statement);
  }

  /* gallery: where each card starts — the middle of the gallery, on a stack */
  var gallery = document.querySelector('[data-deal]');
  var cards = gallery ? Array.prototype.slice.call(gallery.children) : [];
  var dealOffsets = [];
  function measureDeal() {
    if (!gallery) return;
    gallery.style.position = 'relative';
    var gw = gallery.offsetWidth, gh = gallery.offsetHeight;
    dealOffsets = cards.map(function (c) {
      return { x: gw / 2 - (c.offsetLeft + c.offsetWidth / 2), y: Math.min(gh, window.innerHeight) * 0.35 - (c.offsetTop + c.offsetHeight / 2) };
    });
  }

  /* features: a story beside one fixed screen, on wide screens */
  var fwrap = document.querySelector('#features .wrap');
  var features = fwrap ? Array.prototype.slice.call(fwrap.querySelectorAll(':scope > .feature')) : [];
  var story = null, storyCopies = [], storyScreens = [], storyNav = null, storyLabels = [];
  var wide = window.matchMedia('(min-width: 1001px)');
  function buildStory() {
    if (story || !features.length) return;
    story = document.createElement('div'); story.className = 'story';
    var copies = document.createElement('div'); copies.className = 'story-copies';
    var stage = document.createElement('div'); stage.className = 'story-stage';
    var screens = document.createElement('div'); screens.className = 'story-screens';
    storyCopies = []; storyScreens = []; storyLabels = [];
    features.forEach(function (f) {
      var copy = f.querySelector('.feature-copy');
      var visual = f.querySelector(':scope > .shot, :scope > .export-visual');
      var screen = document.createElement('div'); screen.className = 'story-screen';
      copies.appendChild(copy);
      screen.appendChild(visual);
      screens.appendChild(screen);
      storyCopies.push(copy); storyScreens.push(screen);
      var eb = copy.querySelector('.eyebrow');
      storyLabels.push(eb ? eb.textContent.trim() : '');
      f.style.display = 'none';
    });
    storyNav = document.createElement('div'); storyNav.className = 'story-nav';
    storyNav.innerHTML = '<span class="num">01</span><span class="bar"><i></i></span><span class="label"></span>';
    stage.appendChild(screens); stage.appendChild(storyNav);
    story.appendChild(copies); story.appendChild(stage);
    fwrap.insertBefore(story, features[0]);
  }
  function unbuildStory() {
    if (!story) return;
    features.forEach(function (f, i) {
      f.insertBefore(storyCopies[i], f.firstChild);
      var visual = storyScreens[i].firstChild;
      if (f.classList.contains('flip')) f.appendChild(visual); else f.appendChild(visual);
      f.style.display = '';
    });
    story.remove(); story = null;
  }
  function layoutStory() { if (wide.matches) buildStory(); else unbuildStory(); }
  layoutStory();
  if (wide.addEventListener) wide.addEventListener('change', function () { layoutStory(); measureDeal(); onScroll(); });

  /* formats: the frame's size for each shape */
  var morph = document.getElementById('formats');
  var frame = document.getElementById('morphFrame');
  var badge = document.getElementById('morphBadge');
  var mImgs = frame ? Array.prototype.slice.call(frame.querySelectorAll('img')) : [];
  var mItems = morph ? Array.prototype.slice.call(morph.querySelectorAll('.morph-list li')) : [];
  var RATIOS = [16 / 9, 9 / 16, 1, 4 / 5], NAMES = ['16:9', '9:16', '1:1', '4:5'];
  var mActive = -1;
  function frameSize(r, maxW, maxH) {
    var w = Math.min(maxW, maxH * r), h = w / r;
    if (h > maxH) { h = maxH; w = h * r; }
    return { w: w, h: h };
  }

  var footMark = document.getElementById('footMark');
  var magnets = Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]'));

  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;

    // gallery dealt from the stack
    if (gallery && window.innerWidth < 700) {
      // one long column on a phone: each card rises on its own as it comes in
      gallery.classList.remove('dealing');
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var e = easeOut(clamp((vh * 1.02 - r.top) / (vh * 0.4), 0, 1)), k = 1 - e;
        c.style.setProperty('--dx', '0px');
        c.style.setProperty('--dy', (70 * k).toFixed(1) + 'px');
        c.style.setProperty('--dr', ((i % 2 ? 4 : -4) * k).toFixed(2) + 'deg');
        c.style.setProperty('--ds', (0.9 + 0.1 * e).toFixed(3));
        c.style.zIndex = '';
      });
    } else if (gallery && dealOffsets.length) {
      var gr = gallery.getBoundingClientRect();
      var p = clamp((vh * 0.98 - gr.top) / (vh * 0.62), 0, 1);
      gallery.classList.toggle('dealing', p > 0 && p < 1);
      cards.forEach(function (c, i) {
        var e = easeOut(clamp((p - i * 0.035) / (1 - (cards.length - 1) * 0.035), 0, 1));
        var o = dealOffsets[i], k = 1 - e;
        c.style.setProperty('--dx', (o.x * k).toFixed(1) + 'px');
        c.style.setProperty('--dy', (o.y * k).toFixed(1) + 'px');
        c.style.setProperty('--dr', (((i % 3) - 1) * 7 + (i - 4) * 1.2) * k + 'deg');
        c.style.setProperty('--ds', (0.74 + 0.26 * e).toFixed(3));
        c.style.zIndex = e < 1 ? String(20 - i) : '';
      });
    }

    // the story: which chapter is in the middle of the screen
    if (story) {
      var best = 0, bestD = Infinity;
      storyCopies.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - vh / 2);
        if (d < bestD) { bestD = d; best = i; }
      });
      storyCopies.forEach(function (c, i) { c.classList.toggle('on', i === best); });
      storyScreens.forEach(function (s, i) { s.classList.toggle('on', i === best); });
      var sr = story.getBoundingClientRect();
      var sp = clamp((vh * 0.5 - sr.top) / (sr.height - vh * 0.5), 0, 1);
      storyNav.querySelector('.num').textContent = '0' + (best + 1);
      storyNav.querySelector('.label').textContent = storyLabels[best];
      storyNav.style.setProperty('--sp', sp.toFixed(3));
      storyNav.querySelector('.bar i').style.setProperty('--sp', sp.toFixed(3));
    }

    // formats: the frame changes shape on the way through
    if (morph && frame) {
      var mr = morph.getBoundingClientRect();
      var run = morph.offsetHeight - vh;
      var mp = run > 0 ? clamp(-mr.top / run, 0, 1) : 0;
      var f = mp * (RATIOS.length - 1);
      var a = Math.min(RATIOS.length - 2, Math.floor(f)), t = smooth(0.25, 0.75, f - a);
      var stageEl = frame.parentNode;
      var maxW = stageEl.clientWidth, maxH = stageEl.clientHeight;
      var s0 = frameSize(RATIOS[a], maxW, maxH), s1 = frameSize(RATIOS[a + 1], maxW, maxH);
      frame.style.setProperty('--fw', (s0.w + (s1.w - s0.w) * t).toFixed(1) + 'px');
      frame.style.setProperty('--fh', (s0.h + (s1.h - s0.h) * t).toFixed(1) + 'px');
      var act = t > 0.5 ? a + 1 : a;
      if (act !== mActive) {
        mActive = act;
        mImgs.forEach(function (im, i) { im.classList.toggle('on', i === act); });
        mItems.forEach(function (li, i) { li.classList.toggle('on', i === act); });
        if (badge) badge.textContent = NAMES[act];
      }
    }

    // the sentence lights up as it is read
    if (statement && words.length) {
      var section = statement.closest('.statement-section');
      var st = section.getBoundingClientRect();
      var wp = clamp((vh * 0.35 - st.top) / (section.offsetHeight - vh * 0.85), 0, 1);
      var n = words.length;
      words.forEach(function (w, i) {
        var lit = clamp(wp * (n + 3) - i, 0, 1);
        w.style.setProperty('--o', (0.14 + 0.86 * lit).toFixed(3));
      });
    }

    // the name rises at the end
    if (footMark) {
      var fr = footMark.getBoundingClientRect();
      var fm = clamp((vh - fr.top) / (fr.height * 1.1), 0, 1);
      footMark.style.setProperty('--fm', easeOut(fm).toFixed(3));
    }
  }

  measureDeal();
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { measureDeal(); onScroll(); });
  window.addEventListener('load', function () { measureDeal(); onScroll(); });
  onScroll();

  /* the big download buttons pull a little towards the pointer */
  if (finePointer && magnets.length) {
    window.addEventListener('pointermove', function (e) {
      magnets.forEach(function (b) {
        var r = b.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy;
        var near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 60;
        b.style.setProperty('--mgx', near ? (dx * 0.22).toFixed(1) + 'px' : '0px');
        b.style.setProperty('--mgy', near ? (dy * 0.3).toFixed(1) + 'px' : '0px');
      });
    }, { passive: true });
  }
})();
