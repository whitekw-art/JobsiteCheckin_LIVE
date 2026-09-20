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
        scrollToHash(state);
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
      // No base argument: a scheme-less string (e.g. "example.com") must throw here
      // rather than silently resolve as a relative path against the host page's own origin.
      var u = new URL(String(raw));
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

  function longDate(job) {
    var d = jobDate(job);
    return d ? MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : '';
  }

  function hashSlug(job) {
    var parts = [slugify(job.jobType), slugify(job.city), slugify(job.state)].filter(Boolean).join('-');
    var d = jobDate(job);
    if (d) parts += '-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    // Short id suffix guarantees uniqueness — two jobs of the same type/city/date would
    // otherwise collide on an identical slug (and, now, an identical schema.org URL).
    if (job.id) parts += '-' + String(job.id).slice(-6);
    return parts;
  }

  function cardPhoto(job) {
    return (job.photoUrls && job.photoUrls[0]) || job.beforePhotoUrl || null;
  }

  function jobPhotos(job) {
    if (job.photoUrls && job.photoUrls.length) return job.photoUrls;
    return [job.beforePhotoUrl, job.afterPhotoUrl].filter(Boolean);
  }

  function cityLabel(job) {
    return [job.city, job.state].filter(Boolean).join(', ');
  }

  // ── styles ───────────────────────────────────────────────────────────

  // Note: every rule that sets margin/padding is scoped under #pc-widget (rather than a
  // bare .pcw-* class) so it reliably beats the #pc-widget *{margin:0;padding:0} reset
  // below — a plain class selector has lower CSS specificity than an ID+universal
  // selector and loses regardless of source order, which was silently zeroing out most
  // of the intended spacing before this fix.
  var CSS = '' +
    '#pc-widget{color:#0F172A;line-height:1.5}' +
    '#pc-widget *{box-sizing:border-box;margin:0;padding:0}' +
    '#pc-widget .pcw-h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-bottom:14px}' +
    '#pc-widget .pcw-intro{font-size:14.5px;color:#374151;line-height:1.75;margin-bottom:32px;max-width:820px}' +
    '#pc-widget .pcw-empty{font-size:14px;color:#64748B;padding:20px 0}' +
    '#pc-widget .pcw-tabs{display:flex;gap:8px;margin-bottom:44px;flex-wrap:wrap}' +
    '.pcw-tab{padding:8px 18px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;border:1.5px solid #E2E8F0;color:#475569;background:#fff;font-family:inherit}' +
    '.pcw-tab.pcw-on{background:#0F172A;color:#fff;border-color:#0F172A}' +
    '#pc-widget .pcw-group{margin-bottom:56px}' +
    '#pc-widget .pcw-h2{font-size:16px;font-weight:700;margin-bottom:22px;display:flex;align-items:center;gap:14px}' +
    '.pcw-h2:after{content:"";flex:1;height:1px;background:#E2E8F0}' +
    '#pc-widget .pcw-count{font-size:11.5px;font-weight:600;color:#94A3B8;background:#F1F5F9;padding:3px 10px;border-radius:20px;flex-shrink:0}' +
    // Each job renders inline, in the page, so its full text is present in the DOM
    // without any interaction — a modal kept the description out of the rendered page.
    '#pc-widget .pcw-job{padding-bottom:34px;margin-bottom:34px;border-bottom:1px solid #F1F5F9}' +
    '#pc-widget .pcw-job:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}' +
    '#pc-widget .pcw-h3{font-size:19px;font-weight:800;margin-bottom:6px;line-height:1.3;letter-spacing:-.01em}' +
    '#pc-widget .pcw-meta{font-size:12.5px;color:#94A3B8;margin-bottom:16px}' +
    '#pc-widget .pcw-photos{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}' +
    '.pcw-photo{width:210px;height:150px;object-fit:cover;border-radius:6px;border:1px solid #E2E8F0;display:block;background:#F1F5F9}' +
    '@media(max-width:700px){.pcw-photo{width:100%;height:190px}}' +
    '#pc-widget .pcw-desc{font-size:13.5px;color:#374151;line-height:1.8;margin-bottom:14px;max-width:760px;white-space:pre-wrap;padding-left:14px;border-left:3px solid #e8a83a}' +
    '#pc-widget .pcw-jlinks{display:flex;gap:18px;align-items:center;flex-wrap:wrap}' +
    '.pcw-pck{font-size:12px;color:#94A3B8;text-decoration:none}' +
    '.pcw-share{font-size:12px;color:#0284C7;text-decoration:none;font-weight:600}' +
    '#pc-widget .pcw-morewrap{text-align:center;margin:28px 0 32px}' +
    '.pcw-more{display:inline-flex;align-items:center;gap:6px;padding:9px 24px;border-radius:8px;font-size:13px;font-weight:600;border:1.5px solid #E2E8F0;color:#475569;background:#fff;cursor:pointer;font-family:inherit}' +
    '#pc-widget .pcw-jsonld{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748B;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:5px 10px;margin-bottom:20px}' +
    '.pcw-dot{width:6px;height:6px;border-radius:50%;background:#16A34A;flex-shrink:0}' +
    '#pc-widget .pcw-foot{text-align:center;padding-top:24px;border-top:1px solid #F1F5F9}' +
    '.pcw-foot a{font-size:11.5px;font-weight:600;color:#94A3B8;text-decoration:none}' +
    '.pcw-foot b{color:#F97316;font-weight:700}' +
    '#pc-widget .pcw-estwrap{text-align:center;margin:0 0 30px}' +
    '.pcw-est{background:#0F172A;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:700;border:none;cursor:pointer;text-decoration:none;display:inline-block;font-family:inherit}';

  // ── JSON-LD ──────────────────────────────────────────────────────────

  function injectJsonLd(state) {
    var old = document.getElementById('pcw-jsonld');
    if (old) old.parentNode.removeChild(old);

    // Namespaced (not just "#business") so this doesn't collide with any other JSON-LD
    // already present on the host page.
    var business = { '@type': 'LocalBusiness', '@id': '#pcw-business', name: state.org.name };
    var bizUrl = state.org.website && safeHref(state.org.website);
    if (bizUrl) business.url = bizUrl;
    if (state.org.phone) business.telephone = state.org.phone;
    if (state.org.email) business.email = state.org.email;
    var reviewLink = state.org.gbpReviewLink && safeHref(state.org.gbpReviewLink);
    if (reviewLink) business.sameAs = [reviewLink];

    var pageUrl = window.location.origin + window.location.pathname;
    var collectionName = state.org.name + ' — Completed Jobs';

    var items = state.jobs.map(function (job, i) {
      var areaServed = {
        '@type': 'City',
        name: job.city || '',
        containedInPlace: { '@type': 'State', name: job.state || '' }
      };
      if (job.latitude != null && job.longitude != null) {
        areaServed.geo = { '@type': 'GeoCoordinates', latitude: String(job.latitude), longitude: String(job.longitude) };
      }
      var item = {
        '@type': 'Service',
        name: job.jobType,
        areaServed: areaServed,
        provider: { '@id': '#pcw-business' }
      };
      if (job.description) item.description = job.description;
      if (job.createdAt) item.datePublished = job.createdAt;
      var photoHref = safeHref(cardPhoto(job));
      if (photoHref) {
        item.image = {
          '@type': 'ImageObject',
          url: photoHref,
          description: job.jobType + ' in ' + cityLabel(job)
        };
      }
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: pageUrl + '#' + hashSlug(job),
        item: item
      };
    });

    var page = {
      '@type': 'CollectionPage',
      '@id': '#pcw-page',
      url: pageUrl,
      name: collectionName,
      mainEntity: { '@id': '#pcw-itemlist' }
    };
    var itemList = {
      '@type': 'ItemList',
      '@id': '#pcw-itemlist',
      name: collectionName,
      itemListElement: items
    };
    var schema = {
      '@context': 'https://schema.org',
      '@graph': [business, page, itemList]
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

    // One estimate CTA for the whole page. Repeating it under every job read as
    // spam once job detail moved inline.
    var estHref = state.org.portfolioPageUrl ? safeHref(state.org.portfolioPageUrl) : null;
    if (estHref) {
      var estWrap = el('div', 'pcw-estwrap');
      var est = el('a', 'pcw-est', 'Get a free estimate');
      est.href = estHref;
      estWrap.appendChild(est);
      mount.appendChild(estWrap);
    }

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
      if (state.jobs.length === 0) return; // nothing to filter yet
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
      if (state.jobs.length === 0) {
        groupsWrap.appendChild(el('div', 'pcw-empty', 'No projects published yet — check back soon.'));
        return;
      }
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

        groups[key].forEach(function (job) {
          group.appendChild(buildJob(job, state));
        });
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

  // Renders one job fully inline. Everything here — heading, full description and
  // photos — is in the DOM as soon as the widget runs, with nothing behind a click,
  // so the host page carries the whole job as its own content.
  function buildJob(job, state) {
    var slug = hashSlug(job);
    var wrap = el('div', 'pcw-job');
    wrap.id = slug; // keeps shared #job links working, and matches the JSON-LD item url

    wrap.appendChild(el('h3', 'pcw-h3', job.jobType + (cityLabel(job) ? ' — ' + cityLabel(job) : '')));

    var meta = [cityLabel(job), longDate(job), job.jobType].filter(Boolean).join(' · ');
    if (meta) wrap.appendChild(el('div', 'pcw-meta', meta));

    var photos = jobPhotos(job).slice(0, 3);
    if (photos.length) {
      var row = el('div', 'pcw-photos');
      photos.forEach(function (src, i) {
        var img = el('img', 'pcw-photo');
        img.src = src;
        img.alt = job.jobType + (cityLabel(job) ? ' in ' + cityLabel(job) : '') +
          ' — ' + state.org.name + (i > 0 ? ' (photo ' + (i + 1) + ')' : '');
        img.loading = 'lazy';
        row.appendChild(img);
      });
      wrap.appendChild(row);
    }

    if (job.description) wrap.appendChild(el('div', 'pcw-desc', job.description));

    var links = el('div', 'pcw-jlinks');
    var share = el('a', 'pcw-share', 'Share this job →');
    share.href = window.location.pathname + '#' + slug;
    links.appendChild(share);

    var pckHref = safeHref(job.pckUrl);
    if (pckHref) {
      var pck = el('a', 'pcw-pck', 'Also on projectcheckin.com →');
      pck.href = pckHref;
      pck.target = '_blank';
      // Per-job links repeat across every customer site running this widget, which is
      // the pattern Google's link-spam policy names. The single footer attribution
      // link is deliberately followable; these are not.
      pck.rel = 'noopener nofollow';
      links.appendChild(pck);
    }
    wrap.appendChild(links);

    return wrap;
  }

  // A shared #job link lands on a job that is already in the page, so this only has
  // to scroll to it — the content is present either way.
  function scrollToHash(state) {
    var h = window.location.hash.replace(/^#/, '');
    if (!h) return;
    var target = document.getElementById(h);
    if (target && target.scrollIntoView) {
      try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { target.scrollIntoView(); }
    }
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
