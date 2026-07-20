/* Signature counter for the DeFlock NC petition on change.org.
   change.org blocks cross-origin reads, so a scheduled GitHub Action
   (.github/workflows/petition-count.yml) refreshes signatures.json hourly
   and the page reads it same-origin. The counter stays hidden if the file
   is missing or the count is zero, so the page never shows a broken number. */
(function () {
  var els = document.querySelectorAll('[data-sig-count]');
  if (!els.length) return;

  fetch('signatures.json?t=' + Math.floor(Date.now() / 300000))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var n = d && d.count;
      if (typeof n !== 'number' || n < 1) return;
      els.forEach(function (el) {
        el.textContent = n.toLocaleString('en-US');
        var wrap = el.closest('.sig-wrap');
        if (wrap) wrap.style.display = '';
      });
    })
    .catch(function () {});
})();
