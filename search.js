/* Client-side full-text search across the site's own pages.
   Fetches each page once (same-origin), strips nav/footer chrome,
   and matches every query term against the remaining text. */
(function () {
  var PAGES = [
    { u: 'index.html', t: 'Home' },
    { u: 'cameras.html', t: 'The Cameras — How Flock ALPRs Work & Where They Are in NC' },
    { u: 'who-runs-nc.html', t: 'Who Runs NC — The People Who Decide on Surveillance' },
    { u: 'news.html', t: 'News & Updates' },
    { u: 'faq.html', t: 'FAQ — Common Questions' },
    { u: 'take-action.html', t: 'Take Action — The Advocacy Toolbox' },
    { u: 'materials.html', t: 'Materials — Posters, Flyers & Stickers' },
    { u: 'contact.html', t: 'Contact' },
    { u: 'near-you.html', t: 'Near You — Flock Status & Meetings in Your County' },
    { u: 'article-granville.html', t: 'Granville County Sheriff Expresses Concern Over Flock Cameras' },
    { u: 'article-ncshp.html', t: 'Dishonesty & Lack of Transparency from the NC State Highway Patrol Office' },
    { u: 'article-creedmoor.html', t: 'Mass Surveillance in Creedmoor' }
  ];

  var input = document.getElementById('q');
  var results = document.getElementById('results');
  var status = document.getElementById('search-status');
  if (!input || !results) return;

  var docs = null;

  function pageText(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    ['header', 'footer', 'script', 'style', 'nav'].forEach(function (sel) {
      doc.querySelectorAll(sel).forEach(function (el) { el.remove(); });
    });
    return (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function load() {
    if (docs) return Promise.resolve(docs);
    status.textContent = 'Loading pages…';
    return Promise.all(PAGES.map(function (p) {
      return fetch(p.u).then(function (r) { return r.text(); })
        .then(function (html) { return { u: p.u, t: p.t, text: pageText(html) }; })
        .catch(function () { return { u: p.u, t: p.t, text: '' }; });
    })).then(function (d) { docs = d; return d; });
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var idx = -1;
    for (var i = 0; i < terms.length; i++) {
      idx = lower.indexOf(terms[i]);
      if (idx !== -1) break;
    }
    if (idx === -1) idx = 0;
    var start = Math.max(0, idx - 90);
    var end = Math.min(text.length, idx + 210);
    var s = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    var out = escHtml(s);
    terms.forEach(function (t) {
      out = out.replace(new RegExp('(' + escRe(escHtml(t)) + ')', 'gi'), '<mark>$1</mark>');
    });
    return out;
  }

  function run() {
    var q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '';
      status.textContent = q.length ? 'Keep typing…' : '';
      return;
    }
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    load().then(function (d) {
      var hits = [];
      d.forEach(function (p) {
        var hay = (p.t + ' ' + p.text).toLowerCase();
        var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
        if (!ok) return;
        var score = 0;
        terms.forEach(function (t) {
          score += hay.split(t).length - 1;
          if (p.t.toLowerCase().indexOf(t) !== -1) score += 10;
        });
        hits.push({ p: p, score: score });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      status.textContent = hits.length
        ? hits.length + (hits.length === 1 ? ' page matches' : ' pages match') + ' “' + q + '”'
        : 'No matches for “' + q + '” — try fewer or different words.';
      results.innerHTML = hits.map(function (h) {
        return '<a class="card" href="' + h.p.u + (terms[0] ? '' : '') + '" style="display:block;color:var(--ink);margin-bottom:14px;">' +
          '<div style="font-size:18px;font-weight:800;margin-bottom:6px;color:var(--orange);">' + escHtml(h.p.t) + '</div>' +
          '<div class="muted" style="font-size:14px;line-height:1.6;">' + snippet(h.p.text, terms) + '</div>' +
          '</a>';
      }).join('');
    });
  }

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 200);
  });
  input.form && input.form.addEventListener('submit', function (e) { e.preventDefault(); run(); });

  var params = new URLSearchParams(location.search);
  if (params.get('q')) {
    input.value = params.get('q');
    run();
  }
  input.focus();
})();
