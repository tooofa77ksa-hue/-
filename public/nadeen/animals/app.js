(function () {
  var Z = window.Z, app = document.getElementById('app');
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function plain(s) { return String(s).replace(/[\u{1F300}-\u{1FAFF}☀-➿⭐️]/gu, '').replace(/\//g, ' أو '); }

  // ---------- saved player (each device keeps its own) ----------
  var PLAYERS = [['nadeen', 'نادين', 'f'], ['saleh', 'صالح', 'm'], ['malak', 'ملك يوسف', 'f'], ['rawaf', 'رواف', 'm']];
  var ACTIVE = ''; try { ACTIVE = localStorage.getItem('zoo_active') || ''; } catch (e) {}
  var ME = PLAYERS.filter(function (p) { return p[0] === ACTIVE; })[0] || null, MALE = !!(ME && ME[2] === 'm');
  var KEY = 'zoo_player_v2_' + ACTIVE, P = null;
  try { P = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!P && ACTIVE === 'nadeen') { try { P = JSON.parse(localStorage.getItem('zoo_player_v1') || 'null'); } catch (e) {} }   // Nadeen's old save
  if (P && ME) { P.name = ME[1]; P.srs = P.srs || {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }


  // ---------- who is playing (4 players, each has her/his own saved game) ----------
  function who() {
    app.innerHTML = '<div class="wrap"><h1 class="t">🐾 مغامرة في عالم الحيوانات</h1><div class="sub">من سيلعب الآن؟ اضغط على اسمك</div><div class="worlds">' +
      PLAYERS.map(function (p, i) { return '<button class="tile blk" data-p="' + p[0] + '" style="--c:' + ['#FF5FA2', '#22A6E8', '#7B5CFF', '#22C55E'][i] + '"><span class="ic">' + (p[2] === 'f' ? '👧' : '👦') + '</span><span class="tt"><b>' + p[1] + '</b></span></button>'; }).join('') + '</div></div>';
    [].forEach.call(app.querySelectorAll('[data-p]'), function (b) { b.onclick = function () { try { localStorage.setItem('zoo_active', b.dataset.p); } catch (e) {} location.reload(); }; });
  }
  // boys get masculine wording (the text was written for girls)
  var MREP = [['رائعةٌ', 'رائعٌ'], ['البطلاتُ', 'الأبطالُ'], ['يتدرَّبن', 'يتدرَّبون'], ['البطلةُ', 'البطلُ'], ['بطلةُ', 'بطلُ'], ['بطلة', 'بطل'], ['المستكشفةُ', 'المستكشفُ'], ['مستكشفة', 'مستكشف'], ['قريبة', 'قريب'],
    ['أعيدي', 'أعِد'], ['أنتِ', 'أنتَ'], ['ابدئي', 'ابدأ'], ['فقِّسي', 'فقِّسْ'], ['أحسنتِ', 'أحسنتَ'], ['ركِّزي', 'ركِّزْ'], ['تنتظرُكِ', 'تنتظرُكَ'], ['صمِّمي', 'صمِّمْ'], ['شخصيّتَكِ', 'شخصيّتَكَ'], ['اكتبي', 'اكتبْ'], ['أوصلي', 'أوصِلْ'],
    ['اهربي', 'اهرُبْ'], ['أخطأتِ', 'أخطأتَ'], ['أضفتِ', 'أضفتَ'], ['مجموعتِكِ', 'مجموعتِكَ'], ['نجوتِ', 'نجوتَ'], ['عقلُكِ', 'عقلُكَ'], ['وفكِّري', 'وفكِّرْ'], ['فكِّري', 'فكِّرْ'], ['جرِّبي', 'جرِّبْ'], ['حاولي', 'حاوِلْ'],
    ['تعرفين', 'تعرفُ'], ['تقرِّبُكِ', 'تقرِّبُكَ'], ['اسمُكِ', 'اسمُكَ'], ['تحتاجين', 'تحتاجُ'], ['اسمَكِ', 'اسمَكَ'], ['واعرفي', 'واعرِفْ'], ['اسمعي', 'اسمَعْ'], ['تريدين', 'تريدُ'], ['تتقدَّمين', 'تتقدَّمُ'], ['أصبتِ', 'أصبتَ'],
    ['صوِّري', 'صوِّرْ'], ['اقلبي', 'اقلِبْ'], ['بينكِ', 'بينَكَ'], ['لتجمعي', 'لتجمعَ'], ['تمنحُكِ', 'تمنحُكَ'], ['أرسليها', 'أرسِلْها'], ['صديقتك', 'صديقك'], ['تفتحينه', 'تفتحُه'], ['اختاري', 'اختَرْ'], ['شاهدي', 'شاهِدْ'],
    ['احفظي', 'احفظْ'], ['انظري', 'انظُرْ'], ['تذكّري', 'تذكّرْ'], ['استمعي', 'استمعْ'], ['أكملي', 'أكمِلْ'], ['حدّدي', 'حدِّدْ'], ['اضغطي', 'اضغطْ'], ['لاحظي', 'لاحِظْ'], ['كرّري', 'كرِّرْ'], ['أجيبي', 'أجِبْ'], ['ساعدي', 'ساعِدْ'], ['اعرفي', 'اعرِفْ'], ['جمعتِ', 'جمعتَ'], ['ربحتِ', 'ربحتَ'], ['عرفتِ', 'عرفتَ'], ['نجحتِ', 'نجحتَ'], ['أنهيتِ', 'أنهيتَ'], ['اقرئي', 'اقرأْ'], ['رتّبي', 'رتِّبْ'], ['صلي', 'صِلْ'], ['وصّلي', 'وصِّلْ'], ['تعلّمي', 'تعلَّمْ'], ['اختبري', 'اختبِرْ'], ['افتحي', 'افتحْ'], ['ارجعي', 'ارجِعْ'], ['أكملي', 'أكمِلْ'], ['كرّري', 'كرِّرْ'], ['عرفتُها', 'عرفتُها'], ['اضغطي', 'اضغطْ'], ['جرّبي', 'جرِّبْ'], ['تذكّري', 'تذكَّرْ'], ['راجعي', 'راجِعْ'], ['أتقنتِ', 'أتقنتَ'], ['قرأتِ', 'قرأتَ'], ['أنهيتِ', 'أنهيتَ'], ['نجحتِ', 'نجحتَ'], ['لعبتِ', 'لعبتَ'], ['تحتاجين', 'تحتاجُ'], ['استمعي', 'استمعْ'], ['شاهدي', 'شاهِدْ']];
  var D = '[\\u064B-\\u0652\\u0640]*';
  var MR = MREP.map(function (p) { return [new RegExp(p[0].split('').join(D)), p[1]]; });
  function masc(t) { if (!MALE) return t; for (var i = 0; i < MR.length; i++) t = t.replace(new RegExp(MR[i][0].source, 'g'), MR[i][1]); return t; }
  if (MALE) {
    var walk = function (n) { if (n.nodeType === 3) { var v = masc(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } else if (n.nodeType === 1) { if (n.placeholder) n.placeholder = masc(n.placeholder); if (n.title) n.title = masc(n.title); for (var c = n.firstChild; c; c = c.nextSibling) walk(c); } };
    new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === 'characterData') walk(m.target); else [].forEach.call(m.addedNodes, walk); }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ---------- blocky avatar ----------
  var HAIR = ['#3B2314', '#7A4A24', '#E8B04B', '#1B1B1B', '#C2410C'], SHIRT = ['#FF5FA2', '#7B5CFF', '#22C3EE', '#FFC93C', '#22C55E'];
  var ACC = [['bow', '🎀', 0], ['none', '🚫', 0], ['crown', '👑', 15], ['glasses', '🕶️', 30], ['cap', '🧢', 45], ['wings', '🦋', 70]];
  function avatar(c, run) {
    c = c || { hair: 0, shirt: 0, acc: 'bow' };
    var h = HAIR[c.hair], s = SHIRT[c.shirt], L = run ? 'transform="rotate(-18 34 92)"' : '', R = run ? 'transform="rotate(18 46 92)"' : '';
    var acc = { bow: '<path d="M22 6 l12 7 l-12 7z M58 6 l-12 7 l12 7z" fill="#FF5FA2" stroke="#1E2340" stroke-width="2"/><circle cx="40" cy="13" r="5" fill="#FF8DC0" stroke="#1E2340" stroke-width="2"/>',
      crown: '<path d="M24 12 l6 -10 l5 8 l5 -10 l5 10 l5 -8 l6 10z" fill="#FFC93C" stroke="#1E2340" stroke-width="2"/>',
      glasses: '<rect x="25" y="30" width="12" height="8" rx="2" fill="#1E2340"/><rect x="43" y="30" width="12" height="8" rx="2" fill="#1E2340"/><rect x="37" y="32" width="6" height="2" fill="#1E2340"/>',
      cap: '<path d="M20 20 q20 -18 40 0 v4 h-40z" fill="#22C3EE" stroke="#1E2340" stroke-width="2"/><rect x="50" y="20" width="18" height="5" rx="2" fill="#0EA5E9" stroke="#1E2340" stroke-width="2"/>',
      wings: '', none: '' }[c.acc] || '';
    var wings = c.acc === 'wings' ? '<path d="M18 56 q-18 -14 -12 8 q2 14 14 2z M62 56 q18 -14 12 8 q-2 14 -14 2z" fill="#C4B5FD" stroke="#1E2340" stroke-width="2"/>' : '';
    return '<svg viewBox="0 0 80 120">' + wings +
      '<g ' + L + '><rect x="26" y="86" width="13" height="28" rx="3" fill="#2B3A67" stroke="#1E2340" stroke-width="2.5"/></g>' +
      '<g ' + R + '><rect x="41" y="86" width="13" height="28" rx="3" fill="#2B3A67" stroke="#1E2340" stroke-width="2.5"/></g>' +
      '<rect x="12" y="50" width="12" height="32" rx="4" fill="#F2C29B" stroke="#1E2340" stroke-width="2.5"/><rect x="56" y="50" width="12" height="32" rx="4" fill="#F2C29B" stroke="#1E2340" stroke-width="2.5"/>' +
      '<rect x="22" y="48" width="36" height="42" rx="6" fill="' + s + '" stroke="#1E2340" stroke-width="2.5"/>' +
      '<rect x="20" y="12" width="40" height="38" rx="8" fill="#F7D3B1" stroke="#1E2340" stroke-width="2.5"/>' +
      (MALE ? '<path d="M18 26 q0 -20 22 -20 q22 0 22 20 q-22 -8 -44 0z" fill="' + h + '" stroke="#1E2340" stroke-width="2.5"/>' : '<path d="M18 30 q0 -22 22 -22 q22 0 22 22 v18 h-6 v-24 q-16 4 -32 0 v24 h-6z" fill="' + h + '" stroke="#1E2340" stroke-width="2.5"/>') +
      '<circle cx="32" cy="33" r="3.2" fill="#1E2340"/><circle cx="48" cy="33" r="3.2" fill="#1E2340"/><path d="M33 41 q7 6 14 0" fill="none" stroke="#1E2340" stroke-width="2.5" stroke-linecap="round"/>' +
      (MALE ? '' : '<circle cx="27" cy="39" r="3" fill="#FF9EB5" opacity=".7"/><circle cx="53" cy="39" r="3" fill="#FF9EB5" opacity=".7"/>') + acc + '</svg>';
  }

  // ---------- voice and sounds ----------
  var cur = null, last = null;
  function play(fn) { last = fn; fn(); }   // everything played through play() can be repeated
  var rb = document.createElement('button'); rb.id = 'rep'; rb.innerHTML = '🔁<small>أعيدي</small>'; rb.title = 'أعيدي الصوت';
  rb.onclick = function () { if (last) last(); }; document.body.appendChild(rb);
  function stop() { if (cur) { cur.pause(); cur = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  // recorded voice (voice/<clip>.mp3) when the sentence was recorded, otherwise the device voice
  function vkey(w) { return String(w).replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^\u0621-\u064A]/g, ''); }
  function speak(t, then) {
    t = masc(t);
    var f = MALE ? null : (window.VMAP || {})[vkey(plain(t))];
    if (f) { stop(); var a = new Audio('voice/' + f + '.mp3'); cur = a; a.onended = function () { cur = null; if (then) then(); }; a.play().catch(function () { tts(t); }); return; }
    tts(t); if (then) setTimeout(then, 1800);
  }
  function tts(t) {
    if (!window.speechSynthesis) return; speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(plain(t)); u.lang = 'ar-SA'; u.rate = .92;
    var v = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); }); if (v.length) u.voice = v[0];
    speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  function sound(id, fallback, btn, then) {   // real recording sfx/<id>.mp3 when present
    stop(); if (btn) btn.classList.add('on');
    var a = new Audio('sfx/' + id + '.mp3'); cur = a;
    var off = function () { if (btn) btn.classList.remove('on'); };
    a.onended = function () { off(); if (then) setTimeout(then, 250); }; a.onerror = function () { off(); speak(fallback); };
    a.play().catch(function () { off(); speak(fallback); });
  }
  function confetti(n) { var fx = document.getElementById('fx'); for (var i = 0; i < (n || 10); i++) { var e = document.createElement('i'); e.textContent = pick(['⭐', '✨', '💖', '🐾']); e.style.left = Math.random() * 100 + 'vw'; e.style.animationDelay = Math.random() * .4 + 's'; fx.appendChild(e); setTimeout(function (x) { x.remove(); }, 2700, e); } }
  // phrases that call each girl by her own name ({n})
  var GOOD = ['أحسنتِ يا {n}! 🌟', 'رائعةٌ يا بطلة {n}! 👏', 'إجابةٌ ذكيّة يا {n}! 💡', 'المستكشفةُ {n} لا يفوتُها شيء! 🔍', '{n} بطلةُ عالمِ الحيوانات! 🏆',
    'ممتازة يا {n}! الحيواناتُ فخورةٌ بكِ 🦁', 'هكذا تفعلُ البطلات يا {n}! ⭐', 'عقلُكِ لامعٌ يا {n}! ✨'];
  var AGAIN = ['ليست هذه يا {n}، فكِّري مرّةً أخرى 💪', 'قريبة يا {n}! جرِّبي إجابةً ثانية 🔍', 'البطلةُ {n} لا تستسلم، حاولي من جديد 🌱', 'ركِّزي يا {n}، أنتِ تعرفين الجواب ⭐'];
  var HELLO = ['أهلًا يا بطلة {n}! 🦸‍♂️ أيُّ عالمٍ نستكشفُ اليوم؟', 'مرحبًا يا مستكشفة {n}! 🧭 الحيواناتُ تنتظرُكِ', 'هيّا يا {n}! 🌟 كلُّ إجابةٍ تقرِّبُكِ من التاج 👑', 'يا {n}، أنتِ بطلةُ الغابة اليوم! 🌳'];
  function nm(s) { return s.replace('{n}', P.name); }

  // ---------- top bar ----------
  function bar(back) {
    return '<div class="bar">' + (back ? '<button class="back blk" id="bk">→</button>' : '') +
      '<div class="me blk">' + avatar(P) + '<b>' + P.name + '</b></div><div class="sp"></div>' +
      '<div class="coin blk">⭐ ' + AR(P.stars) + '</div><div class="coin blk" style="background:#FFE4F1">🐾 ' + AR(P.coll.length) + '</div></div>';
  }
  function wireBack() { var b = document.getElementById('bk'); if (b) b.onclick = map; }

  // ---------- profile / avatar maker ----------
  function maker(edit) {
    var c = P ? { name: P.name, hair: P.hair, shirt: P.shirt, acc: P.acc } : { name: ME ? ME[1] : '', hair: 0, shirt: 0, acc: MALE ? 'none' : 'bow' };
    var stars = P ? P.stars : 0;
    function draw() {
      app.innerHTML = '<div class="wrap"><h1 class="t">🐾 مغامرة في عالم الحيوانات</h1><div class="sub">صمِّمي شخصيّتَكِ، ثمَّ ابدئي المغامرة!</div>' +
        '<div class="maker"><div class="stage blk">' + avatar(c) + '</div><div class="blk" style="padding:14px">' +
        '<div class="row"><label>اسمُكِ</label><input class="name" id="nm" maxlength="14" readonly placeholder="اكتبي اسمك" value="' + c.name + '"></div>' +
        '<div class="row"><label>لونُ الشَّعر</label><div class="sw">' + HAIR.map(function (x, i) { return '<button data-h="' + i + '" class="' + (c.hair === i ? 'on' : '') + '" style="background:' + x + '"></button>'; }).join('') + '</div></div>' +
        '<div class="row"><label>لونُ القميص</label><div class="sw">' + SHIRT.map(function (x, i) { return '<button data-s="' + i + '" class="' + (c.shirt === i ? 'on' : '') + '" style="background:' + x + '"></button>'; }).join('') + '</div></div>' +
        '<div class="row"><label>الإكسسوار <small style="font:600 13px R;color:#5B6280">(تفتحينه بالنجوم ⭐)</small></label><div class="sw">' + ACC.map(function (a) { var lk = stars < a[2]; return '<button data-a="' + a[0] + '" class="' + (c.acc === a[0] ? 'on ' : '') + (lk ? 'lock' : '') + '" title="' + (lk ? AR(a[2]) + ' نجمة' : '') + '">' + (lk ? '🔒' : a[1]) + '</button>'; }).join('') + '</div></div>' +
        '<button class="btn g" id="go" style="width:100%;margin-top:10px">' + (edit ? 'حفظ ✓' : 'ابدئي المغامرة ▶') + '</button></div></div></div>';
      document.getElementById('nm').oninput = function () { c.name = this.value; };
      if (!edit && !maker.said) { maker.said = 1; setTimeout(function () { play(function () { speak('أهلًا بكِ في مغامرةِ عالمِ الحيوانات!', function () { speak('صمِّمي شخصيّتَكِ، ثمَّ ابدئي المغامرة.'); }); }); }, 400); }
      [].forEach.call(app.querySelectorAll('[data-h]'), function (b) { b.onclick = function () { c.hair = +b.dataset.h; draw(); }; });
      [].forEach.call(app.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { c.shirt = +b.dataset.s; draw(); }; });
      [].forEach.call(app.querySelectorAll('[data-a]'), function (b) { b.onclick = function () { if (b.classList.contains('lock')) { speak('تحتاجين ' + b.title + ' لفتحه'); return; } c.acc = b.dataset.a; draw(); }; });
      document.getElementById('go').onclick = function () {
        var n = (document.getElementById('nm').value || '').trim(); if (!n) { document.getElementById('nm').focus(); speak('اكتبي اسمَكِ أوّلًا'); return; }
        P = P || { stars: 0, best: {}, coll: [], srs: {} }; P.name = ME ? ME[1] : n; P.hair = c.hair; P.shirt = MALE && !P.sd ? 1 : c.shirt; P.sd = 1; P.acc = c.acc; save(); map();
      };
    }
    draw();
  }

  // ---------- world map ----------
  var W = [
    ['wr', '🔁', 'مراجعةُ اليوم', 'ما يحتاجُ أن تراجعَه', '#F59E0B', function () { reviewWorld(); }],
    ['w1', '🦁', 'أصواتُ الحيوانات', 'اسمعي الصوت واعرفي اسمه', '#FF8A3D', function () { soundsWorld(); }],
    ['w2', '🌬️', 'أصواتٌ من حولنا', 'الريح والمطر والبحر والنار', '#22A6E8', function () { thingsWorld(); }],
    ['w3', '🥚', 'فقِّسي البيضة', 'أسماءُ صغارِ الحيوانات', '#FF5FA2', function () { eggWorld(); }],
    ['w4', '🏠', 'أوصلي الحيوانَ لبيته', 'أسماءُ بيوتِ الحيوانات', '#22C55E', function () { homesWorld(); }],
    ['w5', '💞', 'لعبةُ الذاكرة', 'الذَّكرُ والأنثى', '#7B5CFF', function () { memoryWorld(); }],
    ['w6', '🏃‍♀️', 'اهربي من الذئب!', 'تحدٍّ سريعٌ من كلِّ العوالم', '#E11D48', function () { runWorld(); }],
  ];
  function map() {
    stop(); var dn = dueKeys().length; W[0][3] = dn ? ('عندك ' + AR(dn) + ' للمراجعة اليوم 🔔') : 'لا مراجعة اليوم 🌟';
    app.innerHTML = '<div class="wrap">' + bar(false) + '<h1 class="t">🗺️ عوالمُ المغامرة</h1><div class="hello blk">' + nm(pick(HELLO)) + '</div><div class="sub">كلُّ إجابةٍ صحيحة = نجمة ⭐</div>' +
      '<div class="worlds">' + W.map(function (w, i) { var b = P.best[w[0]] || 0; return '<button class="tile blk" data-w="' + i + '" style="--c:' + w[4] + '"><span class="ic">' + w[1] + '</span><span><b>' + w[2] + '</b><small>' + w[3] + '</small></span><span class="st">' + '⭐'.repeat(b) + '☆'.repeat(3 - b) + '</span></button>'; }).join('') + '</div>' +
      '<div class="nav" style="margin-top:16px"><button class="btn w" id="col">🐾 حيواناتي</button><button class="btn w" id="ed">👗 شخصيّتي</button><button class="btn w" id="sw">🔀 لاعبٌ آخر</button></div>' +
      '<button class="btn p" id="reset" style="width:100%;margin-top:14px">🔄 ابدئي كلَّ شيءٍ من جديد</button></div>';
    [].forEach.call(app.querySelectorAll('[data-w]'), function (b) { b.onclick = function () { W[+b.dataset.w][5](); }; });
    document.getElementById('reset').onclick = function () {
      if (!confirm('هل تريدين مسحَ كلِّ النجوم والعوالم والحيوانات، والبدءَ من جديد؟')) return;
      P.stars = 0; P.best = {}; P.coll = []; P.srs = {}; if (P.acc !== 'none') P.acc = 'bow'; save(); map();
      play(function () { speak('بدأنا من جديد! هيّا يا ' + P.name + '، المغامرةُ تنتظرُكِ.'); });
    };
    document.getElementById('sw').onclick = function () { try { localStorage.removeItem('zoo_active'); } catch (e) {} location.reload(); }; document.getElementById('col').onclick = collection; document.getElementById('ed').onclick = function () { maker(true); };
    window.scrollTo(0, 0);
  }

  // ---------- shared quiz engine ----------
  // item: {head(html), say:{id,text}, ask, opts:[...], ans, why, img, onRight(fn) , houses:bool}
  function quiz(wid, title, items, opt) {
    opt = opt || {};
    var qi = 0, score = 0, wrongs = [], list = items;
    function show() {
      stop(); var it = list[qi], tried = false;
      var o = shuffle(it.opts);
      app.innerHTML = '<div class="wrap">' + bar(true) + '<h1 class="t">' + title + '</h1>' +
        '<div class="prog">' + list.map(function (_, k) { return '<i class="' + (k < qi ? 'd' : k === qi ? 'c' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="q blk">' + (it.say ? '<button class="say" id="say">🔊</button>' : '') + it.head + '<div class="big">' + it.ask + '</div>' +
        (it.houses ? '<div class="street">' + o.map(function (x, k) { return '<button class="house" data-k="' + k + '" style="--hc:' + ['#FDE68A', '#BFDBFE', '#FBCFE8'][k % 3] + '"><span>🏠</span>' + x + '</button>'; }).join('') + '</div>'
          : '<div class="opts">' + o.map(function (x, k) { return '<button class="opt" data-k="' + k + '">' + x + '</button>'; }).join('') + '</div>') +
        '<div id="fb"></div></div><div class="nav"><span></span><button class="btn v hidden" id="nx">' + (qi < list.length - 1 ? 'التالي ←' : 'النتيجة 🏆') + '</button></div></div>';
      wireBack();
      var say = document.getElementById('say');
      var askIt = say ? function () { sound(it.say.id, it.say.text, say, function () { speak(it.askSay || it.ask); }); } : function () { speak(it.askSay || it.ask); };
      if (say) say.onclick = function () { play(askIt); };
      setTimeout(function () { play(askIt); }, 350);
      if (it.onShow) it.onShow();
      [].forEach.call(app.querySelectorAll('[data-k]'), function (b) {
        b.onclick = function () {
          var v = o[+b.dataset.k], ok = v === it.ans;
          if (!ok && !tried && o.length > 2) { tried = true; if (it.srs) srsRec(it.srs, false); b.disabled = true; b.classList.add('wrong'); var m = nm(pick(AGAIN)); document.getElementById('fb').innerHTML = '<div class="again">' + m + '</div>'; play(function () { speak(m, function () { askIt(); }); }); return; }
          [].forEach.call(app.querySelectorAll('[data-k]'), function (x) { x.disabled = true; if (o[+x.dataset.k] === it.ans) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          var first = !tried && ok; if (it.srs && !tried) srsRec(it.srs, ok); if (first) { score++; P.stars++; save(); confetti(8); }
          if (!first) wrongs.push(it);
          var head = ok ? nm(pick(GOOD)) : 'الإجابةُ الصحيحة: ' + it.ans;
          document.getElementById('fb').innerHTML = '<div class="why"><b>' + (ok ? '✅ ' : '💡 ') + head + '</b>' + (it.why ? 'لماذا؟ ' + it.why : '') + (it.img ? '<img src="img/' + it.img + '.jpg" alt="">' : '') + (it.extra || '') + '</div>';
          var onR2 = ok && it.onRight2 ? it.onRight2 : null;
          play(function () { speak(head, function () { speak(it.whyLine || it.why || '', onR2); }); });
          if (ok && it.onRight) it.onRight();
          document.getElementById('nx').classList.remove('hidden');
          document.getElementById('nx').scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
      });
      document.getElementById('nx').onclick = function () { qi++; qi < list.length ? show() : done(); };
      window.scrollTo(0, 0);
    }
    function done() {
      var r = score / list.length, st = r >= .9 ? 3 : r >= .6 ? 2 : 1;
      if (list === items) { P.best[wid] = Math.max(P.best[wid] || 0, st); save(); }
      achievement(title, st, score, list.length, wrongs, function () { list = wrongs; wrongs = []; qi = 0; score = 0; show(); }, function () { (opt.again || map)(); });
    }
    show();
  }
  function achievement(title, st, score, n, wrongs, fix, again) {
    stop(); if (st >= 2) confetti(26);
    var msg = st === 3 ? 'البطلةُ ' + P.name + ' أنهت العالمَ بثلاثِ نجوم! 🏆' : st === 2 ? 'أحسنتِ يا ' + P.name + '، أنتِ تتقدَّمين بثبات! 👏' : 'يا ' + P.name + '، البطلاتُ يتدرَّبن أكثر، أعيدي الأسئلةَ التي أخطأتِ فيها 💪';
    app.innerHTML = '<div class="wrap">' + bar(true) + '<div class="ach blk">' + avatar(P) + '<h2>' + msg + '</h2><div class="sub">' + title + '</div><div class="s">' + '⭐'.repeat(st) + '☆'.repeat(3 - st) + '</div>' +
      '<div style="font:800 20px B">أصبتِ في ' + AR(score) + ' من ' + AR(n) + '</div><div style="font:600 15px R;color:#5B6280;margin-top:6px">📸 صوِّري هذه البطاقة وأرسليها لصديقتك!</div></div>' +
      (wrongs.length ? '<button class="btn p" id="fix" style="width:100%;margin-top:14px">🔁 أعيدي الأسئلةَ التي أخطأتِ فيها (' + AR(wrongs.length) + ')</button>' : '') +
      '<div class="nav"><button class="btn w" id="ag">🔄 جولة جديدة</button><button class="btn g" id="mp">🗺️ العوالم</button></div></div>';
    wireBack(); play(function () { speak(msg); });
    if (wrongs.length) document.getElementById('fix').onclick = fix;
    document.getElementById('ag').onclick = again; document.getElementById('mp').onclick = map;
  }
  function others(all, ans, n) { return shuffle(all.filter(function (x) { return x !== ans; })).slice(0, n); }


  // ---------- spaced repetition (Leitner boxes: back after 1, 3, 7, 14, 30 days) ----------
  var GAPS = [1, 3, 7, 14, 30];
  function today() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }
  function srsRec(key, ok) {
    if (!key) return; P.srs = P.srs || {}; var e = P.srs[key] || { b: 0 };
    e.b = ok ? Math.min(4, e.b + 1) : 0; e.d = today() + GAPS[e.b]; e.n = (e.n || 0) + 1; P.srs[key] = e; save();
  }
  function dueKeys() { var t = today(), a = []; for (var k in (P.srs || {})) if (P.srs[k].d <= t) a.push(k); return a.sort(function (x, y) { return P.srs[x].b - P.srs[y].b; }); }
  function findRow(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i]; return null; }
  function reviewItem(key) {   // rebuild one question from its key
    var t = key.split(':')[0], id = key.split(':')[1], s, uniq = function (a) { return a.filter(function (v, i, x) { return x.indexOf(v) === i; }); };
    if (t === 's' && (s = findRow(Z.sounds, id))) return { srs: key, head: '<img class="pic" src="img/s_' + s[0] + '.jpg" alt="">', say: { id: s[0], text: 'صوتُ ' + s[1] }, ask: 'ماذا نسمّي صوتَ ' + s[1] + '؟', opts: [s[2]].concat(others(Z.sounds.map(function (x) { return x[2]; }), s[2], 2)), ans: s[2], why: s[3] };
    if (t === 't' && (s = findRow(Z.things, id))) return { srs: key, head: '<div class="anim a-' + s[4] + '"><img class="pic" src="img/s_' + s[0] + '.jpg" alt=""></div>', say: { id: s[0], text: 'صوتُ ' + s[1] }, ask: 'ماذا نسمّي صوتَ ' + s[1] + '؟', opts: [s[2]].concat(others(Z.things.map(function (x) { return x[2]; }), s[2], 2)), ans: s[2], why: s[3] };
    if (t === 'y' && (s = findRow(Z.young, id))) return { srs: key, head: s[4] ? '<img class="pic" style="width:140px" src="img/' + s[4] + '.jpg" alt="">' : '<div style="font-size:60px">🥚</div>', ask: 'ما اسمُ صغيرِ ' + s[1] + '؟', opts: [s[2]].concat(others(Z.young.map(function (x) { return x[2]; }), s[2], 2)), ans: s[2], why: s[3] };
    if (t === 'h' && (s = findRow(Z.homes, id))) return { srs: key, head: s[4] ? '<img class="pic" src="img/' + s[4] + '.jpg" alt="">' : '<div style="font:800 40px B;margin:20px 0">' + s[1] + '</div>', ask: 'أين يسكنُ ' + s[1] + '؟', houses: true, opts: [s[2]].concat(others(uniq(Z.homes.map(function (x) { return x[2]; })), s[2], 2)), ans: s[2], why: s[3] };
    if (t === 'p' && (s = findRow(Z.pairs, id))) return { srs: key, head: '<div style="font-size:60px">💞</div>', ask: 'ما اسمُ أنثى ال' + s[1] + '؟', opts: [s[2]].concat(others(Z.pairs.map(function (x) { return x[2]; }), s[2], 2)), ans: s[2], why: s[1] + ' ← وأنثاه: ' + s[2] + '.', img: 'm_' + s[0] };
    return null;
  }
  function reviewWorld() {
    stop(); var items = dueKeys().slice(0, 10).map(reviewItem).filter(Boolean);
    if (!items.length) {
      app.innerHTML = '<div class="wrap">' + bar(true) + '<div class="ach blk">' + avatar(P) + '<h2>لا مراجعةَ اليوم! 🌟</h2><div class="sub">كلُّ ما تعلّمتَه محفوظٌ. العبْ في عالمٍ آخر، وما تُخطئُ فيه سيعودُ إليكَ في وقتِه.</div></div><div class="nav"><button class="btn g" id="mp">🗺️ العوالم</button></div></div>';
      wireBack(); document.getElementById('mp').onclick = map; play(function () { speak('لا مراجعةَ اليوم يا ' + P.name + '! كلُّ ما تعلّمتِه محفوظ.'); }); return;
    }
    quiz('wr', '🔁 مراجعةُ اليوم', items, { again: reviewWorld });
  }

  // ---------- world 1: animal sounds ----------
  function soundsWorld() {
    var S = Z.sounds, names = S.map(function (s) { return s[2]; }), animals = S.map(function (s) { return s[1]; });
    var items = shuffle(S).slice(0, 10).map(function (s, k) {
      if (k % 3 === 2) return { srs: 's:' + s[0], head: '<div style="font-size:64px">🔊</div>', say: { id: s[0], text: s[2] }, ask: 'مَن صاحبُ صوتِ «' + s[2] + '»؟', opts: [s[1]].concat(others(animals, s[1], 2)), ans: s[1], why: s[3], whyLine: 'صوتُ ' + s[1] + ' اسمُه: ' + s[2] + '. ' + s[3], img: 's_' + s[0] };
      return { srs: 's:' + s[0], head: '<img class="pic" src="img/s_' + s[0] + '.jpg" alt="">', say: { id: s[0], text: 'صوتُ ' + s[1] }, ask: 'ماذا نسمّي صوتَ ' + s[1] + '؟', opts: [s[2]].concat(others(names, s[2], 2)), ans: s[2], why: s[3], whyLine: 'صوتُ ' + s[1] + ' اسمُه: ' + s[2] + '. ' + s[3] };
    });
    quiz('w1', '🦁 أصواتُ الحيوانات', items, { again: soundsWorld });
  }
  // ---------- world 2: sounds around us (animated) ----------
  function thingsWorld() {
    var T = Z.things, names = T.map(function (s) { return s[2]; });
    var items = shuffle(T).slice(0, 10).map(function (s) {
      return { srs: 't:' + s[0], head: '<div class="anim a-' + s[4] + '"><img class="pic" src="img/s_' + s[0] + '.jpg" alt=""></div>', say: { id: s[0], text: 'صوتُ ' + s[1] }, ask: 'ماذا نسمّي صوتَ ' + s[1] + '؟', opts: [s[2]].concat(others(names, s[2], 2)), ans: s[2], why: s[3], whyLine: 'صوتُ ' + s[1] + ' اسمُه: ' + s[2] + '. ' + s[3] };
    });
    quiz('w2', '🌬️ أصواتٌ من حولنا', items, { again: thingsWorld });
  }
  // ---------- world 3: hatch the egg (young) ----------
  function eggWorld() {
    var Y = Z.young, names = Y.map(function (s) { return s[2]; });
    var items = shuffle(Y).slice(0, 8).map(function (s) {
      return { srs: 'y:' + s[0], head: '<div><span class="egg" id="egg">🥚</span></div>' + (s[4] ? '<img class="pic" style="width:140px" src="img/' + s[4] + '.jpg" alt="">' : ''), ask: 'بيضةٌ مفاجأة! ما اسمُ صغيرِ ' + s[1] + '؟', askSay: 'ما اسمُ صغيرِ ' + s[1] + '؟', opts: [s[2]].concat(others(names, s[2], 2)), ans: s[2], why: s[3], whyLine: 'صغيرُ ' + s[1] + ' اسمُه: ' + s[2] + '. ' + s[3], img: 'y_' + s[0],
        onRight2: function () { speak('أضفتِ صغيرًا جديدًا إلى مجموعتِكِ يا ' + P.name + '!'); },
        extra: '<div style="font:800 19px B;margin-top:8px;color:#BE185D">🐾 أضفتِ «' + s[2] + '» إلى مجموعتِكِ!</div>',
        onRight: function () { var e = document.getElementById('egg'); if (e) { e.classList.add('crack'); setTimeout(function () { e.textContent = '🐣'; e.classList.remove('crack'); }, 600); } if (P.coll.indexOf(s[0]) < 0) { P.coll.push(s[0]); save(); } } };
    });
    quiz('w3', '🥚 فقِّسي البيضة', items, { again: eggWorld });
  }
  // ---------- world 4: homes ----------
  function homesWorld() {
    var H = Z.homes, names = H.map(function (s) { return s[2]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var items = shuffle(H).slice(0, 8).map(function (s) {
      return { srs: 'h:' + s[0], head: s[4] ? '<img class="pic" src="img/' + s[4] + '.jpg" alt="">' : '<div style="font:800 40px B;margin:20px 0">' + s[1] + '</div>', ask: 'أين يسكنُ ' + s[1] + '؟', houses: true, opts: [s[2]].concat(others(names, s[2], 2)), ans: s[2], why: s[3], whyLine: 'يسكنُ ' + s[1] + ' في: ' + s[2] + '. ' + s[3], img: 'h_' + s[0] };
    });
    quiz('w4', '🏠 أوصلي الحيوانَ لبيته', items, { again: homesWorld });
  }
  // ---------- world 5: memory (male / female) ----------
  function memoryWorld() {
    stop();
    var prs = shuffle(Z.pairs).slice(0, 6), cards = shuffle(prs.reduce(function (a, p) { return a.concat([{ id: p[0], t: '♂ ' + p[1] }, { id: p[0], t: '♀ ' + p[2] }]); }, []));
    var open = [], found = 0, moves = 0, lock = false;
    app.innerHTML = '<div class="wrap">' + bar(true) + '<h1 class="t">💞 لعبةُ الذاكرة</h1><div class="sub">اقلبي بطاقتين: الذَّكرُ وأنثاه ♂ ♀</div>' +
      '<div class="mem">' + cards.map(function (c, i) { return '<button class="card" data-i="' + i + '"><div class="in"><div class="fa">🐾</div><div class="ba">' + c.t + '</div></div></button>'; }).join('') + '</div><div id="fb"></div></div>';
    wireBack();
    [].forEach.call(app.querySelectorAll('.card'), function (b) {
      b.onclick = function () {
        if (lock || b.classList.contains('f')) return; b.classList.add('f'); open.push(b); speak(cards[+b.dataset.i].t.slice(2));
        if (open.length < 2) return; moves++; lock = true;
        var a = cards[+open[0].dataset.i], c = cards[+open[1].dataset.i];
        if (a.id === c.id) {
          open.forEach(function (x) { x.classList.add('m'); }); found++; srsRec('p:' + a.id, true); P.stars++; save(); confetti(8);
          var p = Z.pairs.filter(function (q) { return q[0] === a.id; })[0];
          document.getElementById('fb').innerHTML = '<div class="why"><b>✅ ' + p[1] + ' ← وأنثاه: ' + p[2] + '</b><img src="img/m_' + p[0] + '.jpg" alt=""></div>';
          play(function () { speak(p[1] + '، وأنثاه: ' + p[2] + '.'); }); open = []; lock = false;
          if (found === prs.length) setTimeout(function () { var st = moves <= 9 ? 3 : moves <= 13 ? 2 : 1; P.best.w5 = Math.max(P.best.w5 || 0, st); save(); achievement('💞 لعبةُ الذاكرة', st, prs.length, prs.length, [], null, memoryWorld); }, 1600);
        } else setTimeout(function () { open.forEach(function (x) { x.classList.remove('f'); }); open = []; lock = false; }, 900);
      };
    });
  }
  // ---------- world 6: run from the wolf (mixed) ----------
  function runWorld() {
    stop();
    var pool = [];
    Z.sounds.forEach(function (s) { pool.push({ srs: 's:' + s[0], ask: 'صوتُ ' + s[1] + '؟', ans: s[2], all: Z.sounds.map(function (x) { return x[2]; }), why: s[3] }); });
    Z.young.forEach(function (s) { pool.push({ srs: 'y:' + s[0], ask: 'صغيرُ ' + s[1] + '؟', ans: s[2], all: Z.young.map(function (x) { return x[2]; }), why: s[3] }); });
    Z.homes.forEach(function (s) { pool.push({ srs: 'h:' + s[0], ask: 'بيتُ ' + s[1] + '؟', ans: s[2], all: Z.homes.map(function (x) { return x[2]; }), why: s[3] }); });
    Z.pairs.forEach(function (s) { pool.push({ srs: 'p:' + s[0], ask: 'أنثى ال' + s[1] + '؟', ans: s[2], all: Z.pairs.map(function (x) { return x[2]; }), why: '' }); });
    var qs = shuffle(pool).slice(0, 10), qi = 0, gap = 3, score = 0, wrongs = [];
    function scene(jump) {
      return '<div class="run"><div class="ground"></div><div class="flag" style="left:' + (8 + (10 - qi) * 0) + 'px">' + (qi >= 9 ? '🏁' : '') + '</div>' +
        '<div class="gate g1"></div><div class="gate g2"></div>' +
        '<div class="hero' + (jump ? ' jump' : '') + '" id="hero">' + avatar(P, true) + '</div><div class="wolf" id="wolf" style="right:' + (120 - gap * 26 + 26 * 0) + 'px">🐺</div></div>' +
        '<div class="dist">المسافة بينكِ وبين الذئب: ' + '🟩'.repeat(gap) + '⬜'.repeat(Math.max(0, 5 - gap)) + ' · البوابة ' + AR(qi + 1) + ' من ' + AR(qs.length) + '</div>';
    }
    function show() {
      var q = qs[qi], tried = false, o = shuffle([q.ans].concat(others(q.all.filter(function (v, i, a) { return a.indexOf(v) === i; }), q.ans, 2)));
      app.innerHTML = '<div class="wrap">' + bar(true) + '<h1 class="t">🏃‍♀️ اهربي من الذئب!</h1><div id="sc">' + scene(false) + '</div>' +
        '<div class="q blk" style="margin-top:12px"><div class="big">' + q.ask + '</div><div class="opts">' + o.map(function (x, k) { return '<button class="opt" data-k="' + k + '">' + x + '</button>'; }).join('') + '</div><div id="fb"></div></div></div>';
      wireBack(); positionWolf(); play(function () { speak(q.ask); });
      [].forEach.call(app.querySelectorAll('[data-k]'), function (b) {
        b.onclick = function () {
          var ok = o[+b.dataset.k] === q.ans; if (q.srs && !tried) srsRec(q.srs, ok);
          if (!ok) { b.disabled = true; b.classList.add('wrong'); gap = Math.max(1, gap - 1); positionWolf(); if (!tried) wrongs.push(q); tried = true; var m = 'الذئبُ يقترب يا ' + P.name + '! ركِّزي وفكِّري جيّدًا.'; document.getElementById('fb').innerHTML = '<div class="again">' + m + '</div>'; play(function () { speak(m, function () { speak(q.ask); }); }); return; }
          if (!tried) { score++; P.stars++; save(); gap = Math.min(5, gap + 1); }
          [].forEach.call(app.querySelectorAll('[data-k]'), function (x) { x.disabled = true; });
          b.classList.add('right'); document.getElementById('hero').classList.add('jump'); positionWolf();
          speak(nm(pick(GOOD)));
          setTimeout(function () { qi++; qi < qs.length ? show() : finish(); }, 1100);
        };
      });
    }
    function positionWolf() { var w = document.getElementById('wolf'); if (w) w.style.right = (112 - gap * 26) + 'px'; }
    function finish() { var st = score >= 9 ? 3 : score >= 6 ? 2 : 1; P.best.w6 = Math.max(P.best.w6 || 0, st); save(); achievement('🏃‍♀️ نجوتِ من الذئب!', st, score, qs.length, [], null, runWorld); setTimeout(function () { speak('نجوتِ من الذئب يا ' + P.name + '! أنتِ بطلةٌ حقيقيّة.'); }, 2600); }
    show();
  }
  // ---------- collection ----------
  function collection() {
    stop();
    app.innerHTML = '<div class="wrap">' + bar(true) + '<h1 class="t">🐾 حيواناتي</h1><div class="sub">فقِّسي البيضَ في عالم «فقِّسي البيضة» لتجمعي كلَّ الصغار (' + AR(P.coll.length) + ' من ' + AR(Z.young.length) + ')</div>' +
      '<div class="coll">' + Z.young.map(function (y) { var has = P.coll.indexOf(y[0]) >= 0; return '<div><img class="' + (has ? '' : 'no') + '" src="img/y_' + y[0] + '.jpg" alt="">' + (has ? y[2] : '❓') + '</div>'; }).join('') + '</div></div>';
    wireBack();
  }

  window.ZOO = { reviewItem: reviewItem, sound: sound, dueKeys: dueKeys, quiz: quiz, shuffle: shuffle, pick: pick, others: others, AR: AR, speak: speak, stop: stop, play: play, confetti: confetti, bar: bar, wireBack: wireBack, map: map, app: app, save: save, achievement: achievement, avatar: avatar, srsRec: srsRec, masc: masc, MALE: MALE, getP: function () { return P; }, addWorld: function (w) { if (w[0] === 'wp') W.splice(1, 0, w); else W.push(w); } };
  if (window.ZOO_READY) window.ZOO_READY();
  if (!ME) { who(); return; }
  if (P) { map(); setTimeout(function () { var h = document.querySelector('.hello'); if (h) { var t = h.textContent; play(function () { speak(t, function () { speak('كلُّ إجابةٍ صحيحةٍ تمنحُكِ نجمة.'); }); }); } }, 500); } else maker(false);
})();
