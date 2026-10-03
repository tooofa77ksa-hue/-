// Stations 0–6: cover, map, time machine, museum, elements, tools, leaf variety.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  // one leaf as SVG: fill colour, line colour, which steps to show
  window.leafSVG = function (kind, o) {
    o = o || {}; var g = Leaf(kind), s = '';
    var fill = o.fill || 'none', ink = o.ink || '#2B2A33', w = o.w || 3;
    s += '<path class="la" d="' + g.a[0] + '" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + w + '" stroke-linejoin="round"/>';
    s += '<path class="la" d="' + g.a[1] + '" fill="none" stroke="' + ink + '" stroke-width="' + (w + 1) + '" stroke-linecap="round"/>';
    if (o.b !== false) g.b.forEach(function (p) { s += '<path class="lb" d="' + p + '" fill="none" stroke="' + (o.vein || ink) + '" stroke-width="' + (w * .8) + '" stroke-linecap="round"/>'; });
    if (o.c !== false) g.c.forEach(function (p) { s += '<path class="lc" d="' + p + '" fill="none" stroke="' + (o.vein || ink) + '" stroke-width="' + (w * .45) + '" stroke-linecap="round" opacity=".8"/>'; });
    return s;
  };
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  window.rnd = rnd;
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  window.AR = AR;

  // ================= COVER =================
  station({
    id: 'cover', guide: true,
    say: 'أهلًا! أنا <b>نادين</b> 👋 اليوم نكتشف سرّ رسم <b>أوراق الشجر</b>… لأن كل رسمة تبدأ <b>بخط</b>!', voice: '01',
    html: '<svg id="coverSvg" viewBox="0 0 1600 900"></svg>' +
      '<div id="coverTitle"><div class="sub">🍃 الموضوع الثالث: رسم أوراق الشجر</div><h1>مستكشفة الخطوط</h1></div>' +
      '<button class="btn org" id="coverGo">ابدئي الرحلة 🍃</button>' +
      '<div id="coverCred">إعداد الطالبة: <b style="color:var(--leaf)">نادين الشمراني</b> · الصف الرابع ٢ · التربية الفنية</div>',
    init: function (el) {
      var svg = $('#coverSvg', el), h = '';
      // two big leaves that draw themselves behind the title
      h += '<g id="cl1" transform="translate(240,760) rotate(-24) scale(1.55)" opacity=".9">' + leafSVG('maple', { fill: '#F6D9A8', ink: '#C9772F', vein: '#C9772F', w: 2.4 }) + '</g>';
      h += '<g id="cl2" transform="translate(1380,800) rotate(22) scale(1.45)" opacity=".9">' + leafSVG('ovate', { fill: '#D7ECC2', ink: '#3E8E41', vein: '#3E8E41', w: 2.4 }) + '</g>';
      var R = rnd(5);
      for (var i = 0; i < 14; i++) {
        var k = LEAF_KINDS[i % 5], c = ['#7BBF5E', '#E26D2E', '#F2B233', '#C2457A', '#3E8E41'][i % 5];
        h += '<g class="fall" data-x="' + (R() * 1600) + '" data-d="' + (7 + R() * 7) + '" data-o="' + (R() * 10) + '" data-s="' + (.16 + R() * .14) + '">' + leafSVG(k, { fill: c, ink: 'rgba(0,0,0,.25)', w: 3, c: false }) + '</g>';
      }
      svg.innerHTML = h;
      $$('path', svg).forEach(function (p) { if (p.closest('#cl1,#cl2')) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; } });
      $('#coverGo', el).onclick = function () { sfx('magic'); goId('map'); };
    },
    enter: function (el) {
      var paths = $$('#cl1 path,#cl2 path', el);
      paths.forEach(function (p, i) {
        var L = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDashoffset = L; p.style.fillOpacity = 0;
        setTimeout(function () { p.style.transition = 'stroke-dashoffset 1.6s ease, fill-opacity 1s ease 1.2s'; p.style.strokeDashoffset = 0; p.style.fillOpacity = 1; }, 300 + i * 70);
      });
      var t0 = performance.now(), leaves = $$('.fall', el);
      (function anim(now) {
        if (!el.classList.contains('on')) return;
        var t = (now - t0) / 1000;
        leaves.forEach(function (g) {
          var d = +g.dataset.d, p = ((t + +g.dataset.o) % d) / d, x = +g.dataset.x + Math.sin(p * 9 + +g.dataset.o) * 60, y = -80 + p * 1060;
          g.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + (Math.sin(p * 7 + +g.dataset.o) * 50) + ') scale(' + g.dataset.s + ')');
        });
        requestAnimationFrame(anim);
      })(t0);
      setTimeout(wave, 400);
    }
  });

  // ================= MAP =================
  var MAP = [
    ['time', 'آلة الزمن ⏳', 920, 520, '#9A6B4A'], ['museum', 'المتحف السري 🔍', 1010, 340, '#5B6CD9'], ['elements', 'عناصر التعبير الفني 🃏', 860, 160, '#C2457A'],
    ['tools', 'صندوق الأدوات ✏️', 640, 60, '#E26D2E'], ['variety', 'التنوع في الأوراق 🍂', 420, 160, '#3E8E41'], ['steps', 'خطوات الرسم أ ب ج', 260, 330, '#2E9C8F'],
    ['color', 'نشاط ١: مرسم التلوين 🎨', 330, 520, '#E2A72E'], ['detective', 'نشاط ٢: محققة الخطوط 🕵️', 1130, 150, '#7A4FC2'], ['studio', 'نشاط ٣: استوديو التصميم 👕', 120, 160, '#D9534F'],
    ['water', 'نشاط ٤: أوراق على الماء 💧', 1180, 470, '#3E8FD0'], ['light', 'مختبر الضوء والظل ☀️', 560, 330, '#F2A33A'], ['quiz', 'تحدّي الفريقين 🏆', 740, 600, '#2B2A33']
  ];
  station({
    id: 'map', title: 'شجرة المحطات', guide: true,
    say: 'هذه <b>شجرة رحلتنا</b> 🌳 كل ورقة محطة… اضغطي على أي ورقة، أو امشي بالأسهم!', voice: '02',
    html: '<div id="mapTree"><svg viewBox="0 0 1200 800" style="position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%"></svg></div>',
    init: function (el) {
      var box = $('#mapTree', el), svg = $('svg', box), h = '';
      // trunk and branches
      h += '<path d="M560 800 C560 700 570 640 590 560 C600 520 610 480 600 420" stroke="#8B5A2B" stroke-width="70" fill="none" stroke-linecap="round"/>';
      [['M600 470 C700 430 820 420 980 500'], ['M598 430 C720 360 860 300 1080 330'], ['M600 400 C680 300 760 230 920 200'], ['M600 420 C620 300 650 200 700 110'], ['M600 410 C540 300 500 230 470 200'],
        ['M596 450 C500 420 400 380 320 360'], ['M590 520 C500 540 440 560 390 560'], ['M600 420 C800 300 1000 220 1180 190'], ['M600 420 C420 300 300 220 170 200'], ['M596 540 C800 560 1000 540 1240 510'], ['M600 430 C600 400 610 380 620 370'], ['M570 650 C620 660 700 650 800 640']]
        .forEach(function (b) { h += '<path d="' + b[0] + '" stroke="#8B5A2B" stroke-width="16" fill="none" stroke-linecap="round"/>'; });
      svg.innerHTML = h;
      MAP.forEach(function (m, i) {
        var d = document.createElement('div'); d.className = 'mleaf'; d.dataset.id = m[0];
        d.style.left = (m[2] - 95) + 'px'; d.style.top = (m[3] - 60) + 'px';
        d.style.setProperty('--c', m[4]); d.style.transform = 'rotate(' + ((i % 3) - 1) * 4 + 'deg)';
        d.innerHTML = '<span>' + m[1] + '</span><i class="ok">✓</i>';
        d.onclick = function () { sfx('pop'); goId(m[0]); };
        box.appendChild(d);
      });
    },
    enter: function (el) {
      $$('.mleaf', el).forEach(function (d, i) { d.style.animation = 'none'; void d.offsetWidth; d.style.animation = 'pop .5s cubic-bezier(.3,1.5,.5,1) ' + (i * .06) + 's both'; });
    }
  });

  // ================= 1. TIME MACHINE =================
  var CAMEL = 'M160 330 L170 250 C175 215 200 200 230 205 C250 170 280 165 300 190 C320 170 350 175 360 205 C380 205 395 215 405 235 L420 200 C425 175 445 165 455 175 L470 180 L458 190 L450 215 L430 260 L420 280 L415 330 M190 270 L180 340 M260 260 L262 340 M360 255 L372 340';
  station({
    id: 'time', num: '١', title: 'آلة الزمن: بدايات الرسم',
    say: 'تعالي نرجع بالزمن آلاف السنين… <b>اضغطي على آلة الزمن!</b> ⏳', voice: '03',
    html: '<div id="tmA"><div id="tmDial"><div><div id="tmYear">٢٠٢٦</div><div id="tmLbl">نحن الآن</div><button class="btn org" id="tmGo" style="margin-top:22px">شغّلي آلة الزمن ⏳</button></div></div></div>' +
      '<div id="tmB" style="display:none">' +
      '<div class="card tape" style="right:120px;top:120px;width:360px;padding:26px 28px"><h2 style="font-size:44px">العصر الحجري 🔥</h2><p class="lead" style="font-size:24px">كان رجل الكهف <b>يخطّ بأصابعه</b> على الطين، ويرسم بـ<b>قطعة خشب محروقة</b> على الصخور ليعبّر عمّا يراه.</p><p class="lead" style="font-size:24px;color:var(--autumn)">جرّبي أنتِ: تتبّعي الجمل المنقّط! 🐪</p></div>' +
      '<canvas id="cave" width="960" height="640"></canvas>' +
      '<div class="ctools" style="left:140px;top:150px;flex-direction:column"><button data-t="finger" class="on" title="إصبع">☝️</button><button data-t="char" title="فحم">🪵</button><button data-t="clear" title="جدار جديد">🧽</button></div>' +
      '<div class="card" style="left:140px;top:440px;width:330px;padding:12px;transform:rotate(3deg)"><img src="assets/img/cave.jpg" style="width:100%;border-radius:14px;display:block"><div style="font:600 18px R;text-align:center;margin-top:6px">تخطيط بدائي – كهف الإخوة الثلاثة</div></div>' +
      '<button class="btn" id="toHima" style="position:absolute;left:1020px;top:770px">إلى حِمى الثقافية 🇸🇦 ←</button></div>' +
      '<div id="tmC" style="display:none">' +
      '<div class="card tape" style="right:120px;top:120px;width:330px;padding:24px 26px"><h2 style="font-size:42px">حِمى الثقافية 🇸🇦</h2><p class="lead" style="font-size:24px">رسوم صخرية قديمة جدًا في <b>المملكة العربية السعودية</b> تحكي حياة الإنسان القديم وبيئته.</p><p class="lead" style="font-size:24px;color:var(--autumn)">اكشطي الصخرة بإصبعك لتكتشفيها! 👆</p></div>' +
      '<div id="rock"><img src="assets/img/hima.jpg"><canvas width="560" height="620"></canvas></div>' +
      '<div class="card" id="unesco" style="top:480px;left:1170px"><div style="font-size:70px">🏛️</div><b style="font:800 30px B;color:var(--sky)">تراث عالمي!</b><p style="font:600 22px/1.6 R;margin:6px 0 0">سُجّلت حِمى الثقافية <b>سادس موقع سعودي</b> في قائمة <b>اليونسكو</b> للتراث العالمي</p></div></div>',
    init: function (el) {
      // cave wall texture
      var cv = $('#cave', el), cx = cv.getContext('2d'), tool = 'finger', R = rnd(11);
      function wall() {
        var g = cx.createRadialGradient(480, 300, 60, 480, 320, 640); g.addColorStop(0, '#B98A5E'); g.addColorStop(1, '#5E3F28');
        cx.fillStyle = g; cx.fillRect(0, 0, 960, 640);
        for (var i = 0; i < 9000; i++) { cx.fillStyle = 'rgba(' + (R() < .5 ? '40,25,15' : '230,200,160') + ',' + (R() * .12) + ')'; var s = R() * 5; cx.fillRect(R() * 960, R() * 640, s, s); }
        for (i = 0; i < 40; i++) { cx.strokeStyle = 'rgba(40,25,15,.18)'; cx.lineWidth = 1 + R() * 2; cx.beginPath(); var x = R() * 960, y = R() * 640; cx.moveTo(x, y); cx.quadraticCurveTo(x + R() * 80 - 40, y + R() * 80 - 40, x + R() * 160 - 80, y + R() * 160 - 80); cx.stroke(); }
        cx.save(); cx.translate(160, 90); cx.scale(1.25, 1.25); cx.setLineDash([2, 14]); cx.lineCap = 'round'; cx.strokeStyle = 'rgba(255,240,200,.75)'; cx.lineWidth = 5; cx.stroke(new Path2D(CAMEL)); cx.restore();
      }
      wall();
      var last = null;
      function draw(p) {
        if (!last) { last = p; return; }
        var dx = p[0] - last[0], dy = p[1] - last[1], n = Math.max(1, Math.hypot(dx, dy) / 2);
        for (var i = 0; i < n; i++) {
          var x = last[0] + dx * i / n, y = last[1] + dy * i / n;
          if (tool === 'finger') { cx.fillStyle = 'rgba(240,210,170,.16)'; cx.beginPath(); cx.arc(x, y, 9, 0, 7); cx.fill(); cx.fillStyle = 'rgba(60,35,20,.25)'; cx.beginPath(); cx.arc(x + 3, y + 3, 6, 0, 7); cx.fill(); }
          else for (var k = 0; k < 6; k++) { cx.fillStyle = 'rgba(15,10,8,' + (.2 + R() * .4) + ')'; cx.fillRect(x + (R() - .5) * 12, y + (R() - .5) * 12, 1 + R() * 3, 1 + R() * 3); }
        }
        last = p;
      }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); last = null; draw(local(e, cv)); loopStart(tool === 'finger' ? 'scrape' : 'charcoal', .5); });
      cv.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') { if (last !== undefined && last !== false) draw(local(e, cv)); } });
      cv.addEventListener('pointerup', function () { last = false; loopStop(); });
      $$('.ctools button', el).forEach(function (b) {
        b.onclick = function () { sfx('pop'); if (b.dataset.t === 'clear') { wall(); return; } tool = b.dataset.t; $$('.ctools button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); };
      });
      $('#tmGo', el).onclick = function () {
        sfx('timewarp'); el.classList.add('shake'); this.disabled = true;
        var y = 2026, t0 = performance.now();
        (function spin(now) {
          var p = Math.min(1, (now - t0) / 1900), v = Math.round(2026 + (-40000 - 2026) * (p * p));
          $('#tmYear', el).textContent = v > 0 ? AR(v) : AR(-v) + ' سنة مضت'; $('#tmLbl', el).textContent = p < 1 ? 'نرجع بالزمن…' : 'وصلنا! 🔥';
          if (p < 1) requestAnimationFrame(spin);
          else setTimeout(function () { el.classList.remove('shake'); $('#tmA', el).style.display = 'none'; $('#tmB', el).style.display = ''; sfx('magic'); say('وصلنا <b>للعصر الحجري</b>! 🔥 الخطوط كانت <b>أقدم وسيلة</b> للتعبير الفني… ارسمي على جدار الكهف!', 0, '04'); }, 600);
        })(t0);
      };
      // Hima rock: scratch to reveal
      var rc = $('#rock canvas', el), rx = rc.getContext('2d'), revealed = false;
      function rockCover() {
        revealed = false; rx.globalCompositeOperation = 'source-over';
        var g = rx.createLinearGradient(0, 0, 560, 620); g.addColorStop(0, '#8E6A4E'); g.addColorStop(1, '#6E4E38'); rx.fillStyle = g; rx.fillRect(0, 0, 560, 620);
        for (var i = 0; i < 7000; i++) { rx.fillStyle = 'rgba(' + (R() < .5 ? '50,30,20' : '200,170,140') + ',' + (R() * .2) + ')'; var s = R() * 6; rx.fillRect(R() * 560, R() * 620, s, s); }
        rx.fillStyle = 'rgba(255,240,210,.8)'; rx.font = '800 40px B'; rx.textAlign = 'center'; rx.fillText('👆 اكشطي هنا', 280, 320);
      }
      rockCover();
      var rl = null, strokes = 0;
      function scratch(p) {
        rx.globalCompositeOperation = 'destination-out'; rx.lineCap = 'round'; rx.lineWidth = 70;
        rx.beginPath(); rx.moveTo((rl || p)[0], (rl || p)[1]); rx.lineTo(p[0], p[1]); rx.stroke(); rl = p;
        if (++strokes % 12 === 0 && !revealed) {
          var d = rx.getImageData(0, 0, 560, 620).data, clear = 0; for (var i = 3; i < d.length; i += 160) if (d[i] < 40) clear++;
          if (clear / (d.length / 160) > .55) {
            revealed = true; rc.style.transition = 'opacity 1s'; rc.style.opacity = 0; sfx('magic'); confetti(26, ['⭐', '✨', '🇸🇦', '🏛️']);
            $('#unesco', el).classList.add('on'); markDone('time');
            say('رائع! 🎉 هذه <b>رسوم صخرية</b> في حِمى بنجران… شوفي الخطوط كيف رسمت الناس والحيوانات!', 0, '06');
          }
        }
      }
      rc.addEventListener('pointerdown', function (e) { rc.setPointerCapture(e.pointerId); rl = null; scratch(local(e, rc)); loopStart('scrape', .5); });
      rc.addEventListener('pointermove', function (e) { if (rl) scratch(local(e, rc)); });
      rc.addEventListener('pointerup', function () { rl = null; loopStop(); });
      $('#toHima', el).onclick = function () { sfx('whoosh'); $('#tmB', el).style.display = 'none'; $('#tmC', el).style.display = ''; say('هنا في بلادنا 🇸🇦 رسوم صخرية مخبّأة… <b>اكشطي الصخرة</b> واكتشفيها!', 0, '05'); };
      this.reset = function () { $('#tmA', el).style.display = ''; $('#tmB', el).style.display = 'none'; $('#tmC', el).style.display = 'none'; $('#tmGo', el).disabled = false; $('#tmYear', el).textContent = '٢٠٢٦'; $('#tmLbl', el).textContent = 'نحن الآن'; rockCover(); rc.style.transition = 'none'; rc.style.opacity = 1; $('#unesco', el).classList.remove('on'); };
    },
    enter: function () { this.reset(); }
  });

  // ================= 2. MUSEUM =================
  station({
    id: 'museum', num: '٢', title: 'المتحف السري: فن التخطيط',
    say: 'أهلًا في <b>المتحف السري</b> 🔍 اضغطي على أي لوحة وكبّريها بالعدسة… شوفي الخطوط عن قرب!', voice: '07',
    html: '<div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:#E9DCC0;box-shadow:inset 0 10px 0 #D8C79F"></div>' +
      '<div class="spot" style="left:100px"></div><div class="spot" style="left:540px"></div>' +
      '<div class="frame" data-src="assets/img/trees.jpg" data-cap="تخطيط مجموعة من الأشجار – الفنان تيتان" style="left:130px;top:190px;width:400px;height:300px"><img src="assets/img/trees.jpg"><div class="plaque">الفنان «تيتان» 🌳</div></div>' +
      '<div class="frame" data-src="assets/img/hands.jpg" data-cap="لوحة تخطيطية – الفنان ليوناردو دافنشي" style="left:600px;top:150px;width:300px;height:370px"><img src="assets/img/hands.jpg"><div class="plaque">الفنان «ليوناردو دافنشي» ✋</div></div>' +
      '<div class="card tape" style="right:120px;top:120px;width:500px;padding:28px 32px"><h2 style="font-size:50px">فن التخطيط ✏️</h2>' +
      '<p class="lead">يُعدّ <b>الرسم اليدوي (التخطيط)</b> الأساس لأي إنتاج فني.</p>' +
      '<p class="lead">يعتمد على الرسم بـ:</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px"><span class="pill" style="background:var(--ink)">✏️ القلم الرصاص</span><span class="pill" style="background:#555">⚫ الفحم</span><span class="pill" style="background:var(--sky)">🪶 الريشة</span></div>' +
      '<p class="lead" style="margin-top:12px">بدرجة لونية <b>واحدة</b> أو درجات <b>متعددة</b>.</p></div>' +
      '<div id="viewer"><button class="ic" id="viewClose">✖</button><img id="viewImg"><div id="lens"></div>' +
      '<div id="zoomBtns"><button class="btn alt" data-z="-1">➖ أبعدي</button><span id="zoomV" class="pill" style="background:var(--ink);font-size:30px;padding:14px 26px">×٢٫٥</span><button class="btn alt" data-z="1">➕ قرّبي</button></div></div>',
    init: function (el) {
      var v = $('#viewer', el), img = $('#viewImg', el), lens = $('#lens', el), Z = 2.5;
      $$('.frame', el).forEach(function (f) {
        f.onclick = function () { sfx('pop'); img.src = f.dataset.src; v.classList.add('on'); guide(false); say(f.dataset.cap); lens.style.backgroundImage = 'url(' + f.dataset.src + ')'; markDone('museum'); };
      });
      $('#viewClose', el).onclick = function () { v.classList.remove('on'); lens.style.display = 'none'; guide(true); };
      function move(e) {
        var p = local(e, img), w = img.offsetWidth, h = img.offsetHeight, br = img.getBoundingClientRect(), sr = $('#stage').getBoundingClientRect(), k = sr.width / 1600;
        if (p[0] < 0 || p[1] < 0 || p[0] > w || p[1] > h) { lens.style.display = 'none'; return; }
        lens.style.display = 'block';
        var lx = (br.left - sr.left) / k + p[0] * (br.width / k) / w, ly = (br.top - sr.top) / k + p[1] * (br.height / k) / h;
        lens.style.left = (lx - 150) + 'px'; lens.style.top = (ly - 150) + 'px';
        lens.style.backgroundSize = (w * Z) + 'px ' + (h * Z) + 'px';
        lens.style.backgroundPosition = (150 - p[0] * Z) + 'px ' + (150 - p[1] * Z) + 'px';
      }
      img.addEventListener('pointermove', move); img.addEventListener('pointerdown', move);
      img.addEventListener('pointerleave', function () { lens.style.display = 'none'; });
      $$('#zoomBtns button', el).forEach(function (b) { b.onclick = function () { Z = Math.max(1.5, Math.min(5, Z + (+b.dataset.z) * .5)); $('#zoomV', el).textContent = '×' + AR(String(Z).replace('.', '٫')); sfx('pop'); }; });
    },
    leave: function (el) { $('#viewer', el).classList.remove('on'); }
  });

  // ================= 3. ELEMENTS =================
  var EL = [
    ['النقطة', '#C2457A', 'أصغر عنصر في الفن… ومنها تبدأ كل رسمة!', '<circle cx="85" cy="85" r="10" fill="#C2457A"><animate attributeName="r" values="6;16;6" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="40" cy="50" r="6" fill="#C2457A" opacity=".5"/><circle cx="130" cy="120" r="7" fill="#C2457A" opacity=".5"/><circle cx="125" cy="40" r="5" fill="#C2457A" opacity=".4"/>'],
    ['المساحة', '#E2A72E', 'خطّ يلتفّ ويُقفل… فيصنع مساحة، مثل شكل الورقة.', '<path d="M30 120 C30 40 140 20 145 70 C150 130 60 150 30 120Z" fill="#E2A72E" fill-opacity=".35" stroke="#B57E10" stroke-width="5"><animate attributeName="fill-opacity" values=".1;.7;.1" dur="2s" repeatCount="indefinite"/></path>'],
    ['اللون', '#3E8FD0', 'يعطي الرسمة الحياة والإحساس: أخضر الربيع، وبرتقالي الخريف.', '<circle cx="60" cy="65" r="38" fill="#7BBF5E" opacity=".85"/><circle cx="110" cy="65" r="38" fill="#F2B233" opacity=".85"/><circle cx="85" cy="110" r="38" fill="#E26D2E" opacity=".85"><animateTransform attributeName="transform" type="rotate" from="0 85 85" to="360 85 85" dur="6s" repeatCount="indefinite"/></circle>'],
    ['التكوين', '#7A4FC2', 'ترتيب مكوّنات الصورة بحيث تنتقل العين من جزء إلى آخر دون ملل.', '<rect x="20" y="20" width="130" height="130" rx="12" fill="none" stroke="#7A4FC2" stroke-width="4" stroke-dasharray="8 8"/><circle cx="55" cy="60" r="16" fill="#7A4FC2"/><rect x="85" y="85" width="40" height="40" rx="6" fill="#C2A6F0"/><path d="M60 125 L95 50" stroke="#7A4FC2" stroke-width="4" stroke-dasharray="4 6"><animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite"/></path>'],
    ['الخط', '#3E8E41', 'نقطة تحرّكت! وهو <b>أقدم وسيلة</b> للتعبير الفني، ومحور درسنا.', '<path d="M20 120 C50 20 90 160 150 40" fill="none" stroke="#3E8E41" stroke-width="7" stroke-linecap="round" stroke-dasharray="260" stroke-dashoffset="260"><animate attributeName="stroke-dashoffset" values="260;0;0" dur="2.4s" repeatCount="indefinite"/></path>']
  ];
  station({
    id: 'elements', num: '٣', title: 'عناصر التعبير الفني', peek: true,
    say: 'الفنان يعبّر عن أفكاره بخمسة عناصر… <b>اقلبي البطاقات</b> واكتشفيها! 🃏', voice: '08',
    html: '<h2 style="text-align:center">عناصر التعبير الفني 🃏</h2><p class="lead" style="text-align:center">مجموعة من العناصر يعتمد عليها الفنان للتعبير عن أفكاره</p>' +
      EL.map(function (e, i) {
        return '<div class="ecard" style="right:' + (148 + i * 266) + 'px;top:330px"><div class="in"><div class="f">' + (i === 4 ? '<span class="star">⭐ محور درسنا</span>' : '') +
          '<svg viewBox="0 0 170 170">' + e[3] + '</svg><b style="color:' + e[1] + '">' + e[0] + '</b><small style="font:400 19px R;color:var(--ink2)">اضغطي لتقلبيها</small></div>' +
          '<div class="b" style="background:' + e[1] + '"><b>' + e[0] + '</b>' + e[2] + '</div></div></div>';
      }).join(''),
    init: function (el) {
      $$('.ecard', el).forEach(function (c, i) { c.onclick = function () { c.classList.toggle('flip'); sfx('flip'); if (c.classList.contains('flip')) say('<b>' + EL[i][0] + '</b>: ' + EL[i][2]); }; });
    },
    enter: function (el) { $$('.ecard', el).forEach(function (c, i) { c.classList.remove('flip'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = 'pop .55s cubic-bezier(.3,1.5,.5,1) ' + (.15 + i * .1) + 's both'; }); }
  });

  // ================= 4. TOOLS =================
  var TOOLS = [
    ['pencil', 'قلم رصاص', 'متدرّج بين الصلابة والليونة', '<rect x="10" y="14" width="80" height="16" fill="#F2B233"/><rect x="2" y="14" width="10" height="16" fill="#E88" rx="2"/><path d="M90 14 L112 22 L90 30Z" fill="#F4D9B0"/><path d="M104 19.5 L112 22 L104 24.5Z" fill="#333"/>'],
    ['pen', 'أقلام ملوّنة وريشة', 'خطوط مختلفة السماكات', '<path d="M6 30 C30 10 60 34 84 18" stroke="#3E8FD0" stroke-width="4" fill="none"/><path d="M80 6 C100 2 116 14 112 20 L88 26 C84 18 82 12 80 6Z" fill="#C2457A"/><path d="M88 26 L84 34" stroke="#333" stroke-width="2"/>'],
    ['charcoal', 'أقلام فحم', 'أسود قوي، ويُطمس بالإصبع', '<rect x="14" y="13" width="90" height="18" rx="6" fill="#222"/><rect x="20" y="16" width="40" height="4" rx="2" fill="#555"/>'],
    ['crayon', 'أقلام شمعية', 'ملمس خشن ولامع', '<rect x="10" y="13" width="78" height="18" rx="4" fill="#E26D2E"/><rect x="24" y="13" width="40" height="18" fill="#F6C59E"/><path d="M88 13 L108 22 L88 31Z" fill="#E26D2E"/>']
  ];
  var PEN_COLORS = ['#3E8E41', '#3E8FD0', '#C2457A', '#E26D2E', '#7A4FC2'];
  station({
    id: 'tools', num: '٤', title: 'صندوق أدوات الرسم', peek: true,
    say: 'اختاري أداة وارسمي على الورقة… <b>لاحظي الفرق</b> بين خطوط كل أداة! ✏️', voice: '09',
    html: '<canvas id="sheet" width="940" height="640"></canvas>' +
      '<div id="toolRack">' + TOOLS.map(function (t, i) { return '<button class="tool' + (i ? '' : ' on') + '" data-t="' + t[0] + '"><svg viewBox="0 0 120 44">' + t[3] + '</svg><span>' + t[1] + '<small>' + t[2] + '</small></span></button>'; }).join('') + '</div>' +
      '<div class="card" id="hard"><div class="lb"><span>صلب H (فاتح ورفيع)</span><span>لين B (غامق)</span></div><input type="range" min="0" max="100" value="45" id="hardV">' +
      '<div id="penCols" style="display:none;gap:10px;justify-content:center">' + PEN_COLORS.map(function (c, i) { return '<button class="sw' + (i ? '' : ' on') + '" style="width:50px;height:50px;background:' + c + '" data-c="' + c + '"></button>'; }).join('') + '</div></div>' +
      '<button class="btn alt" id="sheetNew" style="position:absolute;right:120px;top:780px;width:360px;font-size:26px;padding:10px 26px 14px">🧻 ورقة جديدة</button>',
    init: function (el) {
      var cv = $('#sheet', el), x = cv.getContext('2d'), tool = 'pencil', penC = PEN_COLORS[0], R = rnd(3), last = null, lt = 0;
      function paper() { x.fillStyle = '#fff'; x.fillRect(0, 0, 940, 640); for (var i = 0; i < 2500; i++) { x.fillStyle = 'rgba(120,100,60,' + R() * .05 + ')'; x.fillRect(R() * 940, R() * 640, 2, 2); } }
      paper();
      function seg(a, b, sp) {
        var h = +$('#hardV', el).value / 100, d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, d / 1.5);
        if (tool === 'pencil') {
          x.strokeStyle = 'rgba(45,45,55,' + (.25 + h * .6) + ')'; x.lineWidth = 1 + h * 4; x.lineCap = 'round';
          x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
          for (var i = 0; i < n * 2; i++) { x.fillStyle = 'rgba(255,255,255,' + R() * .5 + ')'; x.fillRect(a[0] + (b[0] - a[0]) * R() + (R() - .5) * 4, a[1] + (b[1] - a[1]) * R() + (R() - .5) * 4, 1, 1); }
        } else if (tool === 'pen') {
          x.strokeStyle = penC; x.lineCap = 'round'; x.lineWidth = Math.max(2, Math.min(16, 16 - sp * 9)); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
        } else if (tool === 'charcoal') {
          for (i = 0; i < n; i++) {
            var px = a[0] + (b[0] - a[0]) * i / n, py = a[1] + (b[1] - a[1]) * i / n;
            for (var k = 0; k < 10; k++) { x.fillStyle = 'rgba(20,18,18,' + (.08 + R() * .3) + ')'; x.fillRect(px + (R() - .5) * 18, py + (R() - .5) * 18, 1 + R() * 3, 1 + R() * 3); }
            x.fillStyle = 'rgba(30,28,28,.05)'; x.beginPath(); x.arc(px, py, 14, 0, 7); x.fill();
          }
        } else {
          for (i = 0; i < n; i++) {
            px = a[0] + (b[0] - a[0]) * i / n; py = a[1] + (b[1] - a[1]) * i / n;
            for (k = 0; k < 8; k++) if (R() > .25) { x.fillStyle = penC; x.globalAlpha = .35 + R() * .5; x.fillRect(px + (R() - .5) * 16, py + (R() - .5) * 16, 2 + R() * 3, 1 + R() * 2); }
            x.globalAlpha = 1;
          }
        }
      }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); last = local(e, cv); lt = performance.now(); seg(last, [last[0] + .5, last[1] + .5], 0); loopStart(tool, .55); });
      cv.addEventListener('pointermove', function (e) { if (!last) return; var p = local(e, cv), now = performance.now(), sp = Math.hypot(p[0] - last[0], p[1] - last[1]) / Math.max(1, now - lt); seg(last, p, sp); last = p; lt = now; });
      cv.addEventListener('pointerup', function () { last = null; loopStop(); markDone('tools'); });
      var TIPS = { pencil: 'القلم <b>الصلب</b> يعطي خطًا فاتحًا رفيعًا، و<b>اللين</b> خطًا غامقًا… حرّكي الشريط وجرّبي!', pen: 'الريشة والأقلام الملوّنة: ارسمي <b>ببطء</b> يطلع الخط عريض، و<b>بسرعة</b> يطلع رفيع!', charcoal: 'الفحم أسود قوي وناعم، وخطوطه <b>تنطمس</b> مثل الدخان 🖤', crayon: 'الأقلام الشمعية ملمسها <b>خشن</b> ويبين فيه شكل الورق 🖍️' };
      $$('.tool', el).forEach(function (b) {
        b.onclick = function () {
          tool = b.dataset.t; sfx('pop'); $$('.tool', el).forEach(function (t) { t.classList.toggle('on', t === b); });
          $('#hardV', el).style.display = tool === 'pencil' ? '' : 'none'; $('.lb', el).style.display = tool === 'pencil' ? '' : 'none';
          $('#penCols', el).style.display = (tool === 'pen' || tool === 'crayon') ? 'flex' : 'none'; $('#hard', el).style.display = tool === 'charcoal' ? 'none' : '';
          say(TIPS[tool], 0, { pencil: '10', charcoal: '11' }[tool]);
        };
      });
      $$('#penCols .sw', el).forEach(function (s) { s.onclick = function () { penC = s.dataset.c; sfx('pop'); $$('#penCols .sw', el).forEach(function (o) { o.classList.toggle('on', o === s); }); }; });
      $('#sheetNew', el).onclick = function () { sfx('flip'); paper(); };
    }
  });

  // ================= 5. VARIETY =================
  var VAR = [
    ['ovate', 'المسنّنة', '#7BBF5E', 'حافتها <b>مسنّنة</b> مثل المنشار، والعروق تخرج من الوسط مثل ريشة الطائر 🪶'],
    ['maple', 'الكفّية', '#E26D2E', 'عروقها تنطلق من <b>نقطة واحدة</b> مثل أصابع اليد ✋'],
    ['oak', 'المتموّجة', '#C9A227', 'حافتها <b>متموّجة</b> بانحناءات ناعمة 〰️'],
    ['willow', 'الرمحية', '#3E8E41', 'طويلة ورفيعة، وخطوطها <b>مائلة ومتوازية</b> ↗️'],
    ['grape', 'العريضة', '#A6C34B', 'ورقة <b>عريضة</b> بفصوص، مساحاتها كبيرة 🍇']
  ];
  station({
    id: 'variety', num: '٥', title: 'التنوع في أوراق الشجر', peek: true,
    say: 'كل ورقة لها <b>خطوط مختلفة</b>! اضغطي على الورقة لتسمعي سرّها… وجرّبي زر «الخطوط فقط» 👀', voice: '12',
    html: '<h2 style="text-align:center">لنتأمّل الخطوط في أوراق الشجر 🍂</h2><p class="lead" style="text-align:center">لاحظي <b>اختلاف اتجاهات الخطوط</b>، و<b>التنوّع في المساحات</b> التي تحصرها</p>' +
      '<div id="variety">' + VAR.map(function (v, i) {
        return '<div class="vl" data-i="' + i + '" style="right:' + (i * 265) + 'px"><svg viewBox="-170 -330 340 400"><g class="lv">' + leafSVG(v[0], { fill: v[2], ink: 'rgba(0,0,0,.55)', vein: 'rgba(0,0,0,.45)', w: 3 }) + '</g></svg><b>' + v[1] + '</b></div>';
      }).join('') + '</div>' +
      '<div style="position:absolute;left:0;right:0;top:700px;text-align:center"><button class="btn blue" id="onlyLines">👀 الخطوط فقط</button></div>',
    init: function (el) {
      var only = false;
      $$('.vl', el).forEach(function (d) {
        d.onclick = function () {
          var v = VAR[+d.dataset.i]; sfx('pop'); say('الورقة <b>' + v[1] + '</b>: ' + v[3]);
          var g = $('.lv', d); g.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 700 });
          $$('.lb,.lc', d).forEach(function (p) { p.animate([{ stroke: '#fff', strokeWidth: 6 }, { stroke: '' }], { duration: 1400 }); });
          markDone('variety');
        };
      });
      $('#onlyLines', el).onclick = function () {
        only = !only; sfx('magic', .5); this.textContent = only ? '🎨 بالألوان' : '👀 الخطوط فقط';
        $$('.vl .la', el).forEach(function (p) { if (p.getAttribute('fill') !== 'none') { p.dataset.f = p.dataset.f || p.getAttribute('fill'); p.style.transition = 'fill .6s'; p.style.fill = only ? '#fff' : p.dataset.f; } });
        $$('.vl path', el).forEach(function (p) { p.style.stroke = only ? '#2B2A33' : ''; });
        if (only) say('شوفي! الورقة كلها <b>خطوط</b>: خط يحدّ الشكل، وخطوط للعروق، وخطوط صغيرة للتفاصيل ✏️', 0, '13');
      };
    }
  });
})();
