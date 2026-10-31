// خطة اليومين: تعلّم ← اختبر ← راجع، لكل أقسام «ملحق الحيوانات» (ص٢٣٦–٢٤٠) من الموسوعة للأستاذ إبراهيم قشير.
(function () {
  var prev = window.ZOO_READY;
  window.ZOO_READY = function () {
    if (prev) prev();
    var Z = window.ZOO, D = window.Z, app = Z.app, AR = Z.AR, shuffle = Z.shuffle;
    var CATS = {
      s: { name: 'أصوات الحيوانات', ic: '🦁', pg: 'ص٢٣٦–٢٣٧', rows: D.sounds, col: '#FF8A3D', card: function (r) { return { img: 's_' + r[0], top: r[1], big: r[2], sub: 'صوتُ ' + r[1], say: { snd: r[0], text: 'صوتُ ' + r[1] + ' اسمُه: ' + r[2] } }; } },
      t: { name: 'أصوات من حولنا', ic: '🌬️', pg: 'ص٢٣٧', rows: D.things, col: '#22A6E8', card: function (r) { return { img: 's_' + r[0], top: r[1], big: r[2], sub: 'صوتُ ' + r[1], say: { snd: r[0], text: 'صوتُ ' + r[1] + ' اسمُه: ' + r[2] } }; } },
      y: { name: 'صغار الحيوانات', ic: '🥚', pg: 'ص٢٣٨', rows: D.young, col: '#FF5FA2', card: function (r) { return { img: r[4] || ('y_' + r[0]), top: r[1], big: r[2], sub: 'صغيرُ ' + r[1], say: { text: 'صغيرُ ' + r[1] + ' اسمُه: ' + r[2] } }; } },
      h: { name: 'بيوت الحيوانات', ic: '🏠', pg: 'ص٢٣٩', rows: D.homes, col: '#22C55E', card: function (r) { return { img: r[4] || ('h_' + r[0]), top: r[1], big: r[2], sub: 'بيتُ ' + r[1], say: { text: 'يسكنُ ' + r[1] + ' في: ' + r[2] } }; } },
      p: { name: 'الذكر والأنثى', ic: '💞', pg: 'ص٢٤٠', rows: D.pairs, col: '#7B5CFF', card: function (r) { return { img: 'm_' + r[0], top: '♂ ' + r[1], big: '♀ ' + r[2], sub: 'ذكرُ ' + r[1] + ' وأنثاه', say: { text: r[1] + '، وأنثاه: ' + r[2] } }; } }
    };
    var ORDER = ['s', 't', 'y', 'h', 'p'];
    function keys(c) { return CATS[c].rows.map(function (r) { return c + ':' + r[0]; }); }
    function done(wid) { var P = Z.getP(); return (P.best[wid] || 0) > 0; }
    function lp() { var P = Z.getP(); P.learned = P.learned || {}; return P.learned; }
    function box(k) { var P = Z.getP(), e = (P.srs || {})[k]; return e ? e.b : -1; }
    function mastered() { var n = 0, t = 0; ORDER.forEach(function (c) { keys(c).forEach(function (k) { t++; if (box(k) >= 2) n++; }); }); return [n, t]; }

    // ---------- learn deck ----------
    function deck(c, after) {
      var C = CATS[c], rows = C.rows, i = 0;
      function show() {
        var r = rows[i], cd = C.card(r), L = lp(), key = c + ':' + r[0];
        Z.stop();
        app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<h1 class="t">' + C.ic + ' ' + C.name + '</h1><div class="sub">من ملحق الموسوعة ' + C.pg + ' · البطاقة ' + AR(i + 1) + ' من ' + AR(rows.length) + '</div>' +
          '<div class="prog">' + rows.map(function (_, k) { return '<i class="' + (k < i ? 'd' : k === i ? 'c' : '') + '"></i>'; }).join('') + '</div>' +
          '<div class="q blk" style="text-align:center"><img class="pic" src="img/' + cd.img + '.jpg" alt="" onerror="this.style.display=\'none\'"><div style="font:800 20px B;margin-top:6px">' + cd.top + '</div><div class="lbig" style="font:800 40px/1.5 B;color:' + C.col + ';margin:4px 0">' + cd.big + '</div><div class="muted" style="font:600 15px R;color:#5B6280">' + cd.sub + '</div><button class="btn w" id="ls" style="margin-top:10px">🔊 استمعوا</button></div>' +
          '<div class="nav"><button class="btn p" id="ag">🔁 أعيدها لاحقًا</button><button class="btn g" id="ok">عرفتُها ✓</button></div></div>';
        var bk = document.getElementById('bk'); if (bk) bk.onclick = hub;
        var say = function () { if (cd.say.snd) Z.sound(cd.say.snd, cd.say.text, document.getElementById('ls'), function () { Z.speak(cd.say.text); }); else Z.speak(cd.say.text); };
        document.getElementById('ls').onclick = function () { Z.play(say); };
        setTimeout(function () { Z.play(say); }, 300);
        function nextCard(known) { if (known) L[key] = 1; Z.getP().learned = L; Z.save(); i++; if (i < rows.length) show(); else finish(); }
        document.getElementById('ok').onclick = function () { nextCard(true); };
        document.getElementById('ag').onclick = function () { nextCard(false); };
      }
      function finish() {
        var P = Z.getP(); P.best['L_' + c] = 1; Z.save(); Z.confetti(14);
        app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<div class="ach blk">' + Z.avatar(P) + '<h2>أنهينا بطاقاتِ «' + C.name + '» 🎉</h2><div class="sub">الآن اختبروا أنفسَكم: ما لم تعرفْه يرجعُ لك غدًا.</div></div><div class="nav"><button class="btn w" id="h">🗺️ الخطة</button><button class="btn g" id="q">هيّا نختبر ▶</button></div></div>';
        Z.wireBack(); var bk = document.getElementById('bk'); if (bk) bk.onclick = hub;
        document.getElementById('h').onclick = hub; document.getElementById('q').onclick = function () { quizCat(c); };
        Z.play(function () { Z.speak('أحسنتم! الآن اختبروا أنفسكم.'); });
      }
      show();
    }
    function quizCat(c) {
      var C = CATS[c], ks = shuffle(keys(c)).slice(0, Math.min(10, keys(c).length));
      var items = ks.map(Z.reviewItem).filter(Boolean);
      Z.quiz('Q_' + c, C.ic + ' اختبار: ' + C.name, items, { again: function () { quizCat(c); } });
    }
    function exam() {
      var all = []; ORDER.forEach(function (c) { all = all.concat(shuffle(keys(c)).slice(0, c === 'p' ? 4 : 7)); });
      var items = shuffle(all).map(Z.reviewItem).filter(Boolean);
      Z.quiz('Q_exam', '🏆 اختبار الملحق الشامل', items, { again: exam });
    }
    function weak() {
      var ks = []; ORDER.forEach(function (c) { keys(c).forEach(function (k) { if (box(k) < 2) ks.push(k); }); });
      var items = shuffle(ks).slice(0, 12).map(Z.reviewItem).filter(Boolean);
      if (!items.length) { Z.map(); return; }
      Z.quiz('Q_weak', '🎯 ما لم نتقنْه بعد بعد', items, { again: weak });
    }

    // ---------- plan + mastery map ----------
    var DAYS = [
      ['اليوم الأول', '#FF8A3D', [['L', 's'], ['Q', 's'], ['L', 't'], ['Q', 't']]],
      ['اليوم الثاني', '#7B5CFF', [['R', 'dueFirst'], ['L', 'y'], ['Q', 'y'], ['L', 'h'], ['Q', 'h'], ['L', 'p'], ['Q', 'p'], ['E', 'exam']]]
    ];
    function stepDone(s) { var P = Z.getP(); if (s[0] === 'L') return !!P.best['L_' + s[1]]; if (s[0] === 'Q') return (P.best['Q_' + s[1]] || 0) > 0; if (s[0] === 'E') return (P.best.Q_exam || 0) > 0; return false; }
    function stepName(s) { var C = CATS[s[1]]; if (s[0] === 'L') return '📖 تعلّموا: ' + C.name + ' (' + AR(C.rows.length) + ')'; if (s[0] === 'Q') return '✏️ اختبروا: ' + C.name; if (s[0] === 'E') return '🏆 اختبار الملحق الشامل'; return '🔁 مراجعةُ أمس'; }
    function hub() {
      Z.stop(); var m = mastered(), P = Z.getP(), pct = Math.round(m[0] / m[1] * 100), due = Z.dueKeys().length;
      app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<h1 class="t">🎓 خطةُ يومين: أتقنوا ملحقَ الحيوانات</h1><div class="hello blk">كلُّ ما في ملحق الموسوعة (ص٢٣٦–٢٤٠): ' + AR(m[1]) + ' معلومة. بطاقة ← اختبار ← مراجعة. والنجوم تأتي مع الإتقان 🌟</div>' +
        '<div class="blk" style="padding:12px 14px;margin:10px 0"><b style="font:800 18px B">أتقنّا ' + AR(m[0]) + ' من ' + AR(m[1]) + '</b><div style="height:18px;border:3px solid var(--line);border-radius:12px;background:#fff;margin-top:6px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#22C55E,#86EFAC)"></div></div></div>' +
        DAYS.map(function (d) { return '<div class="blk" style="padding:12px 14px;margin:10px 0;border-right:10px solid ' + d[1] + '"><h2 style="margin:0 0 6px">' + d[0] + '</h2>' + d[2].map(function (s, k) { var ok = stepDone(s); return '<button class="opt" data-st="' + s[0] + ':' + s[1] + '" style="display:flex;width:100%;justify-content:space-between;align-items:center;margin:6px 0;' + (ok ? 'background:#d9f7d9' : '') + '"><span>' + stepName(s) + '</span><span>' + (ok ? '✅' : '◀') + '</span></button>'; }).join('') + '</div>'; }).join('') +
        '<div class="nav" style="flex-wrap:wrap"><button class="btn w" id="mp">🧭 خريطة إتقاني</button><button class="btn p" id="wk">🎯 ما لم نتقنْه بعد</button>' + (due ? '<button class="btn" id="dr" style="background:#F59E0B">🔔 مراجعة اليوم (' + AR(due) + ')</button>' : '') + '</div></div>';
      var bk = document.getElementById('bk'); if (bk) bk.onclick = Z.map;
      [].forEach.call(app.querySelectorAll('[data-st]'), function (b) { b.onclick = function () { var p = b.dataset.st.split(':'); if (p[0] === 'L') deck(p[1]); else if (p[0] === 'Q') quizCat(p[1]); else if (p[0] === 'E') exam(); else { var it = Z.dueKeys().length; if (it) { Z.quiz('Q_rev', '🔁 مراجعة', shuffle(Z.dueKeys()).slice(0, 10).map(Z.reviewItem).filter(Boolean), { again: hub }); } else { Z.speak('لا مراجعة اليوم، أحسنتم!'); } } }; });
      document.getElementById('mp').onclick = mapView; document.getElementById('wk').onclick = weak;
      var dr = document.getElementById('dr'); if (dr) dr.onclick = function () { Z.quiz('Q_rev', '🔁 مراجعة اليوم', shuffle(Z.dueKeys()).slice(0, 10).map(Z.reviewItem).filter(Boolean), { again: hub }); };
      window.scrollTo(0, 0);
    }
    function mapView() {
      var m = mastered();
      app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<h1 class="t">🧭 خريطةُ إتقاني</h1><div class="sub">🟩 أتقنتُه · 🟨 أتعثّر · 🟥 أخطأتُ · ⬜ لم أجرّبه بعد</div><div class="blk" style="padding:10px 12px;margin:8px 0"><b>أتقنّا ' + AR(m[0]) + ' من ' + AR(m[1]) + '</b></div>' +
        ORDER.map(function (c) { var C = CATS[c]; return '<div class="blk" style="padding:10px 12px;margin:10px 0;border-right:10px solid ' + C.col + '"><b style="font:800 18px B">' + C.ic + ' ' + C.name + ' · ' + C.pg + '</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + C.rows.map(function (r) { var b = box(c + ':' + r[0]), cd = C.card(r), bg = b < 0 ? '#fff' : b === 0 ? '#ffc9c9' : b === 1 ? '#fff3b0' : '#bdf3c8'; return '<span style="background:' + bg + ';border:3px solid var(--line);border-radius:12px;padding:3px 10px;font:700 14px R">' + cd.top.replace('♂ ', '') + ' ← ' + cd.big.replace('♀ ', '') + '</span>'; }).join('') + '</div></div>'; }).join('') + '</div>';
      var bk = document.getElementById('bk'); if (bk) bk.onclick = hub; window.scrollTo(0, 0);
    }
    Z.addWorld(['wp', '🎓', 'خطةُ يومين', 'أتقنوا كلَّ ما في الملحق', '#0EA5E9', hub]);
    window.ZOO.hub = hub;
  };
})();
