// Leaves drawn from numbers, so every leaf comes in three drawing steps:
// (أ) outline + stem, (ب) midrib and main veins, (ج) small veins and shading lines.
// Leaf(kind) → { a: [paths], b: [paths], c: [paths], outline: path }   (box about 300 wide, base at 0,0, tip up)
(function () {
  function P(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'); }
  function Q(a, c, b) { return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  function lerp(a, b, x) { return a + (b - a) * x; }

  // a long leaf: half-width along its length, optional teeth or round lobes
  function long(L, W, teeth, lobes, bend) {
    var right = [], left = [], N = 140;
    function hw(s) {
      var base = W * Math.pow(Math.sin(Math.PI * Math.pow(s, .85)), .9);
      if (lobes) base *= .55 + .45 * Math.abs(Math.sin(lobes * Math.PI * s));
      if (teeth) base += teeth * Math.max(0, Math.sin(Math.PI * s)) * (Math.abs(((s * 26) % 1) - .5) * 2 - .5);
      return Math.max(0, base);
    }
    function mid(s) { return [bend * Math.sin(Math.PI * s) * L * .08, -s * L]; }
    for (var i = 0; i <= N; i++) { var s = i / N, m = mid(s), h = hw(s); right.push([m[0] + h, m[1]]); left.push([m[0] - h, m[1]]); }
    var outline = P(right.concat(left.reverse())) + ' Z';
    var midrib = [], b = [], c = [];
    for (i = 0; i <= 30; i++) midrib.push(mid(i / 30));
    b.push(P(midrib));
    var nv = lobes ? lobes * 2 - 1 : 7;
    for (i = 1; i <= nv; i++) {
      var s0 = lobes ? (i - .5) / (lobes * 2) * 1.0 : .1 + i * .11, s1 = Math.min(.98, s0 + .1), m0 = mid(s0);
      [1, -1].forEach(function (d) {
        var e = mid(s1), h1 = hw(s1) * .9;
        var end = [e[0] + d * h1, e[1]], ctrl = [m0[0] + d * h1 * .45, lerp(m0[1], end[1], .3)];
        b.push(Q(m0, ctrl, end));
        // small veins branching off each main vein
        for (var k = 1; k <= 3; k++) {
          var u = k / 4.2, px = lerp(lerp(m0[0], ctrl[0], u), lerp(ctrl[0], end[0], u), u), py = lerp(lerp(m0[1], ctrl[1], u), lerp(ctrl[1], end[1], u), u);
          c.push(P([[px, py], [px + d * 10, py - 16 - k * 2]]));
          c.push(P([[px, py], [px - d * 4, py + 14]]));
        }
      });
    }
    // shading strokes along one side
    for (i = 2; i < 14; i++) { var s = i / 15, m2 = mid(s), h2 = hw(s); c.push(P([[m2[0] - h2 * .85, m2[1] + 4], [m2[0] - h2 * .55, m2[1] - 6]])); }
    return { outline: outline, b: b, c: c };
  }

  // a hand-shaped leaf (like a maple or a grape leaf): pointed lobes spread around the stem point
  function palm(R, degs, sharp, teeth) {
    var cy = -R * .62, ang = degs.map(function (d) { return d * Math.PI / 180; });
    function r(th) {
      var v = .36;
      ang.forEach(function (a, k) {
        var d = Math.atan2(Math.sin(th - a), Math.cos(th - a)), size = k === 0 ? 1 : k < 3 ? .9 : .66;
        v = Math.max(v, size * Math.pow(Math.max(0, Math.cos(d * 1.5)), sharp));
      });
      return R * v * (1 + teeth * Math.max(0, Math.sin(th * 40)));
    }
    var pts = [];
    for (var i = 0; i <= 400; i++) { var th = Math.PI / 2 + (i / 400) * Math.PI * 2, rr = r(th); pts.push([Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
    var J = [0, cy + R * .3], b = [], c = [];
    ang.forEach(function (a) {
      var rt = r(a) * .95, tip = [Math.cos(a) * rt, cy + Math.sin(a) * rt];
      b.push(Q(J, [Math.cos(a) * rt * .35, cy + Math.sin(a) * rt * .35 + R * .08], tip));
      for (var j = 1; j <= 3; j++) {
        var u = .3 + j * .17, px = lerp(J[0], tip[0], u), py = lerp(J[1], tip[1], u), L2 = R * .2 * (1.1 - u);
        [1, -1].forEach(function (dd) { c.push(P([[px, py], [px + Math.cos(a + dd * .7) * L2, py + Math.sin(a + dd * .7) * L2]])); });
      }
    });
    return { outline: P(pts) + ' Z', b: b, c: c, base: J };
  }

  window.Leaf = function (kind) {
    var g;
    if (kind === 'maple') { g = palm(165, [-90, -38, -142, 12, 168], 2.2, .05); g.a = [g.outline, P([g.base, [6, 70]])]; }
    else if (kind === 'grape') { g = palm(150, [-90, -35, -145, 15, 165], 1.1, .025); g.a = [g.outline, P([g.base, [4, 64]])]; }
    else if (kind === 'oak') { g = long(300, 70, 0, 4.5, .4); g.a = [g.outline, P([[0, 0], [-4, 44]])]; }
    else if (kind === 'willow') { g = long(300, 34, 3, 0, -.5); g.a = [g.outline, P([[0, 0], [2, 30]])]; }
    else { g = long(280, 95, 7, 0, .3); g.a = [g.outline, P([[0, 0], [-6, 50]])]; }   // 'ovate' (toothed, like the book's first leaf)
    return g;
  };
  window.LEAF_KINDS = ['ovate', 'maple', 'oak', 'willow', 'grape'];
})();
