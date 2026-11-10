/* Runs before the page paints: lets the stylesheet hide what will be revealed on scroll.
 * If the main script never starts, everything is shown again after a moment. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  setTimeout(function () { if (!d.classList.contains('fx-ready')) d.classList.remove('js'); }, 2500);
})();
