/* "Near You" tool: shows the full statewide deployment list (from the shared
   deployments.json, same data as the Cameras page), and lets you geocode an
   address/ZIP or share your location to jump to your county's status and
   local meetings. Geocoding uses OpenStreetMap's Nominatim; all matching
   happens in the browser. */
(function () {
  var STATUS = {
    dropped: { tag: 'tag-dropped', label: 'DROPPED / REMOVED', head: 'Good news — Flock has been dropped here', verdict: 'Cameras in this community have been cancelled or removed. Help keep it that way.' },
    fight:   { tag: 'tag-fight',   label: 'BEING DECIDED',     head: 'Not banned — and being decided right now', verdict: 'This is the moment your voice matters most. Show up at the next meeting.' },
    active:  { tag: 'tag-active',  label: 'ACTIVE — NOT BANNED', head: 'Not banned — an active network operates here', verdict: 'Cameras are running today. Organize for non-renewal: contracts come up every year or two.' }
  };
  var URGENCY = { fight: 3, active: 2, dropped: 1 };   // most-urgent first for the county verdict
  var LISTORDER = { fight: 0, active: 1, dropped: 2 };  // order for the full statewide list

  var out = document.getElementById('nearyou-results');
  var listEl = document.getElementById('nearyou-list');
  var statusEl = document.getElementById('nearyou-status');
  var input = document.getElementById('loc');

  var COMMUNITIES = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/->/g, '→')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function gsearch(q) { return 'https://www.google.com/search?q=' + encodeURIComponent(q); }

  function communityCard(c, highlight) {
    var m = STATUS[c.status] || STATUS.active;
    var hl = highlight ? 'border-color:var(--orange);' : '';
    var note = esc(c.note);
    if (c.link) {
      var lt = esc(c.linkText || c.place.split(' ')[0]);
      note = note.replace(lt, '<a href="' + c.link + '" target="_blank" rel="noopener">' + lt + '</a>');
    }
    return '<div class="card" style="' + hl + '">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">' +
      '<strong style="font-size:16px;">' + esc(c.place) + '</strong>' +
      '<span class="tag ' + m.tag + '">' + m.label + '</span></div>' +
      '<div class="dim" style="font-size:12px;margin-bottom:6px;">' + esc(c.county) + ' County · ' + esc(c.cameras) + '</div>' +
      '<p class="muted" style="margin:0;font-size:13.5px;line-height:1.6;">' + note + '</p></div>';
  }

  // Full statewide list, grouped by status, rendered on load.
  function renderFullList() {
    if (!listEl || !COMMUNITIES.length) return;
    var counts = { fight: 0, active: 0, dropped: 0 };
    COMMUNITIES.forEach(function (c) { if (counts[c.status] != null) counts[c.status]++; });
    var sorted = COMMUNITIES.slice().sort(function (a, b) {
      if (LISTORDER[a.status] !== LISTORDER[b.status]) return LISTORDER[a.status] - LISTORDER[b.status];
      return a.place.localeCompare(b.place);
    });
    listEl.innerHTML =
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px;">' +
        '<span class="tag tag-fight">' + counts.fight + ' being decided</span>' +
        '<span class="tag tag-active">' + counts.active + ' active</span>' +
        '<span class="tag tag-dropped">' + counts.dropped + ' dropped</span>' +
      '</div>' +
      '<div class="grid g3">' + sorted.map(function (c) { return communityCard(c, false); }).join('') + '</div>';
  }

  // County-specific result after a lookup.
  function render(county, town) {
    var matches = COMMUNITIES.filter(function (c) { return c.county.toLowerCase() === county.toLowerCase(); });
    var townMatch = matches.filter(function (c) {
      return town && c.place.toLowerCase().indexOf(town.toLowerCase()) !== -1;
    });
    var html = '';

    if (matches.length) {
      var top = matches.slice().sort(function (a, b) { return URGENCY[b.status] - URGENCY[a.status]; })[0];
      var meta = STATUS[top.status];
      html += '<div class="card" style="border-color:#FF5A1F66;margin-bottom:18px;">' +
        '<div class="kicker" style="margin-bottom:8px;">' + esc(county).toUpperCase() + ' COUNTY' + (town ? ' · ' + esc(town).toUpperCase() : '') + '</div>' +
        '<div style="font-size:22px;font-weight:900;margin-bottom:8px;">' + meta.head + '</div>' +
        '<p class="muted" style="margin:0;font-size:14.5px;line-height:1.6;">' + meta.verdict + ' No NC town has passed an outright ban yet — "dropped" means the community cancelled or removed its cameras.</p></div>';
      html += '<div class="grid g2" style="margin-bottom:18px;">';
      matches.forEach(function (c) { html += communityCard(c, townMatch.indexOf(c) !== -1); });
      html += '</div>';
    } else {
      html += '<div class="card" style="margin-bottom:18px;">' +
        '<div class="kicker" style="margin-bottom:8px;">' + esc(county).toUpperCase() + ' COUNTY</div>' +
        '<div style="font-size:20px;font-weight:900;margin-bottom:8px;">No deployment documented on our tracker</div>' +
        '<p class="muted" style="margin:0;font-size:14.5px;line-height:1.6;">That doesn’t guarantee there are no cameras — crowdsourced counts always lag. Check the live map, and if a proposal surfaces at your commission, you’ll be ahead of it. The full statewide list is below.</p></div>';
    }

    html += '<h2 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:26px 0 12px;">Find your next local meeting</h2>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">' +
      '<a class="btn btn-orange" href="' + gsearch(county + ' County NC board of commissioners meeting schedule agenda') + '" target="_blank" rel="noopener">' + esc(county) + ' County commissioners →</a>' +
      (town ? '<a class="btn btn-ghost" href="' + gsearch(town + ' NC town council meeting schedule agenda') + '" target="_blank" rel="noopener">' + esc(town) + ' council meetings →</a>' : '') +
      '<a class="btn btn-ghost" href="https://maps.deflock.org/" target="_blank" rel="noopener">Cameras on the live map →</a>' +
      '</div>' +
      '<p class="dim" style="font-size:12.5px;margin:0 0 26px;">County commissions and town councils post agendas ahead of each meeting — look for the public-comment period, then grab the <a href="take-action.html">three-minute talk track</a>.</p>';

    html += '<h2 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 12px;">National organizing</h2>' +
      '<div class="card" style="border-color:var(--orange);">' +
      '<div class="kicker" style="margin-bottom:8px;">AUG 16–22, 2026 · NATIONAL WEEK OF ACTION</div>' +
      '<p class="muted" style="margin:0 0 12px;font-size:14px;line-height:1.6;">Communities nationwide are coordinating petition pushes, public comments and flyer drops the same week.</p>' +
      '<a class="btn btn-ghost" href="https://deflock.org/" target="_blank" rel="noopener">deflock.org →</a> ' +
      '<a class="btn btn-ghost" href="https://banthecams.org/" target="_blank" rel="noopener">banthecams.org →</a></div>';

    out.innerHTML = html;
    statusEl.textContent = '';
    if (out.scrollIntoView) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function lookupResult(a) {
    if (!a) { statusEl.textContent = 'Could not find that location — try a ZIP code or "Town, NC".'; return; }
    var state = a.state || '';
    if (state && state !== 'North Carolina') {
      statusEl.textContent = 'That looks like ' + state + ' — this tool covers North Carolina. Try a NC address or ZIP.';
      return;
    }
    var county = (a.county || '').replace(/ County$/i, '');
    var town = a.city || a.town || a.village || a.hamlet || '';
    if (!county) { statusEl.textContent = 'Found the spot but not the county — try adding your town name.'; return; }
    render(county, town);
  }

  function geocode(q) {
    statusEl.textContent = 'Looking up…';
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) { lookupResult(d && d[0] && d[0].address); })
      .catch(function () { statusEl.textContent = 'Lookup failed — check your connection and try again.'; });
  }

  document.getElementById('loc-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q) geocode(/^\d{5}$/.test(q) ? q + ' North Carolina' : q + (/nc|north carolina/i.test(q) ? '' : ', North Carolina'));
  });

  document.getElementById('use-location').addEventListener('click', function () {
    if (!navigator.geolocation) { statusEl.textContent = 'Your browser does not support location sharing — enter a ZIP instead.'; return; }
    statusEl.textContent = 'Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      statusEl.textContent = 'Looking up your county…';
      fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude)
        .then(function (r) { return r.json(); })
        .then(function (d) { lookupResult(d && d.address); })
        .catch(function () { statusEl.textContent = 'Lookup failed — try entering a ZIP code instead.'; });
    }, function () {
      statusEl.textContent = 'Location permission declined — no problem, enter a ZIP or town instead.';
    });
  });

  // Load the shared dataset, then render the full statewide list.
  fetch('deployments.json?t=' + Math.floor(Date.now() / 300000))
    .then(function (r) { return r.json(); })
    .then(function (data) { COMMUNITIES = data.communities || []; renderFullList(); })
    .catch(function () {
      if (listEl) listEl.innerHTML = '<p class="dim">Could not load the deployment list — see the <a href="cameras.html#deployments">full table on the Cameras page</a>.</p>';
    });
})();
