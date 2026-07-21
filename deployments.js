/* Renders the NC deployment table from deployments.json (the single source
   of truth shared with the Near You tool). If the fetch fails, the static
   fallback rows already in the table's <tbody> stay visible. */
(function () {
  var tbody = document.getElementById('deploy-rows');
  if (!tbody) return;

  var STATUS = {
    active:  { cls: 'tag-active',  label: 'Active' },
    fight:   { cls: 'tag-fight',   label: 'Being decided' },
    dropped: { cls: 'tag-dropped', label: 'Dropped' }
  };
  var RANK = { fight: 0, active: 1, dropped: 2 };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/->/g, '→')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  fetch('deployments.json?t=' + Math.floor(Date.now() / 300000))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = (data.communities || []).slice().sort(function (a, b) {
        return (RANK[a.status] - RANK[b.status]);
      });
      tbody.innerHTML = list.map(function (c) {
        var s = STATUS[c.status] || STATUS.active;
        var note = esc(c.note);
        if (c.link) {
          var lt = esc(c.linkText || c.place.split(' ')[0]);
          note = note.replace(lt, '<a href="' + c.link + '" target="_blank" rel="noopener">' + lt + '</a>');
        }
        return '<tr><td>' + esc(c.place) + '</td><td>' + esc(c.cameras) +
          '</td><td><span class="tag ' + s.cls + '">' + s.label +
          '</span></td><td>' + note + '</td></tr>';
      }).join('');
    })
    .catch(function () { /* keep static fallback rows */ });
})();
