/* Site-wide plate-scan ticker.
   Records the visitor's arrival time once per browsing session (sessionStorage)
   so the count keeps climbing as they move between pages instead of resetting.
   Drives the big homepage counter (#scan-counter) when it's present; otherwise
   injects a slim persistent ticker bar pinned to the bottom of every page. */
(function () {
  var KEY = 'dfnc_arrival', t;
  try {
    t = sessionStorage.getItem(KEY);
    if (!t) { t = String(Date.now()); sessionStorage.setItem(KEY, t); }
  } catch (e) { t = String(Date.now()); }
  t = parseInt(t, 10) || Date.now();

  var PER_SEC = 20000000000 / (30 * 24 * 3600); // ~20 billion U.S. scans / month
  var fmt = new Intl.NumberFormat('en-US');
  var target = document.getElementById('scan-counter');

  if (!target) {
    var bar = document.createElement('div');
    bar.id = 'dfnc-ticker';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:70;' +
      'background:rgba(15,17,20,.94);border-top:1px solid #2a2d33;' +
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'padding:8px 16px;text-align:center;color:#B8BCC2;' +
      'font:600 12.5px/1.4 "Helvetica Neue",Helvetica,Arial,sans-serif;';
    bar.innerHTML =
      '<a href="index.html" style="text-decoration:none;color:inherit;">' +
      '<b id="dfnc-ticker-n" style="color:#FF5A1F;font-weight:900;font-variant-numeric:tabular-nums;">0</b>' +
      ' license plates scanned across the U.S. since you arrived ›</a>';
    document.body.appendChild(bar);
    document.body.style.paddingBottom = (bar.offsetHeight || 40) + 'px';
    target = document.getElementById('dfnc-ticker-n');
  }

  (function tick() {
    target.textContent = fmt.format(Math.floor((Date.now() - t) / 1000 * PER_SEC));
    requestAnimationFrame(tick);
  })();
})();
