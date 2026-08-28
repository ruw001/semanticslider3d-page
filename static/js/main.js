/* SemanticSlider3D project page.
 *
 * Each panel shows one demo: 9 attribute steps (folders 0-8) x 18 viewpoints
 * (view_000.png .. view_340.png, every 20 degrees). A single rotation control
 * drives the viewpoint of every panel at once.
 *
 * The full set is 972 images / ~53 MB, so nothing is bulk-preloaded. Frames are
 * fetched on demand, the previous frame stays visible until the next one has
 * decoded (so dragging never flashes empty), and likely-next frames are warmed
 * in the background under a small concurrency cap.
 */
(function () {
  'use strict';

  var ROOT = 'static/images/sliders_demo';
  var ROT_STEPS = 18;          // 18 viewpoints...
  var ROT_DEG = 20;            // ...every 20 degrees
  var ATTR_STEPS = 9;          // folders 0-8

  /* ---------- per-variation orientation fix ----------
   * Some variations came out of generation with a different initial orientation
   * than the rest of their demo, so their view_XXX.png numbering is rotated
   * relative to the others. Adding a fixed angle (mod 360) to just those
   * variations realigns them, so "Rotate all" keeps every panel facing the
   * same way.
   *
   * Config is per attribute step, because a single offset per demo is not
   * always enough - in 28_b, steps 2-3 and step 6 need different angles.
   *
   *   demo -> { <attribute step>: <degrees to add> }
   *
   * Steps not listed get no offset. Only these two demos need it today.
   */
  function sameOffset(deg, steps) {
    var map = {};
    for (var i = 0; i < steps.length; i++) map[steps[i]] = deg;
    return map;
  }

  var ORIENTATION_FIX = {
    // every variation but the first is rendered back-to-front
    '21_b': sameOffset(180, [1, 2, 3, 4, 5, 6, 7, 8])
  };

  function orientationOffset(demo, attr) {
    var fix = ORIENTATION_FIX[demo];
    var deg = fix && fix[attr];
    return typeof deg === 'number' ? deg : 0;
  }

  // rotation index -> rendered angle, with the per-variation offset applied
  function viewDegrees(demo, attr, rot) {
    var idx = ((rot % ROT_STEPS) + ROT_STEPS) % ROT_STEPS;   // wrap 360 degrees
    var deg = (idx * ROT_DEG + orientationOffset(demo, attr)) % 360;
    // Snap to an angle that was actually rendered, so an offset that is not a
    // multiple of ROT_DEG can never request a file that does not exist.
    return (Math.round(deg / ROT_DEG) * ROT_DEG) % 360;
  }

  function frameURL(demo, attr, rot) {
    var deg = String(viewDegrees(demo, attr, rot));
    while (deg.length < 3) deg = '0' + deg;
    return ROOT + '/' + demo + '/' + attr + '/view_' + deg + '.png';
  }

  /* ---------- background warming, bounded concurrency ---------- */

  var known = Object.create(null);   // url -> true once decoded
  var queue = [];
  var active = 0;
  var MAX_ACTIVE = 4;

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var frugal = !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')));

  function pump() {
    while (active < MAX_ACTIVE && queue.length) {
      var url = queue.shift();
      if (known[url]) continue;
      active++;
      (function (u) {
        var img = new Image();
        img.onload = function () { active--; known[u] = true; pump(); };
        img.onerror = function () { active--; pump(); };
        img.src = u;
      })(url);
    }
  }

  function warm(urls, front) {
    if (frugal) return;
    for (var i = 0; i < urls.length; i++) {
      if (known[urls[i]] || queue.indexOf(urls[i]) !== -1) continue;
      if (front) queue.unshift(urls[i]); else queue.push(urls[i]);
    }
    pump();
  }

  /* ---------- panels ---------- */

  var panels = [];
  var rotation = 0;

  function show(panel) {
    var url = frameURL(panel.demo, panel.attr, rotation);
    panel.want = url;

    if (known[url]) { panel.img.src = url; return; }

    // Keep the current frame on screen while the next loads, then apply it only
    // if the user has not already moved on to a different frame.
    var pre = new Image();
    pre.onload = function () {
      known[url] = true;
      if (panel.want === url) panel.img.src = url;
    };
    pre.src = url;
  }

  // the frames the user is most likely to ask for next
  function warmAround(panel) {
    var urls = [], a, r;
    for (a = 0; a < ATTR_STEPS; a++) urls.push(frameURL(panel.demo, a, rotation));
    for (r = -2; r <= 2; r++) urls.push(frameURL(panel.demo, panel.attr, rotation + r));
    warm(urls);
  }

  document.querySelectorAll('.slider-demo').forEach(function (root) {
    var demo = root.dataset.demo;
    var img = root.querySelector('.slider-stage img');
    var range = root.querySelector('input[type="range"]');
    if (!demo || !img || !range) return;

    var panel = {
      demo: demo,
      attr: parseInt(range.value, 10) || 0,
      img: img,
      want: null
    };
    panels.push(panel);

    range.addEventListener('input', function () {
      panel.attr = parseInt(range.value, 10);
      show(panel);
      warmAround(panel);
    });

    show(panel);
  });

  /* ---------- one rotation control for every panel ---------- */

  var rot = document.getElementById('rot');
  var rotOut = document.getElementById('rot-out');

  if (rot) {
    rot.addEventListener('input', function () {
      rotation = parseInt(rot.value, 10);
      if (rotOut) rotOut.textContent = (rotation * ROT_DEG) + '°';
      panels.forEach(show);

      // warm the neighbouring angles so continued dragging stays smooth
      var urls = [];
      panels.forEach(function (p) {
        urls.push(frameURL(p.demo, p.attr, rotation + 1));
        urls.push(frameURL(p.demo, p.attr, rotation - 1));
      });
      warm(urls, true);
    });
  }

  // Once the visible frames are up, warm each panel's attribute sweep at the
  // starting angle - that is what a first-time visitor drags.
  if (panels.length) {
    var kick = function () { panels.forEach(warmAround); };
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 2500 });
    else setTimeout(kick, 1200);
  }

  /* ---------- copy BibTeX ---------- */

  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.dataset.target);
      if (!target) return;
      var text = target.innerText;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old; }, 1400);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } finally { ta.remove(); }
      }
    });
  });
})();
