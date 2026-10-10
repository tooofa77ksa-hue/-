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
  function think(on) { $('#think').textContent = typeof on === 'string' ? on : '🤔 فكّري…'; $('#think').classList.toggle('hidden', !on); }

  // ---------- التقدّم: كل سؤال يحتاج ٣ نجوم (٣ جولات) ليثبت ----------
  var KEY = 'eng_review_v1', S = { m: {}, d: {} };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.m) { S = s0; S.d = S.d || {}; } } catch (e) {}
  // الصناديق: ٠ أحمر (جديد/خطأ) ← ١ أصفر (بعد ١٠ دقائق) ← ٢ أصفر (بعد ٨ ساعات) ← ٣ أخضر ثبت (بعد يومين)
  var GAP = [0, 10 * 60e3, 8 * 3600e3, 2 * 86400e3];
  function due(id) { return (S.d[id] || 0) <= Date.now(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var ALL = [];
  D.forEach(function (s) { (s.left || s.items || (s.item ? [s.item] : [])).forEach(function (it) { ALL.push(it.id); if (s.spell) ALL.push(it.id + 'w'); }); });
  function star(id) { if (!due(id) && (S.m[id] || 0) > 0) { prog(); return; } S.m[id] = Math.min(3, (S.m[id] || 0) + 1); S.d[id] = Date.now() + GAP[S.m[id]]; save(); prog(); }
  function miss(id) { S.m[id] = 0; S.d[id] = 0; save(); prog(); upDots(id); }
  function dots(id) { var n = S.m[id] || 0, h = ''; for (var i = 0; i < 3; i++) h += i < n ? '★' : '☆'; return '<span class="dots b' + n + '" data-dots="' + id + '">' + h + (n < 3 && due(id) && n > 0 ? ' 🔔' : '') + '</span>'; }
  function upDots(id) { var e = document.querySelector('[data-dots="' + id + '"]'); if (e) e.outerHTML = dots(id); }
  function prog() {
    var r = 0, y = 0, g = 0, dn = 0;
    ALL.forEach(function (id) { var n = S.m[id] || 0; if (n >= 3) g++; else if (n) y++; else r++; if (n < 3 && due(id)) dn++; });
    $('#prog').innerHTML = '<span class="box b0">🟥 تحتاج تدريب ' + r + '</span><span class="box b1">🟨 في الطريق ' + y + '</span><span class="box b3">🟩 ثبتت ' + g + '</span>' +
      '<button class="btn sm v" id="revB">📅 مراجعة الآن (' + dn + ')</button><button class="btn sm" id="quickB">⚡ جولة سريعة</button>' +
      '<div class="small">كل سؤال يصعد صندوقًا كلما أجبتِه صحيحًا في وقته: الآن ← بعد ١٠ دقائق ← بعد ٨ ساعات ← ثبت ✔. والخطأ يرجعه للأحمر.</div>';
    $('#revB').onclick = function () { review = true; setMode('solve'); };
    $('#quickB').onclick = quick;
  }

  // ---------- الرسم ----------
  var mode = 'learn', round = 0, firstTry = {}, review = false;
  function secDue(s) { return (s.left || s.items || (s.item ? [s.item] : [])).some(function (it) { return (S.m[it.id] || 0) < 3 && due(it.id) || (s.spell && (S.m[it.id + 'w'] || 0) < 3 && due(it.id + 'w')); }); }
  function sayBtn(list, cls) { return '<button class="say ' + (cls || '') + '" data-say=\'' + JSON.stringify(list).replace(/'/g, '&#39;') + '\'>🔊</button>'; }
  function head(s) {
    return '<div class="sh"><span class="t">' + s.title + '</span>' + sayBtn(s.inst) + '</div><div class="tip">' + s.tip + ' — ' + s.inst[1].replace('المطلوب: ', '') + '</div>';
  }
  function info(it, extra) {
    return '<div class="info"><div><span class="lb">🇸🇦 المعنى</span> ' + it.ar + '</div><div><span class="lb">🗣️ النطق</span> <span class="pr">' + it.pr + '</span></div>' +
      (extra || '') + '<div class="hook">💡 ' + it.hook + '</div>' + '<button class="btn sm rep3" data-rep=\'' + JSON.stringify(it.say[0]).replace(/'/g, '&#39;') + '\'>🗣️ اسمعي وردّدي ٣ مرات</button></div>';
  }
  function render() {
    stop(); firstTry = {};
    var h = '';
    var shown = 0;
    D.forEach(function (s, i) {
      if (s.h) { var nx = D.slice(i + 1); var any = false; for (var k = 0; k < nx.length && !nx[k].h; k++) if (!review || secDue(nx[k])) any = true; if (any) h += '<h2 class="sec">' + s.h + '</h2>'; return; }
      if (review && !secDue(s)) return; shown++;
      h += '<section class="blk" data-s="' + s.id + '">' + head(s) + (mode === 'learn' ? '<button class="cov" data-cov="' + s.id + '">🙈 غطّي الإجابات واسترجعيها</button>' : '') + R[s.type](s) + '</section>';
    });
    if (review) h = '<div class="revbar">📅 مراجعة الآن: الأقسام التي حان وقت مراجعتها فقط. <button class="btn sm w" id="revX">عرض الورقة كاملة</button></div>' + (shown ? h : '<div class="done">🎉 لا توجد أسئلة حان وقتها الآن. ارجعي بعد قليل!</div>');
    if (mode === 'learn' && !review) h += '<div class="teach blk"><b>👩‍🏫 علّمي ماما أو صاحبتك</b><p>اسأليهم هذه الأسئلة، وإذا ما عرفوا اشرحي لهم أنتِ:</p><ol dir="ltr"><li>How many family members do you have?</li><li>My dad\'s brother is my …?</li><li>★★★★★ = ?</li><li>She → ?</li><li>🪫 = ?</li><li>Spell: shy</li></ol></div>';
    if (mode === 'learn' && !review && window.SONG) {
      h += '<section class="blk song" id="song"><div class="sh"><span class="t">🎵 أغنية الورقة — My Family Song</span></div>' +
        '<div class="benefit"><b>💡 فائدة الأغنية</b><br>تجمع كلمات الورقة كلّها في لحنٍ واحد يتكرّر. اللحن والإيقاع يساعدان على حفظ الكلمات وتذكّرها بسهولة لمدّة طويلة، وبعد كل جملة إنجليزية معناها بالعربي، فتفهمين وأنتِ تغنّين. بعض الكلمات أُضيفت لتوضيح المعنى فقط، مثل <bdi>take your time</bdi> (على مهلك) و<bdi>battery low</bdi> (البطارية فاضية)، وليست من أسئلة الورقة.</div>' +
        (window.SONG_FILE ? '<audio controls preload="none" src="' + window.SONG_FILE + '"></audio>' : '<div class="note">🎧 صوت الأغنية يُضاف هنا قريبًا.</div>') +
        window.SONG.map(function (p) { return '<div class="part"><span class="pt">' + p[0] + '</span>' + p[1].map(function (l) { var k = l.search(/[\u0621-\u064A]/); if (k < 0) return '<div class="en">' + l + '</div>'; if (k === 0) return '<div class="arl">' + l + '</div>';
          return '<div class="en">' + l.slice(0, k).replace(/[,\s]+$/, '') + '</div><div class="arl">' + l.slice(k) + '</div>'; }).join('') + '</div>'; }).join('') + '</section>';
    }
    h += '<div class="posters"><img src="img/poster_ar.jpg" alt=""><img src="img/poster_en.jpg" alt=""></div><div class="bye">بالتوفيق My dear students 💗</div>';
    $('#paper').innerHTML = h;
    bind();
  }
  var FX = { fishing: '🐟', beach: '🫧', helping: '💗', grandparents: '❤️', lazy: '💤', tired: '🪫', bus: '💨', pizza: '♨️', shy: '🙈', chatty: '💬', strong: '💪', cycling: '' };
  function fx(k) { return FX[k] ? '<span class="fx">' + FX[k] + '</span>' : ''; }
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
        var top = it.img ? '<img src="img/' + it.img + '.jpg" alt="">' + fx(it.img) : it.pic;
        var o = opts.map(function (w, i) {
          var cls = mode === 'learn' && w === it.ok ? ' g' : '';
          return '<button class="op' + cls + '" data-it="' + it.id + '" data-w="' + w + '">' + (i + 1) + '- ' + w + '</button>';
        }).join('');
        return '<div class="col" data-k="' + it.id + '"><div class="pic' + (it.img ? ' an-' + it.img : '') + '">' + top + sayBtn(it.say, 'sm') + '</div>' + o + (mode === 'solve' ? dots(it.id) + (s.spell ? '<input class="win" data-win="' + it.id + 'w" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="✏️ اكتبيها"><button class="btn sm g wchk" data-wchk="' + it.id + 'w">✔</button>' + dots(it.id + 'w') + '<div class="lt" data-lt="' + it.id + 'w"></div>' : '') : '') + '</div>';
      }).join('');
      var det = mode === 'learn' ? s.items.map(function (it) { return '<div class="det hidden" data-det="' + it.id + '">' + '<b dir="ltr">' + it.ok + '</b>' + info(it) + '</div>'; }).join('') : '';
      return '<div class="grid' + (s.pics ? ' pics' : '') + '" dir="ltr">' + cols + '</div>' + det + whys(s.items) + (s.spell ? whys(s.items.map(function (it) { return BY[it.id + 'w']; })) : '');
    },
    write: function (s) {
      var bank = '<div class="bank" dir="ltr">( ' + s.bank.map(function (w) { return '<button class="bw" data-bw="' + w + '">' + w + '</button>'; }).join(' – ') + ' )</div>';
      var cols = s.items.map(function (it) {
        var low = mode === 'learn' ? '<div class="ans g">' + it.ok + '</div>' :
          '<input class="win" data-win="' + it.id + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="✏️ اكتبي هنا"><button class="btn sm g wchk" data-wchk="' + it.id + '">✔</button>' + dots(it.id) + '<div class="lt" data-lt="' + it.id + '"></div>';
        return '<div class="col" data-k="' + it.id + '"><div class="pic an-' + it.img + '"><img src="img/' + it.img + '.jpg" alt="">' + fx(it.img) + sayBtn(it.say, 'sm') + '</div>' + low + '</div>';
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
    var rx = $('#revX'); if (rx) rx.onclick = function () { review = false; render(); };
    if (mode === 'learn') {
      document.querySelectorAll('[data-k]').forEach(function (r) {
        r.onclick = function () { var id = r.dataset.k, sec = r.closest('section'); if (sec && sec.classList.contains('cover')) { r.classList.add('rev'); var it0 = BY[id];
            if (it0.n) sec.querySelectorAll('td.r b.g').forEach(function (g) { if (g.textContent === String(it0.n)) g.parentNode.classList.add('rev'); }); }
          var d = document.querySelector('[data-det="' + id + '"]'); if (d) d.classList.toggle('hidden'); play(BY[id].say); };
      });
      document.querySelectorAll('[data-rep]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var t = JSON.parse(b.dataset.rep), q = []; for (var i = 0; i < 3; i++) q.push(t, { pause: 2200, think: '🗣️ قوليها بصوت عالٍ!' }); play(q); }; });
      document.querySelectorAll('[data-cov]').forEach(function (b) { b.onclick = function () { var sec = b.closest('section'), on = sec.classList.toggle('cover'); sec.querySelectorAll('.rev').forEach(function (x) { x.classList.remove('rev'); });
        b.textContent = on ? '👀 أظهري الإجابات' : '🙈 غطّي الإجابات واسترجعيها'; if (on) play(['فكّري قليلًا، ثم أجيبي.']); }; });
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
            bad++; if (!firstTry[L.id]) miss(L.id); firstTry[L.id] = 1; sl.classList.add('bad');
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
          if (!firstTry[it.id]) miss(it.id); firstTry[it.id] = 1; b.classList.add('bad'); b.disabled = true;
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
        if (!v) { wc.innerHTML = '✏️ اكتبي الكلمة في الخانة، ثم اضغطي ✔ تحقّقي.'; wc.classList.remove('hidden'); play(['اكتبي الكلمة في الخانة، ثم اضغطي تحقّقي.']); return; }
        if (v.toLowerCase() === target.toLowerCase()) {
          var capNote = it.text && v[0] !== 'I' ? ' تذكّري: <b>I</b> تُكتب كبيرة دائمًا.' : '';
          inp.disabled = true; inp.classList.add('ok'); lt.innerHTML = ''; wc.innerHTML = thumb(it) + '🌟 صحيحة!' + capNote; wc.classList.remove('hidden'); wc.classList.add('okc');
          if (!firstTry[id]) { star(id); upDots(id); } firstTry[id] = 1; play([pick(GOOD)].concat(it.say.slice(0, 1), ['أحسنتِ! الآن قوليها بصوتٍ عالٍ مرّة.']));
        } else {
          if (!firstTry[id]) miss(id); firstTry[id] = 1;
          lt.innerHTML = '<span dir="ltr">' + diff(v, target) + '</span>';
          wc.innerHTML = thumb(it) + '🤔 الحرف الأحمر يحتاج تصحيح (والمربع الأحمر _ حرف ناقص). الكلمة الصحيحة تُكتب هكذا: <b dir="ltr" class="nw">' + target.split('').join(' ') + '</b> . ' + (it.why || '') + ' اسمعيها حرفًا حرفًا من زرّ 🔊 ثم اكتبيها مرّة ثانية.';
          wc.classList.remove('hidden'); play(['انتبهي للحرف الملوّن، وجرّبي مرّةً أخرى.']);
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

  // ---------- جولة سريعة: أسئلة مخلوطة من كل الورقة ----------
  function strip(h) { return String(h).replace(/<[^>]+>/g, '').replace(/…+|\.{3,}/g, '…'); }
  function card(it) { return { id: it.id, en: it.ok || it.text || (it.ans && it._s.type === 'match' && it._s.id === 'grB' ? strip(it.html) + ' → ' + strip(it.ans) : strip(it.html)), ar: String(it.ar).replace(/<[^>]+>/g, ''), img: it.img, say: [it.say[0]] }; }
  function quick() {
    stop(); var pool = shuffle(ALL.filter(function (id) { return BY[id] && BY[id].say && !/w$/.test(id); }).map(function (id) { return card(BY[id]); })), list = pool.slice(0, 8), i = 0, ok = 0;
    var ov = $('#quick'); ov.classList.remove('hidden');
    function show() {
      if (i >= list.length) { ov.innerHTML = '<div class="qc blk"><div class="big">🏁</div><b>' + ok + ' من ' + list.length + ' صحيحة!</b><p>الأسئلة الخاطئة رجعت للصندوق الأحمر 🟥 لتتكرر أكثر.</p><button class="btn g" id="qx">تمام</button></div>'; $('#qx').onclick = function () { ov.classList.add('hidden'); render(); }; play([ok >= 6 ? pick(GOOD) : pick(AGAIN)]); return; }
      var c = list[i], opts = shuffle([c.ar].concat(shuffle(pool.filter(function (x) { return x.ar !== c.ar; })).slice(0, 2).map(function (x) { return x.ar; })));
      ov.innerHTML = '<div class="qc blk"><div class="qn">' + (i + 1) + ' / ' + list.length + '</div>' + (c.img ? '<img src="img/' + c.img + '.jpg" alt="">' : '') + '<div class="qen" dir="ltr">' + c.en + ' ' + sayBtn(c.say, 'sm') + '</div><b>ما معناها؟</b><div class="qo">' + opts.map(function (o) { return '<button class="op">' + o + '</button>'; }).join('') + '</div><div class="qm"></div><button class="btn w sm" id="qx">✖ إغلاق</button></div>';
      ov.querySelector('[data-say]').onclick = function () { play(c.say); };
      $('#qx').onclick = function () { stop(); ov.classList.add('hidden'); render(); };
      var tried = false;
      ov.querySelectorAll('.qo .op').forEach(function (b) { b.onclick = function () {
        if (b.textContent === c.ar) { b.classList.add('g'); if (!tried) { ok++; star(c.id); } play([pick(GOOD)]); setTimeout(function () { i++; show(); }, 1600); ov.querySelectorAll('.qo .op').forEach(function (x) { x.disabled = true; }); }
        else { b.classList.add('bad'); b.disabled = true; if (!tried) miss(c.id); tried = true; ov.querySelector('.qm').innerHTML = '🤔 اسمعيها مرّة ثانية وفكّري: ' + c.en; play(c.say); }
      }; });
      play(c.say);
    }
    show();
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
  document.querySelectorAll('.mode').forEach(function (b) { b.onclick = function () { review = false; setMode(b.dataset.m); }; });
  $('#songB').onclick = function () { if (mode !== 'learn' || review) { review = false; setMode('learn'); } var e = $('#song'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
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
