// Stations 6–12: drawing steps, activities 1–4, light & shadow, team quiz, certificate.
(function () {
  // ================= 6. DRAWING STEPS أ ب ج =================
  var STEPS = [['ovate', 'المسنّنة'], ['maple', 'الكفّية'], ['oak', 'المتموّجة']];
  var CAP = { a: 'أ: نرسم <b>الشكل الخارجي</b> والساق', b: 'ب: نضيف <b>العِرق الأوسط</b> والعروق الكبيرة', c: 'ج: نكمل <b>العروق الصغيرة</b> وخطوط التظليل' };
  station({
    id: 'steps', num: '٦', title: 'خطوات رسم أوراق الشجر', peek: true,
    say: 'نرسم الورقة على <b>ثلاث خطوات</b>: أ ← ب ← ج. اضغطي «ارسمي معي» وارسمي في دفترك! ✏️',
    html: '<div id="stepsArea">' + STEPS.map(function (s, i) {
      var g = Leaf(s[0]), h = '';
      g.a.forEach(function (p) { h += '<path class="sa" pathLength="1" d="' + p + '"/>'; });
      g.b.forEach(function (p) { h += '<path class="sb" pathLength="1" d="' + p + '"/>'; });
      g.c.forEach(function (p) { h += '<path class="sc" pathLength="1" d="' + p + '"/>'; });
      var ghost = g.a.concat(g.b).map(function (p) { return '<path d="' + p + '"/>'; }).join('');
      return '<div class="scol" style="right:' + (40 + i * 430) + 'px"><svg viewBox="-190 -360 380 470"><g fill="none" stroke="#E3D7BC" stroke-width="3" stroke-dasharray="6 9" stroke-linecap="round">' + ghost + '</g><g fill="none" stroke="#2B2A33" stroke-linecap="round" stroke-linejoin="round">' + h + '</g></svg><div style="text-align:center;font:800 28px B;color:var(--ink2)">' + s[1] + '</div></div>';
    }).join('') + '</div>' +
      '<div style="position:absolute;top:110px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:16px">' +
      '<button class="stepb" data-s="a">أ</button><button class="stepb" data-s="b">ب</button><button class="stepb" data-s="c">ج</button>' +
      '<button class="btn" id="drawAll" style="margin-right:20px">✏️ ارسمي معي</button><button class="btn alt" id="drawFast">⚡ بسرعة</button></div>' +
      '<div id="stepCap" class="fact" style="left:50%;transform:translateX(-50%);bottom:40px;white-space:nowrap;display:none"></div>',
    init: function (el) {
      var timers = [];
      function setWidth() { $$('.sa', el).forEach(function (p) { p.style.strokeWidth = 4; }); $$('.sb', el).forEach(function (p) { p.style.strokeWidth = 3; }); $$('.sc', el).forEach(function (p) { p.style.strokeWidth = 1.6; }); }
      setWidth();
      function hide(cls) { $$(cls, el).forEach(function (p) { p.style.transition = 'none'; p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = 1; }); }
      function clear() { timers.forEach(clearTimeout); timers = []; loopStop(); hide('.sa'); hide('.sb'); hide('.sc'); $$('.stepb', el).forEach(function (b) { b.classList.remove('on'); }); $('#stepCap', el).style.display = 'none'; }
      this.clear = clear;
      function show(s, dur) {
        var ps = $$('.s' + s, el); $('.stepb[data-s="' + s + '"]', el).classList.add('on');
        $('#stepCap', el).style.display = ''; $('#stepCap', el).innerHTML = CAP[s]; loopStart('pencil', .45);
        ps.forEach(function (p, i) {
          var d = dur / Math.max(1, ps.length / 3);
          timers.push(setTimeout(function () { p.style.transition = 'stroke-dashoffset ' + d + 's ease-in-out'; p.style.strokeDashoffset = 0; }, (i % Math.ceil(ps.length / 3)) * d * 1000 / 1.6));
        });
        timers.push(setTimeout(loopStop, dur * 1000 * 1.2 + 400));
      }
      function run(fast) {
        clear(); sfx('pop'); var D = fast ? [1, 1, 1.2] : [3.2, 3.4, 4];
        show('a', D[0]);
        timers.push(setTimeout(function () { show('b', D[1]); }, (D[0] * 1.3 + .8) * 1000));
        timers.push(setTimeout(function () { show('c', D[2]); }, (D[0] * 1.3 + D[1] * 1.3 + 1.6) * 1000));
        timers.push(setTimeout(function () { sfx('correct'); say('تمّت! 🎉 لاحظي كيف <b>الخطوط</b> وحدها صنعت الورقة!'); markDone('steps'); }, (D[0] * 1.3 + D[1] * 1.3 + D[2] * 1.3 + 2.6) * 1000));
      }
      $('#drawAll', el).onclick = function () { run(false); };
      $('#drawFast', el).onclick = function () { run(true); };
      $$('.stepb', el).forEach(function (b) {
        b.onclick = function () {
          var s = b.dataset.s, order = 'abc'.indexOf(s); clear();
          'abc'.slice(0, order).split('').forEach(function (q) { $$('.s' + q, el).forEach(function (p) { p.style.strokeDashoffset = 0; }); $('.stepb[data-s="' + q + '"]', el).classList.add('on'); });
          show(s, 2.4); say(CAP[s]);
        };
      });
    },
    enter: function () { this.clear(); },
    leave: function () { this.clear(); }
  });

  // ================= 7. ACTIVITY 1: COLOURING =================
  var COLS = ['#7BBF5E', '#3E8E41', '#A6C34B', '#F2D33A', '#F2B233', '#E26D2E', '#C0392B', '#8B5A2B', '#5DADE2', '#7A4FC2', '#C2457A', '#FFFFFF'];
  station({
    id: 'color', num: '٧', title: 'نشاط ١: مرسم التلوين', peek: true,
    say: 'لوّني الورقة بألوانك المفضّلة… والخطوط تبقى ظاهرة! جرّبي <b>لونين</b> فوق بعض مثل الكتاب 🎨',
    html: '<div id="colorBox"><canvas width="900" height="640" style="position:absolute;inset:0;border-radius:26px"></canvas><svg viewBox="0 0 900 640" style="position:absolute;inset:0;pointer-events:none"></svg></div>' +
      '<div id="palette">' + COLS.map(function (c, i) { return '<button class="sw' + (i ? '' : ' on') + '" style="background:' + c + (c === '#FFFFFF' ? ';border:2px solid #ddd' : '') + '" data-c="' + c + '"></button>'; }).join('') + '</div>' +
      '<div style="position:absolute;right:120px;top:450px;width:330px;display:flex;flex-direction:column;gap:14px"><button class="btn org" id="nextLeaf">🍁 ورقة أخرى</button><button class="btn alt" id="eraseLeaf">🧽 امسحي</button></div>',
    init: function (el) {
      var cv = $('canvas', $('#colorBox', el)), x = cv.getContext('2d'), svg = $('svg', $('#colorBox', el)), color = COLS[0], kinds = ['grape', 'maple', 'ovate', 'oak'], k = 0, clip, R = rnd(9), last = null;
      function setup() {
        var kind = kinds[k % kinds.length], g = Leaf(kind), sc = kind === 'ovate' || kind === 'oak' ? 1.75 : 2.05, tx = 450, ty = kind === 'ovate' || kind === 'oak' ? 590 : 560;
        var M = 'translate(' + tx + ',' + ty + ') scale(' + sc + ')';
        svg.innerHTML = '<g transform="' + M + '" fill="none" stroke="#2B2A33" stroke-linecap="round" stroke-linejoin="round">' + leafSVG(kind, { w: 2.2 }) + '</g>';
        clip = new Path2D(); var p = new Path2D(g.outline), m = new DOMMatrix().translate(tx, ty).scale(sc); clip.addPath(p, m);
        x.clearRect(0, 0, 900, 640); x.fillStyle = '#FFFDF6'; x.fill(clip);
      }
      setup();
      function paint(a, b) {
        x.save(); x.clip(clip);
        var d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, d / 2);
        for (var i = 0; i < n; i++) {
          var px = a[0] + (b[0] - a[0]) * i / n, py = a[1] + (b[1] - a[1]) * i / n;
          for (var j = 0; j < 9; j++) if (R() > .2) { x.globalAlpha = .25 + R() * .45; x.fillStyle = color; x.fillRect(px + (R() - .5) * 34, py + (R() - .5) * 34, 3 + R() * 4, 2 + R() * 3); }
        }
        x.restore(); x.globalAlpha = 1;
      }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); last = local(e, cv); paint(last, last); loopStart('crayon', .5); });
      cv.addEventListener('pointermove', function (e) { if (!last) return; var p = local(e, cv); paint(last, p); last = p; });
      cv.addEventListener('pointerup', function () { last = null; loopStop(); markDone('color'); });
      $$('#palette .sw', el).forEach(function (s) { s.onclick = function () { color = s.dataset.c; sfx('pop'); $$('#palette .sw', el).forEach(function (o) { o.classList.toggle('on', o === s); }); }; });
      $('#nextLeaf', el).onclick = function () { k++; sfx('flip'); setup(); };
      $('#eraseLeaf', el).onclick = function () { sfx('flip'); setup(); };
    }
  });

  // ================= 8. ACTIVITY 2: LINE DETECTIVE =================
  var ROUNDS = [
    ['thin', 'خطًا رفيعًا', 'مثل التي نراها على ظهر ورقة الشجر', '<svg width="260" height="40"><path d="M10 20 C80 5 160 35 250 18" stroke="#2E5E2A" stroke-width="3" fill="none"/></svg>'],
    ['wide', 'خطًا عريضًا', 'على هيئة أوراق شجر', '<svg width="260" height="60"><path d="M10 40 C80 -5 190 0 250 30 C190 55 80 60 10 40Z" fill="#7BBF5E" stroke="#2E5E2A" stroke-width="3"/></svg>'],
    ['thick', 'خطًا سميكًا', 'على هيئة سيقان النباتات', '<svg width="260" height="50"><path d="M10 30 C90 20 170 36 250 24" stroke="#6B8E23" stroke-width="18" stroke-linecap="round" fill="none"/></svg>']
  ];
  function lance(L, W) { var r = [], l = []; for (var i = 0; i <= 40; i++) { var s = i / 40, h = W * Math.pow(Math.sin(Math.PI * Math.pow(s, .8)), .9); r.push([h, -s * L]); l.push([-h, -s * L]); } return 'M' + r.concat(l.reverse()).map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + 'Z'; }
  station({
    id: 'detective', num: '٨', title: 'نشاط ٢: محققة الخطوط', peek: true,
    say: 'أنتِ <b>محققة الخطوط</b> 🕵️ في حديقة متشابكة… ابحثي عن الخطوط المطلوبة واضغطي عليها!',
    html: '<div id="garden"><svg viewBox="0 0 920 650" style="width:100%;height:100%"></svg></div>' +
      '<div class="card" id="mission"><img src="assets/img/garden.jpg" style="width:120px;height:150px;object-fit:cover;border-radius:12px;float:left;margin:0 0 6px 10px"><div style="font:600 19px/1.5 R;color:var(--ink2);text-align:right">مثل لوحة «حديقة متشابكة» للفنان سيمون لاكوديش</div><div style="clear:both"></div>' +
      '<div style="font:600 24px R;margin-top:8px">ابحثي عن…</div><div class="big" id="mWhat"></div><div id="mHint" style="font:400 21px R;color:var(--ink2)"></div><div class="lineSample" id="mSample"></div><div id="score3"><i></i><i></i><i></i></div>' +
      '<button class="btn" id="mAgain" style="display:none;margin-top:16px">🔁 العبي مرة ثانية</button></div>',
    init: function (el) {
      var svg = $('#garden svg', el), R = rnd(21), round = 0, found = 0, h = '';
      // thick stems, wide leaves, thin veins on top
      var stems = [], leaves = [];
      for (var i = 0; i < 7; i++) {
        var x0 = 70 + i * 128 + R() * 30, top = 140 + R() * 200, bend = (R() - .5) * 140;
        var d = 'M' + x0 + ' 670 C' + (x0 + bend * .2) + ' 500 ' + (x0 + bend) + ' 380 ' + (x0 + bend * .8) + ' ' + top;
        stems.push(d);
        for (var j = 0; j < 3; j++) { var t = .3 + j * .25, ly = 670 - (670 - top) * t, lx = x0 + bend * t * .9; leaves.push([lx, ly, (j % 2 ? 1 : -1) * (35 + R() * 45) + (R() - .5) * 20, 150 + R() * 90, 34 + R() * 16]); }
      }
      stems.forEach(function (d) { h += '<path class="hit" data-k="thick" d="' + d + '" stroke="#6B8E23" stroke-width="20" stroke-linecap="round" fill="none"/>'; });
      leaves.forEach(function (L, n) {
        var c = ['#7BBF5E', '#9CCB6B', '#5FA84A', '#B6D77A'][n % 4];
        h += '<g transform="translate(' + L[0] + ',' + L[1] + ') rotate(' + L[2] + ')"><path class="hit" data-k="wide" d="' + lance(L[3], L[4]) + '" fill="' + c + '" stroke="#2E5E2A" stroke-width="3"/>';
        h += '<path class="hit" data-k="thin" d="M0 0 L0 ' + (-L[3] * .95) + '" stroke="#2E5E2A" stroke-width="3" fill="none"/>';
        for (var v = 1; v < 5; v++) { var y = -L[3] * v / 5.5; h += '<path class="hit" data-k="thin" d="M0 ' + y + ' L' + (L[4] * .7) + ' ' + (y - 22) + ' M0 ' + y + ' L' + (-L[4] * .7) + ' ' + (y - 22) + '" stroke="#2E5E2A" stroke-width="2" fill="none"/>'; }
        h += '</g>';
      });
      svg.innerHTML = '<g id="plants">' + h + '</g><g id="marks"></g>';
      // generous hit areas for the thin lines
      $$('.hit[data-k="thin"]', svg).forEach(function (p) { var c = p.cloneNode(); c.setAttribute('stroke', 'transparent'); c.setAttribute('stroke-width', 18); c.classList.add('hit'); p.parentNode.appendChild(c); });
      $$('.hit[data-k="thick"]', svg).forEach(function (p) { p.style.pointerEvents = 'stroke'; });
      $$('.hit[data-k="thin"]', svg).forEach(function (p) { p.style.pointerEvents = 'stroke'; });
      function setRound() {
        var r = ROUNDS[round]; found = 0; $('#mWhat', el).textContent = r[1]; $('#mHint', el).textContent = r[2]; $('#mSample', el).innerHTML = r[3];
        $$('#score3 i', el).forEach(function (i) { i.className = ''; i.textContent = ''; }); $('#marks', svg).innerHTML = '';
      }
      this.reset = function () { round = 0; $('#mAgain', el).style.display = 'none'; setRound(); };
      svg.addEventListener('click', function (e) {
        var tgt = e.target.closest('.hit'); if (!tgt || round >= 3) return;
        var p = local(e, svg), sx = 920 / svg.clientWidth, pt = [p[0] * sx, p[1] * sx];
        var ok = tgt.dataset.k === ROUNDS[round][0], m = $('#marks', svg);
        m.insertAdjacentHTML('beforeend', '<g transform="translate(' + pt[0] + ',' + pt[1] + ')"><g class="svgpop"><circle r="24" fill="' + (ok ? '#3E8E41' : '#E85D5D') + '" stroke="#fff" stroke-width="4"/><text y="10" text-anchor="middle" font-size="28" fill="#fff" font-family="B">' + (ok ? '✓' : '✗') + '</text></g></g>');
        if (!ok) { sfx('wrong', .5); var w = { thin: 'رفيع', wide: 'عريض', thick: 'سميك' }[tgt.dataset.k]; say('هذا خط <b>' + w + '</b>… ابحثي عن ' + ROUNDS[round][1] + '!'); setTimeout(function () { var l = m.lastChild; if (l) l.remove(); }, 900); return; }
        sfx('correct', .6); var dots = $$('#score3 i', el); dots[found].className = 'ok'; dots[found].textContent = '✓'; found++;
        if (found === 3) {
          round++;
          if (round < 3) { setTimeout(function () { sfx('magic', .5); setRound(); say('أحسنتِ! 👏 الحين ابحثي عن <b>' + ROUNDS[round][1] + '</b>'); }, 900); }
          else { setTimeout(function () { sfx('fanfare'); confetti(40); markDone('detective'); say('أنتِ <b>محققة خطوط</b> محترفة! 🕵️‍♀️ رفيعة، عريضة، وسميكة!'); $('#mAgain', el).style.display = ''; }, 700); }
        }
      });
      $('#mAgain', el).onclick = this.reset;
    },
    enter: function () { this.reset(); }
  });

  // ================= 9. ACTIVITY 3: DESIGN STUDIO =================
  var OBJ = {
    pillow: ['🛏️ المخدة', '<path id="clipShape" d="M150 170 C130 120 200 100 470 108 C740 100 810 120 790 170 C820 300 820 400 790 520 C810 560 740 580 470 572 C200 580 130 560 150 520 C120 400 120 300 150 170Z" fill="#FFF6E6" stroke="#E2CFA8" stroke-width="6"/>', '<path d="M240 140 C300 160 380 150 470 150" stroke="#EADBBE" stroke-width="4" fill="none"/>'],
    shirt: ['👕 التيشيرت', '<path id="clipShape" d="M330 90 C370 120 570 120 610 90 L800 160 L740 300 L680 270 L680 590 L260 590 L260 270 L200 300 L140 160Z" fill="#FFFFFF" stroke="#D9D2C2" stroke-width="6" stroke-linejoin="round"/>', '<path d="M330 90 C380 160 560 160 610 90" stroke="#D9D2C2" stroke-width="6" fill="none"/>'],
    window: ['🪟 النافذة', '<rect x="150" y="70" width="640" height="520" rx="16" fill="#8B5A2B"/><path id="clipShape" d="M180 100 H760 V560 H180Z" fill="#CFE8F6"/>', '<path d="M470 100 V560 M180 330 H760" stroke="#8B5A2B" stroke-width="20"/><path d="M220 140 L300 140 L220 220Z" fill="#fff" opacity=".5"/>'],
    wall: ['🧱 الجدار', '<path id="clipShape" d="M60 40 H880 V620 H60Z" fill="#F3E3C7"/>', '<path d="M60 560 H880" stroke="#D8C29C" stroke-width="10"/><rect x="380" y="430" width="180" height="130" rx="10" fill="#C08552"/><rect x="395" y="445" width="150" height="40" rx="6" fill="#D9A06A"/>']
  };
  var STAMP_C = ['#3E8E41', '#E26D2E', '#C0392B', '#F2B233', '#8B5A2B', '#7A4FC2'];
  station({
    id: 'studio', num: '٩', title: 'نشاط ٣: استوديو التصميم', peek: true,
    say: 'نستفيد من أشكال الأوراق في <b>الطباعة على الملابس</b>، و<b>الفُرش</b>، و<b>النوافذ</b>، و<b>الجدران</b>! اختاري وأطبعي 👕',
    html: '<div id="objects"><svg viewBox="0 0 940 660"></svg></div>' +
      '<div id="stampBar"><div class="objTabs">' + Object.keys(OBJ).map(function (k, i) { return '<button data-o="' + k + '"' + (i ? '' : ' class="on"') + '>' + OBJ[k][0] + '</button>'; }).join('') + '</div>' +
      '<div style="font:800 24px B">الختم:</div><div class="stamps">' + ['ovate', 'maple', 'oak', 'willow'].map(function (k, i) { return '<button data-k="' + k + '"' + (i ? '' : ' class="on"') + '><svg viewBox="-170 -330 340 400" style="width:100%;height:100%">' + leafSVG(k, { fill: '#7BBF5E', ink: '#2E5E2A', w: 6, c: false }) + '</svg></button>'; }).join('') + '</div>' +
      '<div style="font:800 24px B">اللون:</div><div style="display:flex;gap:10px">' + STAMP_C.map(function (c, i) { return '<button class="sw' + (i ? '' : ' on') + '" style="width:48px;height:48px;background:' + c + '" data-c="' + c + '"></button>'; }).join('') + '</div>' +
      '<button class="btn alt" id="stampClear">🧽 امسحي</button></div>',
    init: function (el) {
      var svg = $('#objects svg', el), obj = 'pillow', kind = 'ovate', col = STAMP_C[0], R = rnd(4);
      function draw() {
        var o = OBJ[obj];
        svg.innerHTML = '<defs><clipPath id="stClip">' + o[1].match(/<path id="clipShape"[^>]*>/)[0].replace('id="clipShape"', '') + '</clipPath></defs>' + o[1].replace('id="clipShape"', 'id="objBase"') + '<g id="stampsG" clip-path="url(#stClip)"></g>' + o[2];
      }
      draw();
      svg.addEventListener('pointerdown', function (e) {
        var p = local(e, svg), k = 940 / svg.clientWidth, x = p[0] * k, y = p[1] * k;
        var base = $('#objBase', svg); if (!base) return;
        var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; if (!base.isPointInFill(pt)) return;
        var s = .22 + R() * .14, r = R() * 360;
        $('#stampsG', svg).insertAdjacentHTML('beforeend', '<g transform="translate(' + x + ',' + (y + 40 * s) + ') rotate(' + r + ') scale(' + s + ')" opacity=".9"><g class="svgpop">' + leafSVG(kind, { fill: col, ink: 'rgba(0,0,0,.35)', w: 5, c: false }) + '</g></g>');
        sfx('stamp', .6); markDone('studio');
      });
      $$('.objTabs button', el).forEach(function (b) { b.onclick = function () { obj = b.dataset.o; sfx('pop'); $$('.objTabs button', el).forEach(function (o) { o.classList.toggle('on', o === b); }); draw(); }; });
      $$('.stamps button', el).forEach(function (b) { b.onclick = function () { kind = b.dataset.k; sfx('pop'); $$('.stamps button', el).forEach(function (o) { o.classList.toggle('on', o === b); }); }; });
      $$('#stampBar .sw', el).forEach(function (b) { b.onclick = function () { col = b.dataset.c; sfx('pop'); $$('#stampBar .sw', el).forEach(function (o) { o.classList.toggle('on', o === b); }); }; });
      $('#stampClear', el).onclick = function () { sfx('flip'); $('#stampsG', svg).innerHTML = ''; };
    }
  });

  // ================= 10. ACTIVITY 4: LEAVES ON WATER =================
  var PADS = [[393, 524, 223, 88], [207, 422, 167, 51], [513, 418, 135, 42], [680, 360, 153, 35], [202, 336, 135, 32], [457, 318, 130, 30], [448, 274, 97, 20], [258, 276, 84, 20], [782, 566, 130, 65]];
  var OBS = [
    ['١. المساحات نحو العمق', 'تنوّع أشكال الأوراق السطحية المتجهة إلى العمق أضاف لمسة جمالية وإبداعًا: الكبيرة قريبة، والصغيرة بعيدة.'],
    ['٢. الضوء والظل', 'تنوّع الإضاءة من الفاتح إلى الغامق، ومن الوضوح إلى الظل، أعطى إحساسًا بالواقعية.'],
    ['٣. الخطوط', 'التقسيم الداخلي للأوراق صنع خطوطًا وتخطيطات غيّرت شكلها وأعطتها جمالًا رائعًا.']
  ];
  station({
    id: 'water', num: '١٠', title: 'نشاط ٤: أوراق على الماء', peek: true,
    say: 'شوفي جمال الأوراق اللي <b>تنمو على سطح النهر</b> 💧 اضغطي على كل ملاحظة لتظهر في الصورة!',
    html: '<div id="lilyWrap"><img src="assets/img/lily.jpg"><svg viewBox="0 0 900 640"><defs><radialGradient id="glow" cx="15%" cy="0%" r="80%"><stop offset="0" stop-color="#FFF6C8" stop-opacity=".85"/><stop offset=".5" stop-color="#FFF6C8" stop-opacity=".15"/><stop offset="1" stop-color="#1A2A10" stop-opacity=".45"/></radialGradient>' +
      '<marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#fff"/></marker></defs><g id="ovl"></g></svg></div>' +
      OBS.map(function (o, i) { return '<div class="obs" data-i="' + i + '" style="top:' + (140 + i * 150) + 'px">' + o[0] + '<small>' + o[1] + '</small></div>'; }).join(''),
    init: function (el) {
      var ovl = $('#ovl', el), img = $('#lilyWrap img', el);
      function show(i) {
        sfx('drip'); $$('.obs', el).forEach(function (o) { o.classList.toggle('on', +o.dataset.i === i); }); img.style.transform = ''; img.style.filter = '';
        var h = '';
        if (i === 0) {
          PADS.slice().sort(function (a, b) { return b[2] - a[2]; }).forEach(function (p, n) { h += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="none" stroke="#FFE066" stroke-width="5" stroke-dasharray="14 10" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="' + (n * .25) + 's" dur=".4s" fill="freeze"/></ellipse>'; });
          h += '<path d="M450 630 L450 250" stroke="#fff" stroke-width="8" marker-end="url(#arr)" stroke-dasharray="20 12"/><text x="470" y="250" fill="#fff" font-family="B" font-size="34" stroke="#1A2A10" stroke-width="6" paint-order="stroke">نحو العمق</text>';
          img.style.transform = 'scale(1.08)';
        } else if (i === 1) {
          h += '<rect width="900" height="640" fill="url(#glow)"/><text x="40" y="70" fill="#FFF6C8" font-size="64">☀️</text><text x="120" y="70" fill="#fff" font-family="B" font-size="32" stroke="#4A3A10" stroke-width="6" paint-order="stroke">فاتح</text><text x="720" y="610" fill="#fff" font-family="B" font-size="32" stroke="#1A2A10" stroke-width="6" paint-order="stroke">غامق</text>';
        } else {
          img.style.filter = 'saturate(.6)';
          PADS.forEach(function (p, n) {
            h += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="none" stroke="#fff" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" begin="' + (n * .15) + 's" dur="1s" fill="freeze"/></ellipse>';
            for (var a = 0; a < 12; a++) { var th = a / 12 * Math.PI * 2; h += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + (p[0] + Math.cos(th) * p[2] * .92) + '" y2="' + (p[1] + Math.sin(th) * p[3] * .92) + '" stroke="#fff" stroke-width="1.6" opacity="0"><animate attributeName="opacity" from="0" to=".8" begin="' + (1 + n * .15) + 's" dur=".5s" fill="freeze"/></line>'; }
          });
        }
        ovl.innerHTML = h; say(OBS[i][1]); markDone('water');
      }
      $$('.obs', el).forEach(function (o) { o.onclick = function () { show(+o.dataset.i); }; });
      this.reset = function () { ovl.innerHTML = ''; img.style.transform = ''; img.style.filter = ''; $$('.obs', el).forEach(function (o) { o.classList.remove('on'); }); };
    },
    enter: function () { this.reset(); }
  });

  // ================= 11. LIGHT & SHADOW LAB =================
  station({
    id: 'light', num: '١١', title: 'مختبر الضوء والظل', peek: true,
    say: 'عندما يقع الضوء على جسم غير شفاف تنشأ <b>ثلاث مناطق</b>… <b>اسحبي الشمس</b> ☀️ وشوفي كيف تتغير!',
    html: '<div id="lightLab"><svg viewBox="0 0 900 640"><defs><radialGradient id="ballG" cx=".35" cy=".35" r=".75" fx=".3" fy=".3"><stop offset="0" stop-color="#FFF2D6"/><stop offset=".25" stop-color="#F4A64B"/><stop offset=".7" stop-color="#B85C1E"/><stop offset="1" stop-color="#4A2008"/></radialGradient>' +
      '<filter id="blur"><feGaussianBlur stdDeviation="10"/></filter></defs>' +
      '<path d="M120 640 C300 600 600 600 780 640" fill="#B9D59A"/>' +
      '<ellipse id="cast" cx="450" cy="470" rx="160" ry="34" fill="#1E2A12" opacity=".45" filter="url(#blur)"/>' +
      '<circle id="ball" cx="450" cy="345" r="125" fill="url(#ballG)"/>' +
      '<g id="labels" font-family="B" font-size="26"></g>' +
      '<g id="sun"><circle r="60" fill="#FFE066" opacity=".35"/><circle r="42" fill="#FFD23F" stroke="#F2A33A" stroke-width="5"/><text y="12" text-anchor="middle" font-size="34">☀️</text></g></svg></div>' +
      '<div class="zone" data-z="lit" style="top:150px;background:#F2A33A">☀️ المنطقة المضاءة<small>وهي التي تقابل الضوء مباشرة</small></div>' +
      '<div class="zone" data-z="core" style="top:320px;background:#8B4A1E">🌗 منطقة الظل الحقيقي<small>على الجسم نفسه، في الجهة البعيدة عن الضوء</small></div>' +
      '<div class="zone" data-z="cast" style="top:490px;background:#2B3A20">🌑 منطقة خيال الظل الساقط<small>ظل الجسم على الأرض، عكس جهة الضوء</small></div>',
    init: function (el) {
      var svg = $('#lightLab svg', el), sun = $('#sun', svg), ball = $('#ball', svg), cast = $('#cast', svg), grad = $('#ballG', svg), lab = $('#labels', svg), ang = -2.3, drag = false;
      function upd() {
        var sx = 450 + Math.cos(ang) * 360, sy = 345 + Math.sin(ang) * 290; sun.setAttribute('transform', 'translate(' + sx + ',' + sy + ')');
        var dx = Math.cos(ang), dy = Math.sin(ang);
        grad.setAttribute('fx', (.5 + dx * .28).toFixed(3)); grad.setAttribute('fy', (.5 + dy * .28).toFixed(3)); grad.setAttribute('cx', (.5 + dx * .18).toFixed(3)); grad.setAttribute('cy', (.5 + dy * .18).toFixed(3));
        var elev = Math.max(.15, -dy), len = 120 + (1 - elev) * 220;
        cast.setAttribute('cx', 450 - dx * len * .8); cast.setAttribute('rx', 110 + len * .45); cast.setAttribute('ry', 30);
        var lit = [450 + dx * 80, 345 + dy * 80], core = [450 - dx * 85, 345 - dy * 85], cs = [450 - dx * len * .8 - (dx > 0 ? 60 : -60), 470];
        var sg = dx >= 0 ? 1 : -1;
        var L3 = [[lit, 'المضاءة', '#F2A33A', [450 + dx * 250, Math.max(70, 345 + dy * 230)]], [core, 'الظل الحقيقي', '#8B4A1E', [450 - sg * 260, 330]], [cs, 'الظل الساقط', '#2B3A20', [Math.max(130, Math.min(770, cs[0])), 600]]];
        lab.innerHTML = L3.map(function (q) {
          var p = q[0], t = q[3];
          return '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + t[0] + '" y2="' + (t[1] - 10) + '" stroke="' + q[2] + '" stroke-width="3"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#fff" stroke="' + q[2] + '" stroke-width="4"/><text x="' + t[0] + '" y="' + t[1] + '" text-anchor="middle" fill="#fff" stroke="' + q[2] + '" stroke-width="10" stroke-linejoin="round" paint-order="stroke">' + q[1] + '</text>';
        }).join('');
      }
      upd();
      function mv(e) {
        if (!drag) return; var p = local(e, svg), k = 900 / svg.clientWidth, x = p[0] * k - 450, y = p[1] * k - 345;
        ang = Math.atan2(y, x); if (ang > -.25 && ang < 1.6) ang = -.25; if (ang >= 1.6 || ang < -2.9) ang = ang > 0 ? -2.9 : Math.max(ang, -2.9); upd();
      }
      sun.addEventListener('pointerdown', function (e) { drag = true; svg.setPointerCapture(e.pointerId); sfx('pop'); });
      svg.addEventListener('pointermove', mv);
      svg.addEventListener('pointerup', function () { if (drag) { drag = false; markDone('light'); } });
      $$('.zone', el).forEach(function (z) { z.onclick = function () { sfx('pop'); $$('.zone', el).forEach(function (o) { o.classList.toggle('hl', o === z); }); say({ lit: 'المنطقة <b>المضاءة</b>: تقابل الضوء ☀️', core: '<b>الظل الحقيقي</b>: على الكرة نفسها، بعيد عن الضوء 🌗', cast: '<b>الظل الساقط</b>: خيال الكرة على الأرض 🌑 — وتوزيع الظل والنور يعطينا <b>إحساسًا بالتجسيم</b>!' }[z.dataset.z]); }; });
      // a little demo sweep when the station opens
      this.demo = function () { var t0 = performance.now(); (function a(now) { var p = (now - t0) / 2600; if (p > 1 || drag) return; ang = -2.6 + Math.sin(p * Math.PI) * 1.9 * p; upd(); requestAnimationFrame(a); })(t0); };
    },
    enter: function () { this.demo(); }
  });

  // ================= 12. TEAM QUIZ =================
  var Q = [
    ['tf', 'الخطوط هي أقدم الوسائل التي استُخدمت في التعبير الفني.', 1, 'صح! الخط أقدم وسيلة للتعبير الفني ✏️'],
    ['mc', 'أيّ هذه من <b>عناصر التعبير الفني</b>؟', ['الخط', 'الممحاة', 'المسطرة'], 'الخط من عناصر التعبير الفني مع النقطة والمساحة واللون والتكوين'],
    ['tf', 'كان الإنسان الحجري يعبّر عن الأشكال التي يراها بالرسم عن طريق الخطوط.', 1, 'صح! خطّ بأصابعه وبالخشب المحروق 🔥'],
    ['mc', 'الرسوم الصخرية في منطقة <b>حِمى</b> سُجّلت في قائمة…', ['التراث العالمي (اليونسكو)', 'أطول الأنهار', 'أسرع الحيوانات'], 'سادس موقع سعودي في قائمة اليونسكو 🇸🇦'],
    ['tf', 'القلم الرصاص <b>الصلب</b> يرسم خطوطًا غامقة وعريضة.', 0, 'خطأ! الصلب يرسم خطوطًا فاتحة رفيعة، واللين غامقة'],
    ['mc', 'اللوحة التخطيطية لليدين في المتحف للفنان…', ['ليوناردو دافنشي', 'تيتان', 'سيمون لاكوديش'], 'ليوناردو دافنشي ✋ وتيتان رسم الأشجار 🌳'],
    ['tf', 'التكوين هو ترتيب مكوّنات الصورة بحيث تنتقل العين من جزء إلى آخر دون ملل.', 1, 'صح! هذا هو التكوين 🖼️'],
    ['mc', 'أول خطوة في رسم ورقة الشجر هي…', ['الشكل الخارجي', 'التظليل', 'العروق الصغيرة'], 'أ: الشكل الخارجي، ب: العروق الكبيرة، ج: التفاصيل'],
    ['mc', 'في الحديقة المتشابكة، <b>سيقان النباتات</b> تمثّل خطوطًا…', ['سميكة', 'رفيعة', 'منقّطة'], 'السيقان خطوط سميكة، وظهر الورقة خطوط رفيعة'],
    ['tf', 'توزيع الظل والنور على شكل كروي يعطينا إحساسًا بالتجسيم.', 1, 'صح! مثل الكرة في مختبر الضوء ☀️'],
    ['mc', 'المنطقة التي <b>تقابل الضوء</b> مباشرة هي…', ['المنطقة المضاءة', 'الظل الحقيقي', 'الظل الساقط'], 'المضاءة تقابل الضوء ☀️'],
    ['tf', 'الفحم يعطي خطوطًا فاتحة جدًا ولا يُطمس أبدًا.', 0, 'خطأ! الفحم أسود قوي ويُطمس بسهولة 🖤'],
    ['mc', 'يمكن الاستفادة من أشكال ورق الشجر في…', ['الطباعة على الملابس', 'صناعة الأقلام', 'قياس الوقت'], 'وأيضًا رسمها على النوافذ وفراش السرير والجدران 👕'],
    ['tf', 'يعتمد التخطيط بشكل رئيس على الرسم بالقلم الرصاص والفحم والريشة.', 1, 'صح! ✏️ ⚫ 🪶']
  ];
  station({
    id: 'quiz', num: '١٢', title: 'تحدّي الفريقين', peek: true,
    say: 'وقت <b>التحدّي</b>! 🏆 فريق الأوراق ضد فريق الأقلام… كل فريق يجاوب على دوره!',
    html: '<div id="teams"><div class="team" id="t0">🍃 فريق الأوراق<span class="pts">٠</span></div><div class="team" id="t1">✏️ فريق الأقلام<span class="pts">٠</span></div></div>' +
      '<div id="timer">٢٠</div>' +
      '<div class="card" id="qBox"><div id="qKind"></div><div id="qText"></div><div id="qOpts"></div></div>' +
      '<div style="position:absolute;right:230px;top:700px"><button class="btn org" id="qNext" style="display:none">السؤال التالي ←</button><button class="btn" id="qStart">ابدأن التحدّي 🚀</button></div>' +
      '<div id="qProg">' + Q.map(function () { return '<i></i>'; }).join('') + '</div>',
    init: function (el) {
      var qi = 0, sc = [0, 0], turn = 0, tm = 0, left = 20, busy = false;
      function prog() { $$('#qProg i', el).forEach(function (d, i) { d.className = i < qi ? 'done' : i === qi ? 'cur' : ''; }); }
      function teams() { $$('.team', el).forEach(function (t, i) { t.classList.toggle('turn', i === turn); $('.pts', t).textContent = AR(sc[i]); }); }
      function ask() {
        var q = Q[qi]; busy = false; turn = qi % 2; teams(); prog();
        $('#qKind', el).textContent = (turn ? '✏️ دور فريق الأقلام' : '🍃 دور فريق الأوراق') + ' · السؤال ' + AR(qi + 1) + ' من ' + AR(Q.length) + (q[0] === 'tf' ? ' · صح أم خطأ؟' : '');
        $('#qText', el).innerHTML = q[1];
        var opts = q[0] === 'tf' ? [['✔️ صح', 1], ['✖️ خطأ', 0]] : q[2].map(function (o, i) { return [o, i === 0 ? 1 : 0]; });
        if (q[0] === 'mc') { var r = rnd(qi + 3); opts.sort(function () { return r() - .5; }); }
        if (q[0] === 'tf') opts = opts.map(function (o) { return [o[0], o[1] === q[2] ? 1 : 0]; });
        $('#qOpts', el).innerHTML = opts.map(function (o) { return '<button data-ok="' + o[1] + '">' + o[0] + '</button>'; }).join('');
        $$('#qOpts button', el).forEach(function (b) { b.onclick = function () { answer(b); }; });
        $('#qBox', el).classList.remove('popin'); void $('#qBox', el).offsetWidth; $('#qBox', el).classList.add('popin');
        $('#qNext', el).style.display = 'none';
        left = 20; $('#timer', el).textContent = AR(left); $('#timer', el).classList.remove('low'); clearInterval(tm);
        tm = setInterval(function () { left--; $('#timer', el).textContent = AR(Math.max(0, left)); if (left <= 5 && left > 0) { sfx('tick', .5); $('#timer', el).classList.add('low'); } if (left <= 0) answer(null); }, 1000);
      }
      function answer(b) {
        if (busy) return; busy = true; clearInterval(tm); $('#timer', el).classList.remove('low');
        var ok = b && b.dataset.ok === '1';
        $$('#qOpts button', el).forEach(function (x) { if (x.dataset.ok === '1') x.classList.add('right'); });
        if (b && !ok) b.classList.add('bad');
        if (ok) { sc[turn]++; sfx('correct'); confetti(14); } else sfx('wrong', .5);
        teams(); say((ok ? '👏 ' : (b ? '😅 ' : '⏰ انتهى الوقت! ')) + Q[qi][3]);
        if (qi < Q.length - 1) $('#qNext', el).style.display = ''; else setTimeout(finish, 1800);
      }
      function finish() {
        var w = sc[0] === sc[1] ? 'تعادل الفريقان! كلّكن فنانات 🤝' : (sc[0] > sc[1] ? 'فاز فريق الأوراق 🍃' : 'فاز فريق الأقلام ✏️');
        window.QUIZ_WINNER = w; sfx('fanfare'); confetti(70); markDone('quiz');
        $('#qKind', el).textContent = 'النتيجة النهائية'; $('#qText', el).innerHTML = '🏆 ' + w + '<br><span style="font-size:34px;color:var(--ink2)">الأوراق ' + AR(sc[0]) + ' — الأقلام ' + AR(sc[1]) + '</span>';
        $('#qOpts', el).innerHTML = '<button style="background:var(--sun);color:#fff" id="toCert">استلمن الشهادة 🎖️</button>';
        $('#toCert', el).onclick = function () { goId('cert'); };
        say('مبروك! 🎉 ' + w);
      }
      $('#qStart', el).onclick = function () { this.style.display = 'none'; sfx('magic'); qi = 0; sc = [0, 0]; ask(); };
      $('#qNext', el).onclick = function () { qi++; sfx('pop'); ask(); };
      this.reset = function () {
        clearInterval(tm); qi = 0; sc = [0, 0]; turn = 0; teams(); prog(); $('#qStart', el).style.display = ''; $('#qNext', el).style.display = 'none';
        $('#qKind', el).textContent = '١٤ سؤالًا · ٢٠ ثانية لكل سؤال'; $('#qText', el).innerHTML = 'هل أنتنّ مستعدات؟ 🤩'; $('#qOpts', el).innerHTML = ''; $('#timer', el).textContent = AR(20);
      };
    },
    enter: function () { this.reset(); },
    leave: function () { this.reset(); }
  });

  // ================= 13. CERTIFICATE =================
  station({
    id: 'cert', title: 'شهادة فنانة الخطوط', guide: true,
    say: 'أحسنتنّ يا فنانات! 🎨 اكتبي اسمك على الشهادة… <b>وشكرًا لكم</b> 💚',
    html: '<div class="card" id="cert"><svg viewBox="0 0 1060 650" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><g transform="translate(70,600) rotate(-30) scale(.42)">' + leafSVG('maple', { fill: '#F2B233', ink: '#C9772F', w: 4 }) + '</g><g transform="translate(990,600) rotate(30) scale(.42)">' + leafSVG('ovate', { fill: '#7BBF5E', ink: '#3E8E41', w: 4 }) + '</g><g transform="translate(990,140) rotate(150) scale(.3)">' + leafSVG('oak', { fill: '#E26D2E', ink: '#A84A18', w: 4 }) + '</g><g transform="translate(70,140) rotate(-150) scale(.3)">' + leafSVG('willow', { fill: '#3E8E41', ink: '#2B6A2E', w: 4 }) + '</g></svg>' +
      '<div style="font-size:70px">🎖️</div><h1>شهادة فنانة الخطوط</h1><div style="font:600 30px R;margin-top:10px">تُمنح هذه الشهادة إلى</div>' +
      '<input id="certName" placeholder="اكتبي اسمك هنا ✏️">' +
      '<div style="font:600 28px/1.7 R">لأنها اكتشفت أسرار <b style="color:var(--leaf)">الخطوط</b> في رسم أوراق الشجر 🍃</div><div id="certWin" style="font:800 28px B;color:var(--autumn);margin-top:8px"></div>' +
      '<div style="position:absolute;bottom:30px;left:0;right:0;font:600 22px R;color:var(--ink2)">إعداد الطالبة: <b>نادين الشمراني</b> · الصف الرابع ٢ · التربية الفنية</div></div>' +
      '<div style="position:absolute;left:0;right:0;top:800px;text-align:center;display:flex;gap:16px;justify-content:center"><button class="btn" id="certPrint">🖨️ اطبعي</button><button class="btn alt" id="certAgain">🔁 من البداية</button></div>',
    init: function (el) {
      $('#certPrint', el).onclick = function () { print(); };
      $('#certAgain', el).onclick = function () { go(0, true); };
    },
    enter: function (el) { $('#certWin', el).textContent = window.QUIZ_WINNER ? '🏆 ' + window.QUIZ_WINNER : ''; sfx('fanfare', .6); confetti(60); setTimeout(wave, 300); }
  });

  startShow();
})();
