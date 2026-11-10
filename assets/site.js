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
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      var find = function (os) { return rel.assets.filter(function (a) { return OS[os].test.test(a.name); })[0]; };
      var files = { win: find('win'), linux: find('linux') };
      var main = onLinux && files.linux ? 'linux' : 'win';
      var other = main === 'win' ? 'linux' : 'win';
      if (!files[main]) return;
      setAll('[data-dl]', function (a) { a.href = files[main].browser_download_url; });
      setAll('[data-dl-label]', function (s) { s.textContent = OS[main].label; });
      var date = new Date(rel.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      var info = document.querySelector('[data-info]');
      if (info) {
        info.textContent = '';
        var b = document.createElement('b');
        b.textContent = 'Version ' + String(rel.tag_name).replace(/^v/, '');
        info.appendChild(b);
        info.appendChild(document.createTextNode(' · ' + mb(files[main].size) + ' · ' + date + ' · Free · ' + OS[main].req));
      }
      // the other system, under the button (only when the release carries it)
      if (files[other]) {
        setAll('[data-dl-alt]', function (a) { a.href = files[other].browser_download_url; a.textContent = OS[other].alt; });
        setAll('[data-alt-size]', function (s) { s.textContent = ' · ' + mb(files[other].size); });
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

  /* -------------------------------- the phone in the export section plays when seen */
  var autos = document.querySelectorAll('video[data-auto]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.play().catch(function () {});
        else en.target.pause();
      });
    }, { threshold: 0.3 });
    autos.forEach(function (v) { io.observe(v); });
  }
})();
