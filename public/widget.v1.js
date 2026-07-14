/*! ProjectCheckin Website Integration widget v1 — https://projectcheckin.com
 * Versioned file: never introduce breaking changes. Breaking changes ship as widget.v2.js. */
(function () {
  'use strict';

  // Capture script origin immediately (currentScript is null in async callbacks)
  var API_BASE = 'https://projectcheckin.com';
  try {
    var cs = document.currentScript;
    if (cs && cs.src) API_BASE = new URL(cs.src).origin;
  } catch (e) { /* keep default */ }

  function init() {
    var mount = document.getElementById('pc-widget');
    if (!mount) return;
    var orgSlug = mount.getAttribute('data-org');
    if (!orgSlug) return;

    var state = { org: null, jobs: [], total: 0, filter: null };

    fetch(API_BASE + '/api/embed/' + encodeURIComponent(orgSlug))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.jobs) return; // fail silently — never break the host page
        state.org = data.org;
        state.jobs = data.jobs;
        state.total = data.total || data.jobs.length;
        render(mount, state);
        openFromHash(state);
      })
      .catch(function () { /* fail silently */ });
  }

  // ── helpers ──────────────────────────────────────────────────────────

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Only allow http(s) hrefs for org-supplied URLs — blocks javascript: URI injection
  // if a non-validated value ever reaches this API response.
  function safeHref(raw) {
    try {
      var u = new URL(String(raw), window.location.href);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  function slugify(v) {
    return String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function jobDate(job) {
    if (!job.createdAt) return null;
    var d = new Date(job.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }

  function shortDate(job) {
    var d = jobDate(job);
    return d ? MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear() : '';
  }

  function longDate(job) {
    var d = jobDate(job);
    return d ? MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : '';
  }

  function hashSlug(job) {
    var parts = [slugify(job.jobType), slugify(job.city), slugify(job.state)].filter(Boolean).join('-');
    var d = jobDate(job);
    if (d) parts += '-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return parts;
  }

  function cardPhoto(job) {
    return (job.photoUrls && job.photoUrls[0]) || job.beforePhotoUrl || null;
  }

  function modalPhotos(job) {
    if (job.photoUrls && job.photoUrls.length) return job.photoUrls;
    return [job.beforePhotoUrl, job.afterPhotoUrl].filter(Boolean);
  }

  function cityLabel(job) {
    return [job.city, job.state].filter(Boolean).join(', ');
  }

  // ── styles ───────────────────────────────────────────────────────────

  var CSS = '' +
    '#pc-widget{color:#0F172A;line-height:1.5}' +
    '#pc-widget *{box-sizing:border-box;margin:0;padding:0}' +
    '.pcw-h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-bottom:10px}' +
    '.pcw-intro{font-size:14.5px;color:#374151;line-height:1.7;margin-bottom:24px;max-width:820px}' +
    '.pcw-tabs{display:flex;gap:6px;margin-bottom:32px;flex-wrap:wrap}' +
    '.pcw-tab{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;border:1.5px solid #E2E8F0;color:#475569;background:#fff;font-family:inherit}' +
    '.pcw-tab.pcw-on{background:#0F172A;color:#fff;border-color:#0F172A}' +
    '.pcw-group{margin-bottom:36px}' +
    '.pcw-h2{font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:12px}' +
    '.pcw-h2:after{content:"";flex:1;height:1px;background:#E2E8F0}' +
    '.pcw-count{font-size:11.5px;font-weight:600;color:#94A3B8;background:#F1F5F9;padding:2px 8px;border-radius:20px;flex-shrink:0}' +
    '.pcw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}' +
    '@media(max-width:768px){.pcw-grid{grid-template-columns:1fr}}' +
    '.pcw-card{border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;cursor:pointer;background:#fff;transition:box-shadow .15s,transform .15s}' +
    '.pcw-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.1);transform:translateY(-1px)}' +
    '.pcw-photo{height:160px;width:100%;object-fit:cover;display:block;background:#F1F5F9}' +
    '.pcw-nophoto{height:160px;width:100%;background:#F1F5F9}' +
    '.pcw-cbody{padding:12px 14px}' +
    '.pcw-h3{font-size:13px;font-weight:700;margin-bottom:4px;line-height:1.3}' +
    '.pcw-meta{font-size:11.5px;color:#94A3B8;margin-bottom:6px}' +
    '.pcw-snip{font-size:11.5px;color:#64748B;line-height:1.5}' +
    '.pcw-morewrap{text-align:center;margin:24px 0 28px}' +
    '.pcw-more{display:inline-flex;align-items:center;gap:6px;padding:9px 24px;border-radius:8px;font-size:13px;font-weight:600;border:1.5px solid #E2E8F0;color:#475569;background:#fff;cursor:pointer;font-family:inherit}' +
    '.pcw-jsonld{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748B;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:5px 10px;margin-bottom:20px}' +
    '.pcw-dot{width:6px;height:6px;border-radius:50%;background:#16A34A;flex-shrink:0}' +
    '.pcw-foot{text-align:center;padding-top:20px;border-top:1px solid #F1F5F9}' +
    '.pcw-foot a{font-size:11.5px;font-weight:600;color:#94A3B8;text-decoration:none}' +
    '.pcw-foot b{color:#F97316;font-weight:700}' +
    '.pcw-overlay{position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.pcw-modal{background:#fff;border-radius:14px;width:100%;max-width:580px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);position:relative}' +
    '.pcw-mphotowrap{height:240px;position:relative;background:#0F172A}' +
    '.pcw-mphoto{width:100%;height:100%;object-fit:cover;display:block}' +
    '.pcw-close{position:absolute;top:12px;right:12px;width:32px;height:32px;background:rgba(0,0,0,.4);border-radius:50%;border:none;color:#fff;cursor:pointer;font-size:18px;line-height:1}' +
    '.pcw-arrow{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.4);color:#fff;cursor:pointer;font-size:16px;line-height:1}' +
    '.pcw-mbody{padding:20px 22px 0}' +
    '.pcw-mlabel{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;margin-bottom:3px}' +
    '.pcw-mh2{font-size:20px;font-weight:800;margin-bottom:6px;line-height:1.2}' +
    '.pcw-mloc{font-size:13px;color:#64748B;margin-bottom:14px}' +
    '.pcw-mdesc{font-size:13px;color:#374151;line-height:1.7;margin-bottom:14px;max-height:160px;overflow-y:auto;white-space:pre-wrap}' +
    '.pcw-mfoot{padding:13px 22px;border-top:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;gap:12px}' +
    '.pcw-mlinks{display:flex;flex-direction:column;gap:4px;min-width:0}' +
    '.pcw-share{font-size:12px;color:#0284C7;text-decoration:none;font-weight:600}' +
    '.pcw-pck{font-size:11px;color:#94A3B8;text-decoration:none}' +
    '.pcw-est{background:#0F172A;color:#fff;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;border:none;cursor:pointer;text-decoration:none;flex-shrink:0;font-family:inherit}';

  // ── JSON-LD ──────────────────────────────────────────────────────────

  function injectJsonLd(state) {
    var old = document.getElementById('pcw-jsonld');
    if (old) old.parentNode.removeChild(old);
    var items = state.jobs.map(function (job, i) {
      var item = {
        '@type': 'Service',
        name: job.jobType,
        areaServed: {
          '@type': 'City',
          name: job.city || '',
          containedInPlace: { '@type': 'State', name: job.state || '' }
        },
        provider: { '@type': 'LocalBusiness', name: state.org.name }
      };
      if (job.latitude != null && job.longitude != null) {
        item.provider.geo = { '@type': 'GeoCoordinates', latitude: String(job.latitude), longitude: String(job.longitude) };
      }
      var photo = cardPhoto(job);
      if (photo) {
        item.image = {
          '@type': 'ImageObject',
          url: photo,
          description: job.jobType + ' in ' + cityLabel(job)
        };
      }
      return { '@type': 'ListItem', position: i + 1, item: item };
    });
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: state.org.name + ' — Completed Jobs',
      itemListElement: items
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'pcw-jsonld';
    script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  }

  // ── render ───────────────────────────────────────────────────────────

  function render(mount, state) {
    if (!document.getElementById('pcw-style')) {
      var style = document.createElement('style');
      style.id = 'pcw-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    mount.textContent = '';
    mount.appendChild(el('h1', 'pcw-h1', 'Our Work'));

    var intro = state.org.portfolioIntro || state.org.introDefault;
    if (intro) mount.appendChild(el('p', 'pcw-intro', intro));

    var tabs = el('div', 'pcw-tabs');
    mount.appendChild(tabs);

    var groupsWrap = el('div', '');
    mount.appendChild(groupsWrap);

    var moreWrap = el('div', 'pcw-morewrap');
    var moreBtn = el('button', 'pcw-more', 'Load more jobs');
    moreBtn.type = 'button';
    moreWrap.appendChild(moreBtn);
    mount.appendChild(moreWrap);

    var badge = el('div', 'pcw-jsonld');
    badge.appendChild(el('span', 'pcw-dot'));
    badge.appendChild(document.createTextNode('JSON-LD schema active'));
    var badgeWrap = el('div', '');
    badgeWrap.appendChild(badge);
    mount.appendChild(badgeWrap);

    var foot = el('div', 'pcw-foot');
    var footLink = el('a', '');
    footLink.href = API_BASE;
    footLink.target = '_blank';
    footLink.rel = 'noopener';
    footLink.appendChild(document.createTextNode('Job documentation by '));
    footLink.appendChild(el('b', '', 'ProjectCheckin'));
    foot.appendChild(footLink);
    mount.appendChild(foot);

    function renderTabs() {
      tabs.textContent = '';
      var types = [];
      state.jobs.forEach(function (j) {
        if (j.jobType && types.indexOf(j.jobType) === -1) types.push(j.jobType);
      });
      var all = ['All Jobs'].concat(types);
      all.forEach(function (t) {
        var isAll = t === 'All Jobs';
        var active = isAll ? state.filter === null : state.filter === t;
        var b = el('button', 'pcw-tab' + (active ? ' pcw-on' : ''), t);
        b.type = 'button';
        b.onclick = function () {
          state.filter = isAll ? null : t;
          renderTabs();
          renderGroups();
        };
        tabs.appendChild(b);
      });
    }

    function renderGroups() {
      groupsWrap.textContent = '';
      var jobs = state.filter ? state.jobs.filter(function (j) { return j.jobType === state.filter; }) : state.jobs;

      // Group by city+state, ordered by job count desc
      var groups = {};
      var order = [];
      jobs.forEach(function (j) {
        var key = cityLabel(j) || 'Other locations';
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(j);
      });
      order.sort(function (a, b) { return groups[b].length - groups[a].length; });

      order.forEach(function (key) {
        var group = el('div', 'pcw-group');
        var h2 = el('h2', 'pcw-h2', key === 'Other locations' ? 'Projects' : 'Projects in ' + key);
        var n = groups[key].length;
        h2.appendChild(el('span', 'pcw-count', n + (n === 1 ? ' job' : ' jobs')));
        group.appendChild(h2);

        var grid = el('div', 'pcw-grid');
        groups[key].forEach(function (job) {
          grid.appendChild(buildCard(job, state));
        });
        group.appendChild(grid);
        groupsWrap.appendChild(group);
      });
    }

    moreBtn.onclick = function () {
      moreBtn.disabled = true;
      fetch(API_BASE + '/api/embed/' + encodeURIComponent(state.org.slug) + '?offset=' + state.jobs.length)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          moreBtn.disabled = false;
          if (!data || !data.jobs) return;
          state.jobs = state.jobs.concat(data.jobs);
          state.total = data.total || state.total;
          renderTabs();
          renderGroups();
          injectJsonLd(state);
          moreWrap.style.display = state.jobs.length < state.total ? '' : 'none';
        })
        .catch(function () { moreBtn.disabled = false; });
    };

    renderTabs();
    renderGroups();
    injectJsonLd(state);
    moreWrap.style.display = state.jobs.length < state.total ? '' : 'none';
  }

  function buildCard(job, state) {
    var card = el('div', 'pcw-card');
    var photo = cardPhoto(job);
    if (photo) {
      var img = el('img', 'pcw-photo');
      img.src = photo;
      img.alt = job.jobType + ' in ' + cityLabel(job);
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      card.appendChild(el('div', 'pcw-nophoto'));
    }
    var body = el('div', 'pcw-cbody');
    body.appendChild(el('h3', 'pcw-h3', job.jobType));
    var meta = [cityLabel(job), shortDate(job)].filter(Boolean).join(' · ');
    if (meta) body.appendChild(el('div', 'pcw-meta', meta));
    if (job.description) body.appendChild(el('div', 'pcw-snip', job.description.slice(0, 120)));
    card.appendChild(body);
    card.onclick = function () { openModal(job, state); };
    return card;
  }

  // ── job modal ────────────────────────────────────────────────────────

  function openModal(job, state) {
    var slug = hashSlug(job);
    try { window.history.pushState(null, '', window.location.pathname + '#' + slug); } catch (e) {}

    var photos = modalPhotos(job);
    var photoIdx = 0;

    var overlay = el('div', 'pcw-overlay');
    var modal = el('div', 'pcw-modal');
    overlay.appendChild(modal);

    function close() {
      try { window.history.pushState(null, '', window.location.pathname); } catch (e) {}
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    overlay.onclick = function (e) { if (e.target === overlay) close(); };

    // Photo area
    if (photos.length) {
      var wrap = el('div', 'pcw-mphotowrap');
      var img = el('img', 'pcw-mphoto');
      img.alt = job.jobType + ' in ' + cityLabel(job) + ' — ' + job.jobType + ' service';
      img.src = photos[0];
      wrap.appendChild(img);
      if (photos.length > 1) {
        var prev = el('button', 'pcw-arrow', '‹');
        prev.type = 'button';
        prev.style.left = '12px';
        var next = el('button', 'pcw-arrow', '›');
        next.type = 'button';
        next.style.right = '12px';
        prev.onclick = function () { photoIdx = (photoIdx - 1 + photos.length) % photos.length; img.src = photos[photoIdx]; };
        next.onclick = function () { photoIdx = (photoIdx + 1) % photos.length; img.src = photos[photoIdx]; };
        wrap.appendChild(prev);
        wrap.appendChild(next);
      }
      var closeBtn = el('button', 'pcw-close', '×');
      closeBtn.type = 'button';
      closeBtn.onclick = close;
      wrap.appendChild(closeBtn);
      modal.appendChild(wrap);
    } else {
      var bar = el('div', '');
      bar.style.cssText = 'position:relative;height:48px';
      var cb = el('button', 'pcw-close', '×');
      cb.type = 'button';
      cb.onclick = close;
      bar.appendChild(cb);
      modal.appendChild(bar);
    }

    // Body
    var body = el('div', 'pcw-mbody');
    body.appendChild(el('div', 'pcw-mlabel', 'Completed job'));
    body.appendChild(el('h2', 'pcw-mh2', job.jobType + (cityLabel(job) ? ' — ' + cityLabel(job) : '')));
    var loc = ['📍 ' + (cityLabel(job) || ''), longDate(job), job.jobType].filter(Boolean).join(' · ');
    body.appendChild(el('div', 'pcw-mloc', loc));
    if (job.description) body.appendChild(el('div', 'pcw-mdesc', job.description));
    modal.appendChild(body);

    // Footer
    var foot = el('div', 'pcw-mfoot');
    var links = el('div', 'pcw-mlinks');
    var share = el('a', 'pcw-share', 'Share this job →');
    share.href = window.location.pathname + '#' + slug;
    links.appendChild(share);
    var pck = el('a', 'pcw-pck', 'Also on projectcheckin.com →');
    pck.href = job.pckUrl;
    pck.target = '_blank';
    pck.rel = 'noopener';
    links.appendChild(pck);
    foot.appendChild(links);
    var estHref = state.org.portfolioPageUrl ? safeHref(state.org.portfolioPageUrl) : null;
    if (estHref) {
      var est = el('a', 'pcw-est', 'Get a free estimate');
      est.href = estHref;
      foot.appendChild(est);
    }
    modal.appendChild(foot);

    document.body.appendChild(overlay);
  }

  // Open a job modal directly when the page is loaded with a job hash (shared links)
  function openFromHash(state) {
    var h = window.location.hash.replace(/^#/, '');
    if (!h) return;
    for (var i = 0; i < state.jobs.length; i++) {
      if (hashSlug(state.jobs[i]) === h) { openModal(state.jobs[i], state); return; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
