// عالم التفكير: ألعاب تدريب على أنواع التفكير التي يقيسها مقياس موهبة (الاستدلال العددي والشكلي واللفظي، والمرونة العقلية، وذاكرة التسلسل).
// كل الأسئلة مصنوعة هنا من الصفر وتتغيّر في كل مرة (لا تُنسخ من أي كتاب).
(function () {
  window.ZOO_READY = function () {
    var Z = window.ZOO, shuffle = Z.shuffle, pick = Z.pick, AR = Z.AR, app = Z.app;
    function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function uniq(a) { return a.filter(function (v, i, x) { return x.indexOf(v) === i; }); }
    function three(ans, pool) {   // the right answer + two different wrong ones
      var w = uniq(pool.filter(function (x) { return String(x) !== String(ans); })), o = shuffle(w).slice(0, 2);
      while (o.length < 2) { o.push(typeof ans === 'number' ? ans + o.length + 1 : '؟'); }
      return [ans].concat(o);
    }
    var H = function (html) { return '<div class="think">' + html + '</div>'; };

    // ---------- 1) number patterns ----------
    function numPattern() {
      var kind = R(0, 5), a = R(1, 9), d = R(2, 6), seq = [], rule = '';
      if (kind === 0) { for (var i = 0; i < 6; i++) seq.push(a + d * i); rule = 'كلُّ عددٍ يزيدُ ' + AR(d) + ' على الذي قبلَه'; }
      else if (kind === 1) { var s0 = R(40, 70); for (i = 0; i < 6; i++) seq.push(s0 - d * i); rule = 'كلُّ عددٍ ينقصُ ' + AR(d) + ' عن الذي قبلَه'; }
      else if (kind === 2) { var m = pick([2, 3]); a = R(1, 4); for (i = 0; i < 5; i++) seq.push(a * Math.pow(m, i)); rule = 'كلُّ عددٍ هو ' + (m === 2 ? 'ضعفُ' : 'ثلاثةُ أمثالِ') + ' الذي قبلَه'; }
      else if (kind === 3) { var x = R(1, 5), y = R(2, 4), z = x; for (i = 0; i < 6; i++) { seq.push(z); z += i % 2 === 0 ? x : y; } rule = 'نزيدُ مرّةً ' + AR(x) + ' ومرّةً ' + AR(y) + ' بالتناوب'; }
      else if (kind === 4) { for (i = 1; i <= 6; i++) seq.push(i * i); rule = 'مربّعاتُ الأعداد: ١×١، ٢×٢، ٣×٣…'; }
      else { var p = R(1, 4), q = R(1, 5); seq = [p, q]; for (i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]); rule = 'كلُّ عددٍ = مجموعُ العددين اللذين قبلَه'; }
      var pos = seq.length - 1 - R(0, 1), ans = seq[pos], shown = seq.map(function (v, i) { return i === pos ? '❓' : AR(v); });
      return { head: H('<div class="seq">' + shown.join(' ، ') + '</div>'), ask: 'ما العددُ الناقص؟', askSay: 'ما العددُ الناقص في هذه المتتالية؟', opts: three(ans, [ans + 1, ans - 1, ans + 2, ans - 2, ans + d, ans - d, ans * 2]).map(String), ans: String(ans), why: rule + '.' };
    }
    // ---------- 2) picture patterns ----------
    function picPattern() {
      var sets = [['🔴', '🔵', '🟢', '🟡', '🟣'], ['⭐', '🌙', '☀️', '☁️', '❤️'], ['🐱', '🐶', '🐰', '🐻', '🐼'], ['🍎', '🍌', '🍇', '🍓', '🍊']], S = shuffle(pick(sets)), kind = R(0, 3), seq = [], ans, why;
      if (kind === 0) { var u = [S[0], S[1]], n = 7; for (var i = 0; i < n; i++) seq.push(u[i % 2]); why = 'النمطُ يتكرّر: ' + u.join(' ') + '.'; }
      else if (kind === 1) { u = [S[0], S[1], S[2]]; n = 8; for (i = 0; i < n; i++) seq.push(u[i % 3]); why = 'النمطُ ثلاثيٌّ يتكرّر: ' + u.join(' ') + '.'; }
      else if (kind === 2) { u = [S[0], S[0], S[1]]; n = 8; for (i = 0; i < n; i++) seq.push(u[i % 3]); why = 'النمطُ يتكرّر: ' + u.join(' ') + '.'; }
      else { var A = ['⬆️', '➡️', '⬇️', '⬅️']; seq = []; for (i = 0; i < 7; i++) seq.push(A[i % 4]); why = 'السهمُ يدورُ مع عقاربِ الساعةِ كلَّ مرّة.'; S = A; }
      var pos = seq.length - 1; ans = seq[pos]; var shown = seq.map(function (v, i) { return i === pos ? '❓' : v; });
      return { head: H('<div class="seq big2">' + shown.join(' ') + '</div>'), ask: 'ما الشكلُ الناقص؟', opts: three(ans, S.concat(['🔶'])), ans: ans, why: why };
    }
    // ---------- 3) odd one out ----------
    var CAT = [['فواكه', ['🍎 تفاح', '🍌 موز', '🍊 برتقال', '🍇 عنب', '🍓 فراولة', '🍉 بطيخ']], ['حيواناتٌ أليفة', ['🐱 قطة', '🐶 كلب', '🐰 أرنب', '🐴 حصان', '🐑 خروف']], ['وسائلُ نقل', ['🚗 سيارة', '✈️ طائرة', '🚆 قطار', '🚢 سفينة', '🚲 دراجة']], ['أدواتُ الدراسة', ['✏️ قلم', '📏 مسطرة', '📒 دفتر', '✂️ مقص', '🎒 حقيبة']], ['أجزاءُ الجسم', ['👁️ عين', '👂 أذن', '✋ يد', '🦶 قدم', '👃 أنف']], ['أدواتُ المائدة', ['🥄 ملعقة', '🍴 شوكة', '🍽️ صحن', '🥛 كوب']], ['حيواناتٌ بريّة', ['🦁 أسد', '🐺 ذئب', '🐘 فيل', '🦊 ثعلب', '🐯 نمر']], ['طيور', ['🦅 نسر', '🐦 عصفور', '🕊️ حمامة', '🐓 ديك']], ['خضروات', ['🥕 جزر', '🥒 خيار', '🍅 طماطم', '🥔 بطاطس']]];
    function oddOne() {
      var c = shuffle(CAT), a = c[0], b = c[1], three_ = shuffle(a[1]).slice(0, 3), odd = pick(b[1]), all = shuffle(three_.concat([odd]));
      return { head: H('<div class="seq">❓</div>'), ask: 'أيُّ كلمةٍ تختلفُ عن الباقي؟', opts: all, ans: odd, why: 'الثلاثةُ الأخرى من ' + a[0] + '، أمّا ' + odd.replace(/^\S+ /, '') + ' فمن ' + b[0] + '.', houses: false };
    }
    // ---------- 4) verbal analogies (uses what we learned about animals) ----------
    var ANT = [['كبير', 'صغير'], ['طويل', 'قصير'], ['حارّ', 'باردٌ'], ['سريع', 'بطيء'], ['قويّ', 'ضعيف'], ['مضيء', 'مظلم'], ['ثقيل', 'خفيف'], ['غنيّ', 'فقير'], ['نهار', 'ليل'], ['صعود', 'نزول']];
    var TOOL = [['القلمُ', 'الكتابة'], ['المقصُّ', 'القصّ'], ['الملعقةُ', 'الأكل'], ['المكنسةُ', 'الكنس'], ['السيّارةُ', 'التنقّل'], ['الفرشاةُ', 'الرسم'], ['الكتابُ', 'القراءة']];
    var PART = [['العين', 'الرأس'], ['الإصبع', 'اليد'], ['العجلة', 'السيّارة'], ['الصفحة', 'الكتاب'], ['الغصن', 'الشجرة'], ['الريشة', 'الطائر'], ['الحرف', 'الكلمة']];
    function analogy() {
      var t = R(0, 5), a, b, c, d, rel, pool;
      if (t === 0) { var S = shuffle(window.Z.sounds).slice(0, 2); a = S[0][1]; b = S[0][2]; c = S[1][1]; d = S[1][2]; rel = 'اسمُ الصوت'; pool = window.Z.sounds.map(function (x) { return x[2]; }); }
      else if (t === 1) { var Y = shuffle(window.Z.young).slice(0, 2); a = Y[0][1]; b = Y[0][2]; c = Y[1][1]; d = Y[1][2]; rel = 'اسمُ الصغير'; pool = window.Z.young.map(function (x) { return x[2]; }); }
      else if (t === 2) { var Hm = shuffle(window.Z.homes).slice(0, 2); a = Hm[0][1]; b = Hm[0][2]; c = Hm[1][1]; d = Hm[1][2]; rel = 'اسمُ البيت'; pool = window.Z.homes.map(function (x) { return x[2]; }); }
      else if (t === 3) { var An = shuffle(ANT).slice(0, 2); a = An[0][0]; b = An[0][1]; c = An[1][0]; d = An[1][1]; rel = 'الضدّ'; pool = ANT.map(function (x) { return x[1]; }); }
      else if (t === 4) { var T = shuffle(TOOL).slice(0, 2); a = T[0][0]; b = T[0][1]; c = T[1][0]; d = T[1][1]; rel = 'الأداةُ وعملُها'; pool = TOOL.map(function (x) { return x[1]; }); }
      else { var Pt = shuffle(PART).slice(0, 2); a = Pt[0][0]; b = Pt[0][1]; c = Pt[1][0]; d = Pt[1][1]; rel = 'الجزءُ والكلّ'; pool = PART.map(function (x) { return x[1]; }); }
      return { head: H('<div class="ana"><span>' + a + '</span> ← <span>' + b + '</span><br><span>' + c + '</span> ← <span>❓</span></div>'), ask: 'العلاقةُ بين الأولى والثانية هي نفسُها بين الثالثةِ و…؟', opts: three(d, pool), ans: d, why: 'العلاقةُ هي «' + rel + '»: ' + a + ' ← ' + b + '، فكذلك ' + c + ' ← ' + d + '.' };
    }
    // ---------- 5) the scale ----------
    function scale() {
      var F = shuffle([['🍎', 'التفاحة'], ['🍌', 'الموزة'], ['⚽', 'الكرة'], ['🍉', 'البطيخة'], ['🧱', 'الطوبة']]), a = F[0], b = F[1], c = F[2], k1 = R(2, 3), k2 = R(2, 3), ans = k1 * k2;
      return { head: H('<div class="bal"><div>' + b[0] + ' = ' + a[0].repeat(k1) + '</div><div>' + c[0] + ' = ' + b[0].repeat(k2) + '</div></div>'), ask: 'كم ' + a[0] + ' تُوازنُ ' + c[0] + '؟', opts: three(ans, [ans + 1, ans - 1, k1 + k2, ans + 2]).map(String).map(function (x) { return x; }), ans: String(ans), why: 'الواحدةُ ' + c[0] + ' = ' + AR(k2) + ' من ' + b[0] + '، وكلُّ ' + b[0] + ' = ' + AR(k1) + ' من ' + a[0] + '، فالمجموع ' + AR(k2) + ' × ' + AR(k1) + ' = ' + AR(ans) + '.' };
    }
    // ---------- 6) number riddles ----------
    function riddle() {
      var n = R(2, 9), m = R(2, 5), a = R(1, 9), op = R(0, 2), res, txt;
      if (op === 0) { res = n * m + a; txt = 'ضربتُه في ' + AR(m) + ' ثم أضفتُ ' + AR(a) + ' فصارَ ' + AR(res); }
      else if (op === 1) { res = n * m - Math.min(a, n * m - 1); a = Math.min(a, n * m - 1); txt = 'ضربتُه في ' + AR(m) + ' ثم طرحتُ ' + AR(a) + ' فصارَ ' + AR(res); }
      else { res = (n + a) * m; txt = 'أضفتُ إليه ' + AR(a) + ' ثم ضربتُ الناتجَ في ' + AR(m) + ' فصارَ ' + AR(res); }
      return { head: H('<div class="seq">🤔 فكّرتُ في عدد…</div>'), ask: txt + '. ما العددُ؟', opts: three(n, [n + 1, n - 1, n + 2, n * 2]).map(String), ans: String(n), why: 'نرجعُ إلى الوراء: نعكسُ العمليّاتِ بالعكس فنحصلُ على ' + AR(n) + '.' };
    }
    // ---------- 7) who is taller / older (logic) ----------
    function order() {
      var N = shuffle(['سلمى', 'خالد', 'نورة', 'أحمد', 'ريم', 'سعود', 'لينا', 'فهد']).slice(0, 3), kind = R(0, 1), W = kind ? ['أصغرُ', 'أكبرُ', 'الأصغر'] : ['أقصرُ', 'أطولُ', 'الأقصر'], ask, ans, q = R(0, 1);
      // N[0] > N[1] > N[2]  (first is the biggest)
      var st = N[0] + ' ' + (kind ? 'أكبرُ' : 'أطولُ') + ' من ' + N[1] + '، و' + N[1] + ' ' + (kind ? 'أكبرُ' : 'أطولُ') + ' من ' + N[2] + '.';
      if (q === 0) { ask = 'من ' + (kind ? 'الأكبرُ' : 'الأطولُ') + ' بين الثلاثة؟'; ans = N[0]; } else { ask = 'من ' + (kind ? 'الأصغرُ' : 'الأقصرُ') + ' بين الثلاثة؟'; ans = N[2]; }
      return { head: H('<div class="seq" style="font-size:22px;line-height:1.9">' + st + '</div>'), ask: ask, opts: shuffle(N), ans: ans, why: 'الترتيبُ من الأكبرِ: ' + N.join(' ثم ') + '.' };
    }
    // ---------- 8) flexible thinking: change the rule ----------
    function flex() {
      var a = R(2, 6), d = R(2, 5), seq = [a, a + d, a + 2 * d, a + 3 * d], k = R(0, 1);
      if (k === 0) { // "double instead of add"
        var x = R(2, 5); return { head: H('<div class="seq">' + AR(x) + ' ← ' + AR(x * 2) + ' ← ' + AR(x * 4) + ' ← ❓</div>'), ask: 'ما العددُ التالي؟', opts: three(x * 8, [x * 6, x * 7, x * 8 + 1, x * 4 + x]).map(String), ans: String(x * 8), why: 'كلُّ مرّةٍ نضاعفُ العددَ (×٢).' };
      }
      var up = ['🟥', '🟦', '🟨', '🟩'], r = shuffle(up).slice(0, 3), hid = pick(r), rest = r.filter(function (v) { return v !== hid; });
      return { head: H('<div class="seq big2">' + rest[0] + ' ' + rest[1] + ' ' + rest[0] + ' ' + rest[1] + ' ' + rest[0] + ' ❓</div>'), ask: 'ما الشكلُ التالي؟', opts: three(rest[1], up), ans: rest[1], why: 'الشكلان يتبادلان: ' + rest[0] + ' ثم ' + rest[1] + '.' };
    }
    var GAMES = [
      ['t1', '🔢', 'أكمِلوا العدد', 'متتالياتٌ عدديّة', '#FF8A3D', numPattern, 8], ['t2', '🔷', 'أكمِلوا الشكل', 'أنماطٌ مرسومة', '#22A6E8', picPattern, 8], ['t3', '🧩', 'الدخيل', 'من يختلفُ عن الباقي؟', '#22C55E', oddOne, 8],
      ['t4', '🔗', 'العلاقة', 'التناظرُ اللفظيّ', '#FF5FA2', analogy, 8], ['t5', '⚖️', 'الميزان', 'كم تُوازن؟', '#7B5CFF', scale, 6], ['t6', '🤔', 'فكّرتُ في عدد', 'ألغازُ الأعداد', '#E11D48', riddle, 6],
      ['t7', '📏', 'من الأطول؟', 'منطقُ الترتيب', '#0EA5A5', order, 6], ['t8', '🔄', 'غيّروا القاعدة', 'مرونةٌ عقليّة', '#F59E0B', flex, 6]
    ];
    function build(g) { var items = [], keys = {}, guard = 0; while (items.length < g[6] && guard++ < 80) { var it = g[5](); var k = it.ask + JSON.stringify(it.head); if (keys[k]) continue; keys[k] = 1; items.push(it); } return items; }
    function play(g) { Z.quiz(g[0], g[1] + ' ' + g[2], build(g), { again: function () { play(g); }, back: hub }); }

    // ---------- 9) color memory (sequence memory) ----------
    function simon() {
      var COL = ['#EF4444', '#3B82F6', '#22C55E', '#FACC15'], seq = [], pos = 0, busy = true, level = 0;
      function draw(msg) {
        app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<h1 class="t">🎨 ذاكرةُ الألوان</h1><div class="sub">' + msg + '</div><div class="simon">' + COL.map(function (c, i) { return '<button class="pad" data-i="' + i + '" style="background:' + c + '"></button>'; }).join('') + '</div><div class="sub" id="lv">المستوى ' + AR(level) + '</div></div>';
        var bk = document.getElementById('bk'); if (bk) bk.onclick = hub;
        [].forEach.call(app.querySelectorAll('.pad'), function (b) { b.onclick = function () { if (busy) return; press(+b.dataset.i); }; });
      }
      function flash(i, ms) { var p = app.querySelectorAll('.pad')[i]; if (!p) return; p.classList.add('lit'); setTimeout(function () { p.classList.remove('lit'); }, ms || 380); }
      function show() { busy = true; draw('شاهدوا الألوان…'); var i = 0; (function step() { if (i >= seq.length) { busy = false; pos = 0; var s = app.querySelector('.sub'); if (s) s.textContent = 'دورُكم! أعيدوا الترتيب'; return; } flash(seq[i]); i++; setTimeout(step, 650); })(); }
      function next() { seq.push(R(0, 3)); level = seq.length; setTimeout(show, 700); }
      function press(i) {
        flash(i, 200);
        if (i !== seq[pos]) { busy = true; var st = level >= 7 ? 3 : level >= 5 ? 2 : 1, P = Z.getP(); P.best.t9 = Math.max(P.best.t9 || 0, st); P.stars += Math.max(0, level - 1); Z.save(); setTimeout(function () { Z.achievement('🎨 ذاكرةُ الألوان', st, Math.max(0, level - 1), Math.max(level, 1), [], null, simon); var mp = document.getElementById('mp'); if (mp) mp.onclick = hub; }, 500); return; }
        pos++; if (pos === seq.length) { Z.confetti(6); busy = true; next(); }
      }
      Z.stop(); draw('هل تتذكّرون الترتيب؟'); setTimeout(next, 600);
    }

    // ---------- thinking hub ----------
    function hub() {
      Z.stop(); var P = Z.getP();
      var all = GAMES.concat([['t9', '🎨', 'ذاكرةُ الألوان', 'اتبعوا الترتيب', '#EC4899', null]]);
      app.innerHTML = '<div class="wrap">' + Z.bar(true) + '<h1 class="t">🧠 عالمُ التفكير</h1><div class="hello blk">هنا نُدرّب العقلَ على الأنماطِ والمنطقِ، مثلَ ألعابِ الأذكياء! كلُّ لعبةٍ أسئلتُها جديدةٌ في كلِّ مرّة.</div>' +
        '<div class="worlds">' + all.map(function (g, i) { var b = P.best[g[0]] || 0; return '<button class="tile blk" data-g="' + i + '" style="--c:' + g[4] + '"><span class="ic">' + g[1] + '</span><span class="tt"><b>' + g[2] + '</b><small>' + g[3] + '</small></span><span class="st">' + '⭐'.repeat(b) + '☆'.repeat(3 - b) + '</span></button>'; }).join('') + '</div></div>';
      var bk = document.getElementById('bk'); if (bk) bk.onclick = Z.map;
      [].forEach.call(app.querySelectorAll('[data-g]'), function (b) { b.onclick = function () { var g = all[+b.dataset.g]; if (g[0] === 't9') simon(); else play(g); }; });
      window.scrollTo(0, 0);
    }
    Z.addWorld(['wt', '🧠', 'عالمُ التفكير', 'ألغازٌ وأنماطٌ وذاكرة', '#8B5CF6', hub]);
  };
})();
