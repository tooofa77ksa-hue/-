(function () {
  'use strict';
  var D = window.SHEET, $ = function (s) { return document.querySelector(s); };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // ---------- عبارات عربية مسجّلة (من تسجيل الرياضيات) ----------
  var GOOD = ['ممتازة! قرأتِ، وتمهّلتِ، ثم أجبتِ.', 'أحسنتِ! إجابةٌ صحيحة.', 'برافو عليكِ! هكذا تفعلُ البطلات.', 'رائعة! تمهُّلُكِ صنعَ الفرق.', 'ما شاءَ الله! حلٌّ دقيق.', 'أحسنتِ، لأنكِ تحقّقتِ من إجابتِكِ.'];
  var AGAIN = ['حاولي مرّةً أخرى، أنتِ قادرة.', 'الخطأُ يعلّمُنا. جرّبي مرّةً أخرى.'];
  var REREAD = 'اقرئي السؤالَ مرّةً ثانيةً على مَهَل.';
  var EN_GOOD = ['Great job!', 'Well done!'], EN_AGAIN = 'Try again.';

  // ---------- الصوت: تسجيلات فقط، بدون صوت كمبيوتر ----------
  var AU = new Audio(), queue = [], playing = false, onDone = null, waitT = 0;
  function vkey(w) { return String(w).toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^ء-يa-z0-9]/g, ''); }
  function has(t) { return !!(window.VMAP || {})[vkey(t)]; }
  function stop() { queue = []; playing = false; clearTimeout(waitT); try { AU.pause(); } catch (e) {} hl(null); think(false); }
  function play(list, done) { stop(); queue = list.slice(); onDone = done || null; playing = true; next(); }
  function next() {
    if (!queue.length) { playing = false; think(false); var d = onDone; onDone = null; if (d) d(); return; }
    var t = queue.shift();
    if (typeof t === 'object') {
      if (t.hl !== undefined) { hl(t.hl); return next(); }
      if (t.pause) { think(t.think); waitT = setTimeout(function () { think(false); next(); }, t.pause); return; }
    }
    var f = (window.VMAP || {})[vkey(t)];
    if (!f) return next();
    AU.onended = function () { waitT = setTimeout(next, 250); };
    AU.src = 'voice/' + f + '.mp3';
    var p = AU.play(); if (p && p.catch) p.catch(function () { next(); });
  }
  function hl(id) {
    document.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); });
    if (!id) return; var e = document.querySelector('[data-k="' + id + '"]');
    if (e) { e.classList.add('hl'); e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  function think(on) { $('#think').classList.toggle('hidden', !on); }

  // ---------- التقدّم: كل سؤال يحتاج ٣ نجوم (٣ جولات) ليثبت ----------
  var KEY = 'eng_review_v1', S = { m: {} };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.m) S = s0; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var ALL = [];
  D.forEach(function (s) { (s.left || s.items || (s.item ? [s.item] : [])).forEach(function (it) { ALL.push(it.id); if (s.spell) ALL.push(it.id + 'w'); }); });
  function star(id) { S.m[id] = Math.min(3, (S.m[id] || 0) + 1); save(); prog(); }
  function dots(id) { var n = S.m[id] || 0, h = ''; for (var i = 0; i < 3; i++) h += i < n ? '★' : '☆'; return '<span class="dots" data-dots="' + id + '">' + h + '</span>'; }
  function upDots(id) { var e = document.querySelector('[data-dots="' + id + '"]'); if (e) e.outerHTML = dots(id); }
  function prog() {
    var done = ALL.filter(function (id) { return (S.m[id] || 0) >= 3; }).length;
    $('#prog').innerHTML = 'ثبّتِ <b>' + done + '</b> من <b>' + ALL.length + '</b> <small>(كل سؤال يثبت بعد ٣ نجوم ★★★ في ٣ جولات)</small>';
  }

  // ---------- الرسم ----------
  var mode = 'learn', round = 0, firstTry = {};
  function sayBtn(list, cls) { return '<button class="say ' + (cls || '') + '" data-say=\'' + JSON.stringify(list).replace(/'/g, '&#39;') + '\'>🔊</button>'; }
  function head(s) {
    return '<div class="sh"><span class="t">' + s.title + '</span>' + sayBtn(s.inst) + '</div><div class="tip">' + s.tip + ' — ' + s.inst[1].replace('المطلوب: ', '') + '</div>';
  }
  function info(it, extra) {
    return '<div class="info"><div><span class="lb">🇸🇦 المعنى</span> ' + it.ar + '</div><div><span class="lb">🗣️ النطق</span> <span class="pr">' + it.pr + '</span></div>' +
      (extra || '') + '<div class="hook">💡 ' + it.hook + '</div></div>';
  }
  function render() {
    stop(); firstTry = {};
    var h = '';
    D.forEach(function (s) {
      if (s.h) { h += '<h2 class="sec">' + s.h + '</h2>'; return; }
      h += '<section class="blk" data-s="' + s.id + '">' + head(s) + R[s.type](s) + '</section>';
    });
    h += '<div class="posters"><img src="img/poster_ar.jpg" alt=""><img src="img/poster_en.jpg" alt=""></div><div class="bye">بالتوفيق My dear students 💗</div>';
    $('#paper').innerHTML = h;
    bind();
  }
  function whys(items) { return mode === 'solve' ? items.map(function (it) { return '<div class="whyc hidden" data-whyc="' + it.id + '">' + '</div>'; }).join('') : ''; }
  function thumb(it) { return it.img ? '<img class="th" src="img/' + it.img + '.jpg" alt="">' : (it.pic ? '<span class="thp">' + it.pic + '</span>' : ''); }
  var R = {
    match: function (s) {
      var right = mode === 'solve' && round ? shuffle(s.right) : s.right;
      var rows = '';
      var n = Math.max(s.left.length, right.length);
      for (var i = 0; i < n; i++) {
        var L = s.left[i], Rt = right[i];
        rows += '<tr><td class="l" data-k="' + L.id + '">' + L.n + '- ' + L.html + ' ' + sayBtn(L.say, 'sm') + (mode === 'solve' ? dots(L.id) : '') + '</td>' +
          '<td class="r">( ' + (mode === 'learn' ? '<b class="g">' + Rt.a + '</b>' : '<button class="slot" data-s="' + s.id + '" data-a="' + Rt.a + '">&nbsp;</button>') + ' ) ' + Rt.html + '</td></tr>';
        if (mode === 'learn') rows += '<tr class="det hidden" data-det="' + L.id + '"><td colspan="2">' + info(L, '<div><span class="lb">✔ الإجابة</span> <span dir="ltr">' + L.ans + '</span>' + (L.arAns ? ' — ' + L.arAns : '') + (L.prAns ? ' <span class="pr">(' + L.prAns + ')</span>' : '') + '</div>') + '</td></tr>';
        else rows += '<tr class="why hidden" data-why="' + s.id + '-' + Rt.a + '"><td colspan="2"></td></tr>';
      }
      return '<table class="tb' + (s.small ? ' small' : '') + '" dir="ltr">' + rows + '</table>' + (mode === 'solve' ? '<button class="btn g chk" data-chk="' + s.id + '">✔ تحقّقي</button><div class="msg" data-msg="' + s.id + '"></div>' : '');
    },
    choose: function (s) {
      var cols = s.items.map(function (it) {
        var opts = mode === 'solve' && round ? shuffle(it.opts) : it.opts;
        var top = it.img ? '<img src="img/' + it.img + '.jpg" alt="">' : it.pic;
        var o = opts.map(function (w, i) {
          var cls = mode === 'learn' && w === it.ok ? ' g' : '';
          return '<button class="op' + cls + '" data-it="' + it.id + '" data-w="' + w + '">' + (i + 1) + '- ' + w + '</button>';
        }).join('');
        return '<div class="col" data-k="' + it.id + '"><div class="pic">' + top + sayBtn(it.say, 'sm') + '</div>' + o + (mode === 'solve' ? dots(it.id) + (s.spell ? '<input class="win" data-win="' + it.id + 'w" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="✏️ اكتبيها"><button class="btn sm g wchk" data-wchk="' + it.id + 'w">✔</button>' + dots(it.id + 'w') + '<div class="lt" data-lt="' + it.id + 'w"></div>' : '') : '') + '</div>';
      }).join('');
      var det = mode === 'learn' ? s.items.map(function (it) { return '<div class="det hidden" data-det="' + it.id + '">' + '<b dir="ltr">' + it.ok + '</b>' + info(it) + '</div>'; }).join('') : '';
      return '<div class="grid' + (s.pics ? ' pics' : '') + '" dir="ltr">' + cols + '</div>' + det + whys(s.items) + (s.spell ? whys(s.items.map(function (it) { return BY[it.id + 'w']; })) : '');
    },
    write: function (s) {
      var bank = '<div class="bank" dir="ltr">( ' + s.bank.map(function (w) { return '<button class="bw" data-bw="' + w + '">' + w + '</button>'; }).join(' – ') + ' )</div>';
      var cols = s.items.map(function (it) {
        var low = mode === 'learn' ? '<div class="ans g">' + it.ok + '</div>' :
          '<input class="win" data-win="' + it.id + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="✏️ اكتبي هنا"><button class="btn sm g wchk" data-wchk="' + it.id + '">✔</button>' + dots(it.id) + '<div class="lt" data-lt="' + it.id + '"></div>';
        return '<div class="col" data-k="' + it.id + '"><div class="pic"><img src="img/' + it.img + '.jpg" alt="">' + sayBtn(it.say, 'sm') + '</div>' + low + '</div>';
      }).join('');
      var det = mode === 'learn' ? s.items.map(function (it) { return '<div class="det hidden" data-det="' + it.id + '"><b dir="ltr">' + it.ok + '</b>' + info(it) + '</div>'; }).join('') +
        '<div class="note">الكلمة الرابعة <b dir="ltr">cook pizza</b> (طبخ البيتزا 🍕) ما لها صورة هنا، لكن احفظيها لأن الترتيب ممكن يتغيّر ' + sayBtn(s.extra.say, 'sm') + '</div>' : '';
      return bank + '<div class="grid three" dir="ltr">' + cols + '</div>' + det + whys(s.items);
    },
    copy: function (s) {
      var it = s.item;
      var box = mode === 'learn' ? '<div class="line g" dir="ltr">' + it.text + '</div>' :
        '<input class="win wide" data-win="' + it.id + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="✏️ انسخي الجملة هنا" dir="ltr"><button class="btn sm g wchk" data-wchk="' + it.id + '">✔ تحقّقي</button>' + dots(it.id) + '<div class="lt" data-lt="' + it.id + '"></div><div class="whyc hidden" data-whyc="' + it.id + '"></div>';
      return '<div class="copy" data-k="' + it.id + '"><div class="sent" dir="ltr">' + it.text + ' ' + sayBtn(it.say, 'sm') + ' ' + sayBtn(it.spellSay, 'sm spell') + '</div>' + box +
        (mode === 'learn' ? info(it) : '') + '<div class="note">✍️ على الورق: اكتبيها بقلم الرصاص أولًا، ثم حبّريها بالقلم الأزرق الجاف.</div></div>';
    }
  };

  // ---------- التفاعل ----------
  var BY = {};
  D.forEach(function (s) { (s.left || s.items || (s.item ? [s.item] : [])).forEach(function (it) { BY[it.id] = it; it._s = s;
    if (s.spell) BY[it.id + 'w'] = { id: it.id + 'w', ok: it.ok, say: it.say, img: it.img, why: '' }; }); });
  function bind() {
    document.querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); play(JSON.parse(b.dataset.say)); }; });
    if (mode === 'learn') {
      document.querySelectorAll('[data-k]').forEach(function (r) {
        r.onclick = function () { var id = r.dataset.k, d = document.querySelector('[data-det="' + id + '"]'); if (d) d.classList.toggle('hidden'); play(BY[id].say); };
      });
      document.querySelectorAll('.op').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var it = BY[b.dataset.it], w = b.dataset.w; play(w === it.ok ? it.say : ((it.other || {})[w] || [])); }; });
      document.querySelectorAll('[data-bw]').forEach(function (b) { b.onclick = function () { var w = b.dataset.bw, it = null; D.forEach(function (s) { if (s.type === 'write') { s.items.forEach(function (x) { if (x.ok === w) it = x; }); if (!it && s.extra.w === w) it = s.extra; } }); if (it) play(it.say); }; });
      return;
    }
    // --- وضع الحل ---
    var picker = $('#picker');
    document.querySelectorAll('.slot').forEach(function (b) {
      b.onclick = function () {
        if (b.classList.contains('ok')) return;
        var s = D.filter(function (x) { return x.id === b.dataset.s; })[0];
        picker.innerHTML = '<div class="pk blk"><b>اختاري الرقم:</b><div>' + s.left.map(function (L) { return '<button data-n="' + L.n + '">' + L.n + '</button>'; }).join('') + '</div></div>';
        picker.classList.remove('hidden');
        picker.querySelectorAll('[data-n]').forEach(function (x) { x.onclick = function () { b.textContent = x.dataset.n; b.dataset.v = x.dataset.n; b.classList.remove('bad'); picker.classList.add('hidden'); }; });
        picker.onclick = function (e) { if (e.target === picker) picker.classList.add('hidden'); };
      };
    });
    document.querySelectorAll('[data-chk]').forEach(function (b) {
      b.onclick = function () {
        var sid = b.dataset.chk, s = D.filter(function (x) { return x.id === sid; })[0], slots = document.querySelectorAll('.slot[data-s="' + sid + '"]'), empty = 0, bad = 0, msg = document.querySelector('[data-msg="' + sid + '"]');
        slots.forEach(function (sl) { if (!sl.dataset.v && !sl.classList.contains('ok')) empty++; });
        if (empty) { msg.innerHTML = '<span class="r">باقي ' + empty + ' خانة فاضية. املئي كل الخانات ثم تحقّقي.</span>'; return; }
        slots.forEach(function (sl) {
          if (sl.classList.contains('ok')) return;
          var a = sl.dataset.a, L = s.left.filter(function (x) { return String(x.n) === a; })[0], w = document.querySelector('[data-why="' + sid + '-' + a + '"]');
          if (sl.dataset.v === a) {
            sl.classList.add('ok'); w.classList.add('hidden');
            if (!firstTry[L.id]) { star(L.id); upDots(L.id); } firstTry[L.id] = 1;
          } else {
            bad++; firstTry[L.id] = 1; sl.classList.add('bad');
            w.firstElementChild.innerHTML = '<div class="whyb">🤔 الرقم ' + sl.dataset.v + ' مو صحيح هنا. ' + L.why + '</div>';
            w.classList.remove('hidden'); delete sl.dataset.v; sl.innerHTML = '&nbsp;';
          }
        });
        if (bad) { msg.innerHTML = '<span class="r">💪 اقرئي الشرح تحت الخانة الحمراء، ثم جرّبي مرّة ثانية.</span>'; play([pick(AGAIN), EN_AGAIN]); }
        else { msg.innerHTML = '<span class="gg">🌟 ممتازة! كل الإجابات صحيحة.</span>'; play([pick(GOOD), pick(EN_GOOD)]); }
      };
    });
    document.querySelectorAll('.op').forEach(function (b) {
      b.onclick = function () {
        var it = BY[b.dataset.it], col = b.closest('.col'), wc = document.querySelector('[data-whyc="' + it.id + '"]');
        if (col.dataset.done) return;
        if (b.dataset.w === it.ok) {
          b.classList.add('g'); col.dataset.done = 1; wc.classList.add('hidden');
          if (!firstTry[it.id]) { star(it.id); upDots(it.id); }
          firstTry[it.id] = 1; play([pick(GOOD)].concat(it.say));
        } else {
          firstTry[it.id] = 1; b.classList.add('bad'); b.disabled = true;
          wc.innerHTML = thumb(it) + '🤔 ' + it.why; wc.classList.remove('hidden'); play([pick(AGAIN)]);
        }
      };
    });
    document.querySelectorAll('[data-bw]').forEach(function (b) {
      b.onclick = function () { // البنت التي لا تكتب: تضغط الكلمة فتنزل في أول خانة فاضية
        var ins = Array.prototype.slice.call(document.querySelectorAll('[data-s="voA"] .win')).filter(function (x) { return !x.disabled; });
        var t = document.activeElement && document.activeElement.classList.contains('win') && !document.activeElement.disabled ? document.activeElement : ins.filter(function (x) { return !x.value; })[0];
        if (t) { t.value = b.dataset.bw; t.focus(); }
      };
    });
    document.querySelectorAll('[data-wchk]').forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.wchk, it = BY[id], inp = document.querySelector('[data-win="' + id + '"]'), lt = document.querySelector('[data-lt="' + id + '"]'), wc = document.querySelector('[data-whyc="' + id + '"]');
        var target = it.ok || it.text, v = inp.value.replace(/\s+/g, ' ').replace(/[.。]$/, '').trim();
        if (!v) { wc.innerHTML = '✏️ اكتبي أولًا في الخانة.'; wc.classList.remove('hidden'); return; }
        if (v.toLowerCase() === target.toLowerCase()) {
          var capNote = it.text && v[0] !== 'I' ? ' تذكّري: <b>I</b> تُكتب كبيرة دائمًا.' : '';
          inp.disabled = true; inp.classList.add('ok'); lt.innerHTML = ''; wc.innerHTML = thumb(it) + '🌟 صحيحة!' + capNote; wc.classList.remove('hidden'); wc.classList.add('okc');
          if (!firstTry[id]) { star(id); upDots(id); } firstTry[id] = 1; play([pick(GOOD)].concat(it.say.slice(0, 1)));
        } else {
          firstTry[id] = 1;
          lt.innerHTML = '<span dir="ltr">' + diff(v, target) + '</span>';
          wc.innerHTML = thumb(it) + '🤔 الحرف الأحمر يحتاج تصحيح (والمربع الأحمر _ حرف ناقص). الكلمة الصحيحة تُكتب هكذا: <b dir="ltr" class="nw">' + target.split('').join(' ') + '</b> . ' + (it.why || '') + ' اسمعيها حرفًا حرفًا من زرّ 🔊 ثم اكتبيها مرّة ثانية.';
          wc.classList.remove('hidden'); play([pick(AGAIN)]);
        }
      };
    });
  }

  // مقارنة حرفًا حرفًا: الأخضر صحيح، الأحمر زائد أو خطأ، والمربع الأحمر حرف ناقص
  function diff(v, t) {
    var a = v.toLowerCase(), b = t.toLowerCase(), n = a.length, m = b.length, L = [], i, j;
    for (i = 0; i <= n; i++) { L.push([]); for (j = 0; j <= m; j++) L[i].push(0); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var h = ''; i = 0; j = 0;
    function ch(c) { return c === ' ' ? '&nbsp;' : c; }
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { h += '<span class="lg">' + ch(v[i]) + '</span>'; i++; j++; }
      else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { h += '<span class="lm">_</span>'; j++; }
      else { h += '<span class="lr">' + ch(v[i]) + '</span>'; i++; }
    }
    return h;
  }

  // ---------- اسمعي الورقة كاملة (من أولها إلى آخرها) ----------
  function listenAll() {
    var q = [];
    D.forEach(function (s) {
      if (s.h) return;
      var el = s.left || s.items || [s.item];
      q.push(s.inst[0], s.inst[1]);
      el.forEach(function (it) {
        q.push({ hl: it.id });
        if (s.type === 'match' && it.say.length >= 4) { // السؤال، معناه، الكلمة المهمة، ثم وقفة للتفكير، ثم الجواب
          q.push(it.say[0], it.say[1], it.say[2], { pause: 3000, think: true }, it.say[3], it.say[4], { pause: 600 });
        } else {
          it.say.forEach(function (x) { q.push(x); }); q.push({ pause: 600 });
        }
      });
    });
    q.push({ hl: null });
    play(q, function () { $('#lis').textContent = '▶️ اسمعي الورقة كاملة'; });
  }

  // ---------- الأزرار ----------
  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); });
    $('#newR').classList.toggle('hidden', m !== 'solve');
    $('#hint').innerHTML = m === 'learn' ? '👆 اضغطي على أي سؤال أو صورة: تسمعين الإنجليزي بهدوء ثم المعنى بالعربي، ويظهر النطق وطريقة الحفظ.' :
      '✏️ حلّي على نفس الورقة. إذا أخطأتِ يظهر الشرح تحت الخانة، ثم جرّبي مرّة ثانية. كل إجابة صحيحة من أول مرّة = نجمة ★';
    render();
  }
  document.querySelectorAll('.mode').forEach(function (b) { b.onclick = function () { setMode(b.dataset.m); }; });
  $('#newR').onclick = function () { round++; render(); window.scrollTo(0, 0); };
  $('#lis').onclick = function () {
    if (playing) { stop(); $('#lis').textContent = '▶️ اسمعي الورقة كاملة'; return; }
    if (mode !== 'learn') setMode('learn');
    $('#lis').textContent = '⏹ أوقفي'; listenAll();
  };
  $('#go').onclick = function () {
    $('#start').classList.add('hidden'); $('#main').classList.remove('hidden');
    play(['بسم الله الرحمن الرحيم.', 'قبل أن نبدأ، نقول معًا: رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ، وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ، وَاجْعَلْ لِي مِنْ لَدُنْكَ سُلْطَانًا نَصِيرًا.', 'أهلًا بكِ في رحلة الإنجليزي! ركّزي واهدئي، ونبدأ خطوةً خطوة.', 'اسمعي الجملة بالإنجليزي، ثم اسمعي معناها بالعربي.']);
  };
  prog(); setMode('learn');
})();
