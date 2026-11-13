/* demrender.com — how many people visit and download, counted without cookies.
 * Each page sends DemRender's own server one anonymous note: the page, the name of the site the visit came from,
 * and whether it is a phone or a computer; a Download click sends one more. Nothing is stored in the browser,
 * nothing identifies the visitor, and browsers that ask not to be tracked (Do Not Track, Global Privacy Control)
 * send nothing. Opening demrender.com/?notrack once keeps this browser out of the count for good. */
(function () {
  'use strict';
  var API = 'https://demrender-api.demrender-server.workers.dev/v1/hit';
  try {
    if (/[?&]notrack\b/.test(location.search)) localStorage.setItem('dr-notrack', '1');
    if (localStorage.getItem('dr-notrack') === '1') return;
  } catch (_) { /* storage blocked: counted like anyone */ }
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  if (!navigator.sendBeacon || !window.JSON) return;

  var from = '';
  try { from = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
  var inside = /(^|\.)demrender\.com$/.test(from);           // a page after the first one of a visit
  var phone = Math.min(screen.width, screen.height) < 600 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  var path = location.pathname || '/';
  if (document.title && /not found/i.test(document.title)) path = '/404';

  function send(o) { try { navigator.sendBeacon(API, JSON.stringify(o)); } catch (_) {} }
  send({ p: path, r: inside ? '' : from, s: inside ? 0 : 1, m: phone ? 1 : 0 });

  // the Download buttons (the installer for Windows, the AppImage for Linux)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-dl], [data-dl-alt]') : null;
    if (!a) return;
    send({ e: 'dl', os: /AppImage|linux/i.test(a.href + ' ' + a.textContent) ? 'linux' : 'win', p: path, m: phone ? 1 : 0 });
  }, true);
})();
