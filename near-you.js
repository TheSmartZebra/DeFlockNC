/* "Near You" tool: geocodes an address/ZIP (or uses browser location) via
   OpenStreetMap's Nominatim, matches the county/town against DeFlock NC's
   deployment tracker, and links to local meeting calendars. All matching
   happens in the browser; the only network call is the geocode lookup. */
(function () {
  var COMMUNITIES = [
    { county: 'Wake', place: 'Raleigh', status: 'active', note: '~60 cameras (RPD owns 32).' },
    { county: 'Wake', place: 'Apex', status: 'fight', note: 'Contract expires Jan 2027 — residents pushing to block renewal.' },
    { county: 'Wake', place: 'Garner', status: 'fight', note: '~$449K multi-year contract proposed.' },
    { county: 'Durham', place: 'Durham', status: 'active', note: '~46 cameras in the city.' },
    { county: 'Mecklenburg', place: 'Charlotte', status: 'active', note: 'Citywide network; site of the Jasmine Horne wrongful detention.' },
    { county: 'Cumberland', place: 'Fayetteville', status: 'active', note: 'City paid a $60K settlement after a camera-image wrongful arrest.' },
    { county: 'New Hanover', place: 'New Hanover County / Wilmington', status: 'fight', note: 'Sheriff contract; 2.98M searches logged in ~16 months.' },
    { county: 'Granville', place: 'Granville County', status: 'fight', note: 'Sheriff pulled a 10-camera proposal for community input (July 2026).' },
    { county: 'Granville', place: 'Creedmoor', status: 'active', note: 'Shares data with 200+ police departments.' },
    { county: 'Washington', place: 'Plymouth', status: 'active', note: '28 cameras in a town of ~3,000 people.' },
    { county: 'Pitt', place: 'Pitt County / Greenville', status: 'active', note: '~28 county cameras plus 10 city cameras.' },
    { county: 'Watauga', place: 'Boone', status: 'active', note: '~15 cameras; expansion paused.' },
    { county: 'Orange', place: 'Hillsborough', status: 'dropped', note: 'Contract cancelled Dec 2025 over data-sharing terms.' },
    { county: 'Orange', place: 'UNC–Chapel Hill', status: 'active', note: '~23 campus cameras (2026 contract).' },
    { county: 'Lenoir', place: 'Lenoir County', status: 'active', note: '~$48K/yr paid from federal seizure funds.' },
    { county: 'Moore', place: 'Southern Pines', status: 'fight', note: 'Council has called the program "too intrusive."' },
    { county: 'Buncombe', place: 'Asheville', status: 'fight', note: '~11 city cameras advancing amid public comment.' },
    { county: 'Macon', place: 'Macon County', status: 'dropped', note: 'Commissioners voted 5–0 to defund (July 2026).' },
    { county: 'Chatham', place: 'Pittsboro', status: 'dropped', note: 'Contract terminated; equipment removed by July 2026.' },
    { county: 'Chatham', place: 'Chatham County', status: 'dropped', note: 'County voted to remove its own cameras (2026).' },
    { county: 'Madison', place: 'Madison County', status: 'fight', note: 'Sheriff signed Feb 2026; residents blocked from speaking at a meeting.' },
    { county: 'Guilford', place: 'Greensboro (NC A&T)', status: 'active', note: '16 campus cameras searched 1.39M times in 3 months.' }
  ];

  var STATUS = {
    dropped: { tag: 'tag-dropped', label: 'DROPPED / REMOVED', head: 'Good news — Flock has been dropped here', verdict: 'Cameras in this community have been cancelled or removed. Help keep it that way.' },
    fight:   { tag: 'tag-fight',   label: 'BEING DECIDED',     head: 'Not banned — and being decided right now', verdict: 'This is the moment your voice matters most. Show up at the next meeting.' },
    active:  { tag: 'tag-active',  label: 'ACTIVE — NOT BANNED', head: 'Not banned — an active network operates here', verdict: 'Cameras are running today. Organize for non-renewal: contracts come up every year or two.' }
  };
  var RANK = { fight: 3, active: 2, dropped: 1 };

  var out = document.getElementById('nearyou-results');
  var statusEl = document.getElementById('nearyou-status');
  var input = document.getElementById('loc');

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function gsearch(q) { return 'https://www.google.com/search?q=' + encodeURIComponent(q); }

  function render(county, town) {
    var matches = COMMUNITIES.filter(function (c) { return c.county.toLowerCase() === county.toLowerCase(); });
    var townMatch = matches.filter(function (c) {
      return town && c.place.toLowerCase().indexOf(town.toLowerCase()) !== -1;
    });
    var html = '';

    // headline verdict: worst (most urgent) status in the county
    if (matches.length) {
      var top = matches.slice().sort(function (a, b) { return RANK[b.status] - RANK[a.status]; })[0];
      var meta = STATUS[top.status];
      html += '<div class="card" style="border-color:#FF5A1F66;margin-bottom:18px;">' +
        '<div class="kicker" style="margin-bottom:8px;">' + esc(county).toUpperCase() + ' COUNTY' + (town ? ' · ' + esc(town).toUpperCase() : '') + '</div>' +
        '<div style="font-size:22px;font-weight:900;margin-bottom:8px;">' + meta.head + '</div>' +
        '<p class="muted" style="margin:0;font-size:14.5px;line-height:1.6;">' + meta.verdict + ' No NC town has passed an outright ban yet — "dropped" means the community cancelled or removed its cameras.</p></div>';

      html += '<div class="grid g2" style="margin-bottom:18px;">';
      matches.forEach(function (c) {
        var m = STATUS[c.status];
        var hl = townMatch.indexOf(c) !== -1 ? 'border-color:var(--orange);' : '';
        html += '<div class="card" style="' + hl + '">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">' +
          '<strong style="font-size:16px;">' + esc(c.place) + '</strong>' +
          '<span class="tag ' + m.tag + '">' + m.label + '</span></div>' +
          '<p class="muted" style="margin:0;font-size:13.5px;line-height:1.6;">' + esc(c.note) + '</p></div>';
      });
      html += '</div>';
    } else {
      html += '<div class="card" style="margin-bottom:18px;">' +
        '<div class="kicker" style="margin-bottom:8px;">' + esc(county).toUpperCase() + ' COUNTY</div>' +
        '<div style="font-size:20px;font-weight:900;margin-bottom:8px;">No deployment documented on our tracker</div>' +
        '<p class="muted" style="margin:0;font-size:14.5px;line-height:1.6;">That doesn’t guarantee there are no cameras — crowdsourced counts always lag. Check the live map, and if a proposal surfaces at your commission, you’ll be ahead of it.</p></div>';
    }

    // meetings
    html += '<h2 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:26px 0 12px;">Find your next local meeting</h2>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">' +
      '<a class="btn btn-orange" href="' + gsearch(county + ' County NC board of commissioners meeting schedule agenda') + '" target="_blank" rel="noopener">' + esc(county) + ' County commissioners →</a>' +
      (town ? '<a class="btn btn-ghost" href="' + gsearch(town + ' NC town council meeting schedule agenda') + '" target="_blank" rel="noopener">' + esc(town) + ' council meetings →</a>' : '') +
      '<a class="btn btn-ghost" href="https://maps.deflock.org/" target="_blank" rel="noopener">Cameras on the live map →</a>' +
      '</div>' +
      '<p class="dim" style="font-size:12.5px;margin:0 0 26px;">County commissions and town councils post agendas ahead of each meeting — look for the public-comment period, then grab the <a href="take-action.html">three-minute talk track</a>.</p>';

    // national
    html += '<h2 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 12px;">National organizing</h2>' +
      '<div class="card" style="border-color:var(--orange);">' +
      '<div class="kicker" style="margin-bottom:8px;">AUG 16–22, 2026 · NATIONAL WEEK OF ACTION</div>' +
      '<p class="muted" style="margin:0 0 12px;font-size:14px;line-height:1.6;">Communities nationwide are coordinating petition pushes, public comments and flyer drops the same week.</p>' +
      '<a class="btn btn-ghost" href="https://deflock.org/" target="_blank" rel="noopener">deflock.org →</a> ' +
      '<a class="btn btn-ghost" href="https://banthecams.org/" target="_blank" rel="noopener">banthecams.org →</a></div>';

    out.innerHTML = html;
    statusEl.textContent = '';
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
})();
