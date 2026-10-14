/* ProjectCheckin review loader v1. Fills the "Customer Review" box in a
   WordPress job post with the reviewer's name, comment and the business's
   reply, read from ProjectCheckin so no copy of the review text is stored on
   the website. Text is inserted with textContent only. */
(function () {
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/\/review\.v1\.js.*$/, '') : 'https://projectcheckin.com';
  function el(tag, text, style) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (style) e.setAttribute('style', style);
    return e;
  }
  function fill(box) {
    if (box.getAttribute('data-pck-loaded')) return;
    box.setAttribute('data-pck-loaded', '1');
    var id = box.getAttribute('data-pck-review');
    var body = box.querySelector('[data-pck-review-body]');
    if (!id || !body) return;
    fetch(base + '/api/embed/review/' + encodeURIComponent(id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        if (d.reviewerName) body.appendChild(el('p', d.reviewerName, 'margin:8px 0 0;font-weight:600'));
        if (d.comment) body.appendChild(el('p', d.comment, 'margin:8px 0 0;white-space:pre-line'));
        if (d.replyComment) {
          var reply = el('div', null, 'margin:12px 0 0;padding-left:12px;border-left:3px solid #e7e5e4');
          var who = box.getAttribute('data-pck-business');
          reply.appendChild(el('p', who ? 'Response from ' + who : 'Response from the business', 'margin:0;font-weight:600;font-size:0.9em'));
          reply.appendChild(el('p', d.replyComment, 'margin:4px 0 0;font-size:0.9em;white-space:pre-line'));
          body.appendChild(reply);
        }
      })
      .catch(function () {});
  }
  function run() {
    var boxes = document.querySelectorAll('[data-pck-review]');
    for (var i = 0; i < boxes.length; i++) fill(boxes[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
