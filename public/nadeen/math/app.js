(function () {
  'use strict';
  var M = window.MATH, ar = M.ar, $ = function (s) { return document.querySelector(s); };
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function show(id) { document.querySelectorAll('.scr').forEach(function (s) { s.classList.add('hidden'); }); $('#' + id).classList.remove('hidden'); window.scrollTo(0, 0); }

  // ---------- العبارات (نفس نص التسجيل) ----------
  var L = {
    bism: 'بسم الله الرحمن الرحيم.',
    dua: 'قبل أن نبدأ، نقول معًا: رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ، وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ، وَاجْعَلْ لِي مِنْ لَدُنْكَ سُلْطَانًا نَصِيرًا.',
    hello: 'أهلًا بكِ يا بطلةَ الرياضيات!',
    today: 'اليومَ نراجعُ الجمعَ والطرحَ، خطوةً خطوة.',
    remind: 'تذكّري: البطلةُ لا تستعجل. تقرأُ، ثم تفكّرُ، ثم تجيب.',
    read: 'اقرئي السؤالَ على مَهَل.',
    need: 'ما المطلوبُ في السؤال؟ ضعي تحتَه خطًّا.',
    op: 'هل المسألةُ جمعٌ أم طرح؟ فكّري جيّدًا.',
    solve: 'الآنَ حُلّي في ورقتِكِ، ثم اختاري الإجابة.',
    order: 'ابدئي بالآحاد، ثم العشرات، ثم المئات.',
    reread: 'اقرئي السؤالَ مرّةً ثانيةً على مَهَل.',
    show: 'هذه هي الإجابةُ الصحيحة، تأمّليها جيّدًا، وسنعودُ إليها بعدَ قليل.',
    review: 'قبلَ التسليم: هل راجعتِ إجابتَكِ؟',
    checkAdd: 'تحقّقي بالجمع: الناتجُ مع المطروحِ يساوي المطروحَ منه.',
    logical: 'هل إجابتُكِ منطقيّة؟',
    done: 'أنهيتِ الجولة! أنتِ تتقدّمين.',
    redo: 'هيّا نُعيدُ الأسئلةَ التي نحتاجُ أن نتدرّبَ عليها.',
    ready: 'أحسنتِ! أنتِ الآنَ جاهزةٌ للاختبارِ بإذنِ الله.',
    ex1: 'في الاختبار: اقرئي بهدوء، وضعي خطًّا تحتَ المطلوب.',
    ex2: 'وإذا لم تفهمي السؤال، فاسألي المعلّمةَ بأدب.',
    ex3: 'وقبلَ أن تسلّمي الورقة، راجعيها من أوّلِها إلى آخرِها.',
    bye: 'وفّقكِ اللهُ يا بطلة.'
  };
  var FL = ["ركّزي هنا، هذه المسائلُ مهمّة، طلبتِ المعلّمةُ منّا التركيزَ عليها.", "قبل أن نحلَّ أيَّ مسألة، نسألُ سؤالًا واحدًا: هل المطلوبُ إجابةٌ تقريبيّة، أم إجابةٌ دقيقة؟", "احفظي هذه الجملة: «تقريبًا» يعني: قَرِّبي.", "كلمةُ «تقريبًا» فيها حروفُ كلمةِ «قرّبي»، فإذا رأيتِها، قرّبي الأعدادَ أوّلًا، ثم احسبي.", "تخيّلي لمبةً صغيرةً تُضيءُ في رأسِكِ كلّما رأيتِ كلمةَ «تقريبًا»، واللمبةُ تقولُ لكِ: قرّبي!", "وإذا رأيتِ: هل يكفي؟ أو: هل يمكنهم؟ تُضيءُ اللمبةُ وتقول: احسبي بالضبط!", "المسألةُ الرابعة: شاركت خمسون طالبةً في رحلةٍ إلى المتحفِ الوطنيّ السعوديّ، منهنّ ستٌّ وثلاثون طالبةً من الصفّ الرابع.", "والسؤال: ما عددُ طالباتِ الصفّ الخامس تقريبًا؟", "رأينا كلمةَ «تقريبًا»، فأضاءتِ اللمبة: قرّبي أوّلًا.", "نقرّبُ ستًّا وثلاثين إلى أقربِ عشرة: الآحادُ ستّة، والستّةُ أكبرُ من خمسة، فنصعدُ إلى العشرةِ التالية، فتصبحُ أربعين.", "الآن نطرح: خمسون ناقصَ أربعين يساوي عشرة.", "إذن عددُ طالباتِ الصفّ الخامس عشرُ طالباتٍ تقريبًا.", "المسألةُ الخامسة: مجموعتان من الطلّاب، الأولى اثنان وتسعون طالبًا، والثانيةُ مئةٌ وسبعةُ طلّاب، والمدرّجُ يتّسعُ لمئتي شخص.", "والسؤال: هل يمكنهم حضورُ الحفل؟", "رأينا: هل يمكنهم؟ فأضاءتِ اللمبة: احسبي بالضبط.", "لماذا لا نقرّبُ هنا؟ لو قرّبنا لصار المجموعُ مئتين، وهو نفسُ عددِ المقاعد، فلا نعرفُ هل يكفي أم لا.", "نجمعُ بالضبط: اثنان وتسعون زائدَ مئةٍ وسبعة يساوي مئةً وتسعةً وتسعين.", "مئةٌ وتسعةٌ وتسعون أقلُّ من مئتين، إذن نعم، يمكنهم حضورُ الحفل، ويبقى مقعدٌ واحدٌ فارغ.", "وفي الاختبار، حتى لو كانتِ الإجابةُ اختيارًا من متعدّد، لا تختاري مباشرة.", "اكتبي فوقَ المسألةِ بقلمِ الرصاص: تقريبيّة أم دقيقة، ثم قرّبي الأعدادَ إذا كان المطلوبُ تقريبًا، ثم احسبي.", "بعدَ أن تكتبي الحلَّ فوقَ المسألة، ابحثي عن إجابتِكِ بين الاختيارات، وضعي عليها دائرة.", "تذكّري دائمًا: «تقريبًا» يعني قرّبي، و«هل يكفي؟» يعني احسبي بالضبط.", "وفي النهاية تحقّقي: هل إجابتُكِ منطقيّة؟", "أحسنتِ! الآن جرّبي مسائلَ شبيهة: مرّةً بالأرقامِ نفسِها، ومرّةً بأرقامٍ جديدة."];
  var LF = { intro: FL[0], ask: FL[1], approx: FL[4], exact: FL[5], rule: [FL[1], FL[2], FL[3], FL[4], FL[5], FL[21]], exam: [FL[18], FL[19], FL[20]] };
  var GOOD = ['ممتازة! قرأتِ، وتمهّلتِ، ثم أجبتِ.', 'أحسنتِ! إجابةٌ صحيحة.', 'برافو عليكِ! هكذا تفعلُ البطلات.', 'رائعة! تمهُّلُكِ صنعَ الفرق.', 'ما شاءَ الله! حلٌّ دقيق.', 'أحسنتِ، لأنكِ تحقّقتِ من إجابتِكِ.'];
  var AGAIN = ['حاولي مرّةً أخرى، أنتِ قادرة.', 'ارجعي إلى الكلمةِ المهمّةِ في السؤال.', 'الخطأُ يعلّمُنا. جرّبي مرّةً أخرى.'];
  var AGAIN_CALC = ['تحقّقي من إعادةِ التجميع، ثم جرّبي من جديد.', 'حاولي مرّةً أخرى، أنتِ قادرة.', 'الخطأُ يعلّمُنا. جرّبي مرّةً أخرى.'];

  // ---------- الصوت ----------
  // صوت مسجَّل فقط — لا يوجد صوت كمبيوتر أبدًا. عنصر صوت واحد يُفتح بأول ضغطة (مهم لآيفون وآيباد).
  var AU = new Audio(), muted = false, queue = [];
  AU.preload = 'auto';
  try { muted = localStorage.getItem('math_mute') === '1'; } catch (e) {}
  function vkey(w) { return String(w).replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^\u0621-\u064A]/g, ''); }
  function stop() { queue = []; try { AU.pause(); } catch (e) {} }
  function say() { stop(); queue = Array.prototype.slice.call(arguments); next(); }
  function next() {
    if (muted || !queue.length) return; var t = queue.shift();
    var f = (window.VMAP || {})[vkey(t)];
    if (!f) return next();
    AU.onended = next; AU.src = 'voice/' + f + '.mp3';
    var p = AU.play(); if (p && p.catch) p.catch(function () {});
  }
  function muteBtn() { $('#mute').textContent = muted ? '🔇' : '🔊'; }
  $('#mute').onclick = function () { muted = !muted; try { localStorage.setItem('math_mute', muted ? '1' : '0'); } catch (e) {} stop(); muteBtn(); };
  muteBtn();

  // ---------- التقدّم (لكل جهاز) ----------
  var KEY = 'math_review_v1', S = { done: {}, wrong: {} };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && s0.done) S = s0; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var BY = {}; M.ITEMS.forEach(function (it) { BY[it.id] = it; });

  // ---------- الأقسام ----------
  var SECS = [
    { k: 'f', ic: '⭐', t: 'ركّزي هنا — هذه مهمة', s: 'طلبت المعلمة منّا التركيز على هذه المسائل (الدرس ٢-٣: التقدير أم الإجابة الدقيقة؟ صفحة ٥٥)', c: '#F59E0B', focus: 1 },
    { k: 'k5', ic: '➖', t: '«تأكَّد» و«تدرّب» — الطرح', s: 'الدرس ٢-٥ (صفحة ٦٤ و٦٥)', c: '#7B5CFF' },
    { k: 'k6', ic: '0️⃣', t: '«تأكَّد» و«تدرّب» — الطرح عبر الأصفار', s: 'الدرس ٢-٦ (صفحة ٦٨ و٦٩)', c: '#0EA5E9' },
    { k: 'w', ic: '📖', t: 'المسائل اللفظية', s: 'التي حلَلْناها مع المعلّمة', c: '#F97316' },
    { k: 'x', ic: '📝', t: 'أسئلة الاختبار ومهارات التفكير', s: 'صفحات ٦٥، ٧٠، ٧١–٧٥', c: '#10B981' }
  ];
  function items(k) { return M.ITEMS.filter(function (i) { return i.sec === k; }); }
  function home() {
    var h = '';
    SECS.forEach(function (s) {
      var its = items(s.k).filter(function (i) { return !i.hidden; }), d = its.filter(function (i) { return S.done[i.id]; }).length;
      h += '<button class="tile blk' + (s.focus ? ' focus' : '') + '" style="--c:' + s.c + '" data-sec="' + s.k + '"><span class="ic">' + s.ic + '</span><span><b>' + s.t + '</b><small>' + s.s + '</small><small class="pr">' + ar(d) + ' / ' + ar(its.length) + ' ✔</small></span></button>';
    });
    var nw = Object.keys(S.wrong).length;
    h += '<button class="tile blk" style="--c:#E11D48" id="quick"><span class="ic">⚡</span><span><b>اختبار سريع</b><small>١٠ مسائل شبيهة مختلطة</small></span></button>';
    h += '<button class="tile blk" style="--c:#64748B" id="mist"' + (nw ? '' : ' disabled') + '><span class="ic">🔁</span><span><b>أسئلة نتدرّب عليها</b><small>' + (nw ? 'عددها: ' + ar(nw) : 'لا توجد الآن') + '</small></span></button>';
    h += '<button class="tile blk" style="--c:#0F766E" id="tips"><span class="ic">💡</span><span><b>نصائح يوم الاختبار</b><small>اقرئيها ليلة الاختبار</small></span></button>';
    $('#secs').innerHTML = h;
    document.querySelectorAll('[data-sec]').forEach(function (b) { b.onclick = function () { secList(b.dataset.sec); }; });
    $('#quick').onclick = function () { stop(); // كل اختبار سريع فيه مسألتا «ركّزي هنا» (٤ و٥) + ٨ من باقي الموقع
      var p = shuffle([BY.f55_4, BY.f55_5].concat(shuffle(M.ITEMS.filter(function (i) { return i.gen && i.sec !== 'f'; })).slice(0, 8))); run(p.map(function (i) { return { it: i, inst: i.gen(), quick: 1 }; }), 'اختبار سريع', true); };
    $('#mist').onclick = function () { stop(); var p = Object.keys(S.wrong).map(function (id) { return BY[id]; }).filter(Boolean); say(L.redo); run(p.map(function (i) { return { it: i, inst: i.gen ? i.gen() : i.orig() }; }), 'أسئلة نتدرّب عليها'); };
    $('#tips').onclick = tips;
    show('home');
  }
  function secList(k) {
    stop();
    var s = SECS.filter(function (x) { return x.k === k; })[0], its = items(k).filter(function (i) { return !i.hidden; });
    $('#secT').textContent = s.t; $('#secS').textContent = s.s;
    var KEYS = '<div class="keys blk"><b>🗝️ إذا جاكِ في السؤال…</b>' +
      '<div class="kg sub"><h4>➖ إذا جاكِ هذي الكلمات ← المطلوب <u>طرح</u></h4><span>يتبقّى · بقي · الباقي</span><span>الفرق بين</span><span>كم يزيد…؟</span><span>كم أكثر…؟ · أكثر ممّا</span><span>كم قلّ…؟ · أقل بـ</span><span>عليها أن… لتُتمّ</span><span>من بينهنّ · منهم (والمطلوب الباقي)</span></div>' +
      '<div class="kg add"><h4>➕ إذا جاكِ هذي الكلمات ← المطلوب <u>جمع</u></h4><span>مجموع</span><span>معًا · كلّهم</span><span>كل تلك القطع</span><span>مجموعتان (والسؤال عنهم كلهم)</span><span>يزيد بمقدار (والمطلوب العدد الجديد)</span></div>' +
      '<div class="kg apx"><h4>💡 إذا جاكِ هذي الكلمة ← المطلوب <u>تقريب</u></h4><span>تقريبًا ← قرّبي الأعداد أولًا، ثم احسبي</span></div>' +
      '<div class="kg exa"><h4>✅ إذا جاكِ هذي الكلمات ← المطلوب <u>إجابة دقيقة</u></h4><span>هل يكفي؟</span><span>هل يمكنهم؟</span><span>بالضبط</span><small>احسبي بالضبط، ثم قارني</small></div>' +
      '<div class="kg warn"><h4>⚠️ انتبهي، هذي تلخبط:</h4><p>«<b>كم يزيد</b>؟» ← ➖ طرح (مو جمع!)</p><p>«<b>إذا أُضيف</b>… <b>أصبح</b>…» ← ➖ طرح (مو جمع!)</p><p>«<b>بقي معها</b>… فكم <b>ثمن</b> الساعة؟» ← ➖ طرح</p></div>' +
      '<div class="kno">وتذكّري: «<b>كم</b>» أو «<b>فكم</b>» تقول لكِ بس: ابحثي عن عدد. ما تعني جمع ولا طرح ولا تقريب.</div></div>';
    var h = k === 'f' ? KEYS + '<div class="rule blk"><b>📌 القاعدة: قبل أن تحلّي اسألي نفسك: تقريبية أم دقيقة؟</b>' +
      '<div class="rr"><span>🎯 في السؤال كلمة <mark>«تقريبًا»</mark><br>← قرّبي الأعداد أولًا، ثم احسبي</span><span>✅ السؤال <mark>«هل يكفي؟ هل يمكنهم؟ بالضبط»</mark><br>← احسبي الإجابة الدقيقة</span></div>' +
      '<div class="lamps"><span class="lampb">💡 «تقريبًا» ← <b>قرّبي!</b></span><span class="lampb">💡 «هل يكفي؟» ← <b>احسبي بالضبط!</b></span></div>' +
      '<button class="btn sm" id="ruleSay">🔊 اسمعي القاعدة</button> <button class="btn sm v" id="typeR">⚡ جولة: تقدير أم دقيقة؟</button></div>' +
      '<div class="exam blk"><b>📝 تعليمة الاختبار — حتى لو كانت الإجابة اختيارًا من متعدّد:</b><ol><li>✏️ اكتبي <b>فوق المسألة</b> بقلم الرصاص: <b>تقريبية أم دقيقة؟</b></li><li>🔢 قرّبي الأعداد (إذا كان المطلوب تقريبًا)، ثم احسبي <b>فوق المسألة</b>.</li><li>⭕ ابحثي عن إجابتكِ بين الاختيارات، وضعي عليها دائرة.</li></ol><button class="btn sm" id="examSay">🔊 اسمعي تعليمة الاختبار</button></div>' : '';
    its.forEach(function (i) {
      var q = i.orig(), txt = (q.q || '').replace(/<[^>]+>/g, '');
      h += '<button class="row blk" data-id="' + i.id + '"><span class="ok">' + (S.done[i.id] ? '✅' : '⬜') + '</span><span class="rt"><small>' + i.src + '</small>' + (q.kind === 'calc' ? '<span class="mini">' + q.big + '</span>' : '<span>' + txt.slice(0, 70) + (txt.length > 70 ? '…' : '') + '</span>') + '</span></button>';
    });
    $('#rows').innerHTML = h;
    if (k === 'f') {
      say(LF.intro);
      $('#ruleSay').onclick = function () { say.apply(null, LF.rule); };
      $('#examSay').onclick = function () { say.apply(null, LF.exam); };
      $('#typeR').onclick = function () { var t = BY.f55_t, p = []; for (var i = 0; i < 6; i++) p.push({ it: t, inst: t.gen() }); run(p, 'تقدير أم دقيقة؟'); };
    }
    document.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { var it = BY[b.dataset.id]; if (it.gen) example(it); else run([{ it: it, inst: it.orig() }], it.src); }; });
    $('#all').onclick = function () { var p = its.map(function (i) { return { it: i, inst: i.gen ? i.gen() : i.orig() }; }); if (k === 'x') p = shuffle(p);
      if (k === 'f') p = [{ it: BY.f55_4, inst: BY.f55_4.orig() }, { it: BY.f55_5, inst: BY.f55_5.orig() }, { it: BY.f55_4, inst: BY.f55_4.gen() }, { it: BY.f55_5, inst: BY.f55_5.gen() }, { it: BY.f55_4, inst: BY.f55_4.gen() }, { it: BY.f55_5, inst: BY.f55_5.gen() }];
      run(p, s.t); };
    $('#all').textContent = k === 'x' ? '▶ حلّي كل الأسئلة' : '▶ تدرّبي على مسائل شبيهة بالكل';
    show('sec'); $('#sec').dataset.k = k;
  }
  $('#secBack').onclick = home;

  // ---------- المثال المحلول (أفهم، أخطّط، أحلّ، أتحقّق) ----------
  function example(it) {
    stop();
    var q = it.orig();
    $('#exSrc').textContent = it.src;
    var h = '<div class="qtext">' + q.q + '</div>' + table(q.table) + (q.big ? '<div class="big">' + q.big + '</div>' : '');
    var st = [['١', 'أفهم', q.steps.fahm], ['٢', 'أخطّط', q.steps.plan], ['٣', 'أحلّ', q.steps.hal], ['٤', 'أتحقّق', q.steps.check]];
    h += '<div class="steps">' + st.map(function (s, i) { return '<div class="step blk" data-i="' + i + '"><button class="sh"><span class="n">' + s[0] + '</span> ' + s[1] + ' <span class="tap">اضغطي لتري</span></button><div class="sb hidden">' + s[2] + '</div></div>'; }).join('') + '</div>';
    if (it.sayEx) h = '<button class="btn sm v exsay" id="exSay">🔊 اسمعي شرح المسألة</button>' + h;
    if (it.sayEx) h = h.replace('<mark>تقريبًا</mark>', '<mark>تقريبًا</mark><span class="lampon sm">💡 قرّبي!</span>').replace('<mark>فهل يمكنهم ذلك؟</mark>', '<mark>فهل يمكنهم ذلك؟</mark><span class="lampon sm">💡 احسبي بالضبط!</span>');
    $('#exBody').innerHTML = h;
    if (it.sayEx) $('#exSay').onclick = function () { say.apply(null, it.sayEx); };
    $('#exBody').querySelectorAll('.step').forEach(function (d) { d.querySelector('.sh').onclick = function () { d.querySelector('.sb').classList.toggle('hidden'); d.classList.toggle('open'); }; });
    $('#exGo').onclick = function () { run([{ it: it, inst: it.gen() }, { it: it, inst: it.gen() }], it.src + ' — مسائل شبيهة'); };
    $('#exBack').onclick = function () { secList(it.sec); };
    show('ex');
  }
  function table(t) {
    if (!t) return '';
    return '<table class="dt"><caption>' + t.t + '</caption><tr>' + t.h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>' + t.r.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + (typeof x === 'number' ? ar(x) : x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
  }

  // ---------- جولة أسئلة ----------
  var R = null;
  function run(list, title, quick) {
    R = { list: list, i: 0, ok: 0, first: 0, title: title, quick: !!quick, back: !$('#sec').classList.contains('hidden') ? $('#sec').dataset.k : (!$('#ex').classList.contains('hidden') && list[0] ? list[0].it.sec : null) };
    R.total = list.length; ask();
  }
  function fmt(v) { return typeof v === 'number' ? ar(v) : v; }
  function ask() {
    stop();
    if (R.i >= R.list.length) return finish();
    var Q = R.list[R.i], q = Q.inst, it = Q.it;
    Q.tries = 0; show('q');
    $('#qTitle').textContent = R.title;
    $('#qProg').textContent = ar(Math.min(R.i + 1, R.list.length)) + ' / ' + ar(R.list.length);
    $('#qSrc').textContent = it.hidden ? 'المطلوب: تقريبية أم دقيقة؟' : Q.retry ? '🔁 نعيدها' : (Q.inst === null ? '' : (it.gen && !Q.orig ? 'مسألة شبيهة بـ ' + it.src : it.src));
    var h = '<div class="qtext">' + q.q + '</div>' + table(q.table) + (q.big ? '<div class="big">' + q.big + '</div>' : '');
    $('#qBody').innerHTML = h;
    $('#qStage').innerHTML = '';
    $('#qFoot').innerHTML = '';
    // زر «قرأتُ السؤال» يظهر بعد وقت القراءة
    var len = (q.q || '').replace(/<[^>]+>/g, '').length + (q.table ? 60 : 0);
    var ms = Math.max(2500, Math.min(9000, len * 55));
    var b = el('<button class="btn read" disabled><span class="fill"></span><span class="lb">📖 أقرأ السؤال على مهل…</span></button>');
    $('#qStage').appendChild(b);
    b.querySelector('.fill').style.transitionDuration = ms + 'ms';
    setTimeout(function () { b.classList.add('go'); }, 30);
    if (R.i === 0 || Math.random() < .35) say(L.read);
    setTimeout(function () { b.disabled = false; b.querySelector('.lb').textContent = '✔ قرأتُ السؤال'; }, ms);
    b.onclick = function () { b.remove(); if (q.kind === 'word' && !R.quick) needStage(); else ansStage(); };
  }
  function choice(title, list, okIdx, onOk, onBad) {
    var box = el('<div class="stage"><h3>' + title + '</h3><div class="opts"></div><div class="msg"></div></div>');
    var order = shuffle(list.map(function (x, i) { return i; }));
    order.forEach(function (i) {
      var o = el('<button class="opt blk">' + fmt(list[i]) + '</button>');
      o.onclick = function () {
        if (o.disabled) return;
        if (i === okIdx) { o.classList.add('good'); box.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; }); onOk(box); }
        else { o.classList.add('bad'); o.disabled = true; onBad(box, o); }
      };
      box.querySelector('.opts').appendChild(o);
    });
    $('#qStage').appendChild(box); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return box;
  }
  function needStage() {
    var q = R.list[R.i].inst;
    say(L.need);
    choice('🎯 ما المطلوب في السؤال؟', q.need, 0, function (box) {
      box.querySelector('.msg').innerHTML = '<span class="g">✔ صحيح، هذا هو المطلوب.</span>';
      opStage();
    }, function (box) { box.querySelector('.msg').innerHTML = '<div class="why blk"><b>🤔 ليس هذا هو المطلوب.</b><br>هذه معلومة أو سؤال آخر. ابحثي في آخر السؤال عن كلمة «كم» أو «ما» أو «مَن»: الذي بعدها هو المطلوب.</div><span class="r">' + L.reread + '</span>'; say(L.reread); });
  }
  function opStage() {
    var q = R.list[R.i].inst, std = ['طرح', 'جمع', 'جمع ثم طرح'];
    var list = q.opList || (std.indexOf(q.op) >= 0 ? std : [q.op, 'جمع', 'طرح']);
    say(q.opList ? LF.ask : L.op);
    choice(q.opTitle || '🧮 ماذا نستعمل؟', list, list.indexOf(q.op), function (box) {
      box.querySelector('.msg').innerHTML = (q.opList ? '<div class="lampon">💡 ' + (q.op === 'إجابة تقريبية' ? 'قرّبي!' : 'احسبي بالضبط!') + '</div>' : '') + '<span class="g">✔ ' + (q.opWhy || '') + '</span>';
      ansStage();
    }, function (box, o) { if (q.opHint) { box.querySelector('.msg').innerHTML = '<div class="why blk"><b>🤔 فكّري مرة ثانية.</b><br>' + q.opHint + '</div>'; say(q.op === 'إجابة تقريبية' ? LF.approx : LF.exact); return; }
      box.querySelector('.msg').innerHTML = '<div class="why blk"><b>🤔 فكّري مرة ثانية.</b><br>انظري إلى الكلمة الملوّنة في السؤال: «يتبقّى، الباقي، الفرق، يزيد، أقلّ» تدلّ على الطرح، و«المجموع، الكل، معًا» تدلّ على الجمع.</div><span class="r">' + L.reread + '</span>'; say(L.reread); });
  }
  function ansStage() {
    var Q = R.list[R.i], q = Q.inst;
    say(q.kind === 'calc' ? L.order : L.solve);
    var box = el('<div class="stage"><h3>✏️ ' + (q.opList ? 'اكتبي الحل في ورقتكِ <u>فوق المسألة</u> أولًا، ثم اختاري:' : q.kind === 'mc' ? 'اختاري الإجابة:' : 'حُلّي في ورقتكِ، ثم اختاري الإجابة:') + '</h3><div class="opts"></div><div class="msg"></div></div>');
    var order = shuffle(q.opts.map(function (x, i) { return i; }));
    order.forEach(function (i) {
      var o = el('<button class="opt blk" data-i="' + i + '">' + fmt(q.opts[i]) + '</button>');
      o.onclick = function () { if (o.disabled || box.dataset.lock) return; box.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('sel'); }); o.classList.add('sel'); confirmBar(box, o, i === 0); };
      box.querySelector('.opts').appendChild(o);
    });
    $('#qStage').appendChild(box); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function confirmBar(box, o, ok) {
    var Q = R.list[R.i], q = Q.inst;
    say(L.review);
    $('#qFoot').innerHTML = '<div class="conf blk"><b>🔍 قبل التسليم: هل راجعتِ إجابتكِ؟</b><small>' + (q.kind === 'calc' ? 'تحقّقي بالجمع: الناتج + المطروح = المطروح منه' : 'هل إجابتكِ منطقيّة؟') + '</small><div class="cb"><button class="btn g" id="yes">✔ نعم، أسلّم</button><button class="btn w" id="no">↩ أراجع</button></div></div>';
    $('#no').onclick = function () { $('#qFoot').innerHTML = ''; o.classList.remove('sel'); stop(); };
    $('#yes').onclick = function () { $('#qFoot').innerHTML = ''; judge(box, o, ok); };
  }
  function judge(box, o, ok) {
    var Q = R.list[R.i], q = Q.inst, it = Q.it, msg = box.querySelector('.msg');
    Q.tries++;
    if (ok) {
      o.classList.remove('sel'); o.classList.add('good'); box.dataset.lock = 1;
      R.ok++; if (Q.tries === 1) R.first++;
      S.done[it.id] = 1; if (Q.tries === 1 && Q.retry) delete S.wrong[it.id]; save();
      var g = pick(GOOD); say(g);
      msg.innerHTML = '<div class="praise">🌟 ' + g + '</div>';
      afterAnswer(q, false);
    } else if (Q.tries < 2) {
      o.classList.remove('sel'); o.classList.add('bad'); o.disabled = true;
      var a = pick(q.kind === 'calc' ? AGAIN_CALC : AGAIN);
      say(a, L.reread);
      msg.innerHTML = '<div class="why blk"><b>🤔 لماذا ليست ' + fmt(q.opts[+o.dataset.i]) + '؟</b><br>' + whyWrong(q, q.opts[+o.dataset.i]) + '</div><div class="again">💪 ' + a + '<br>' + L.reread + '</div>';
    } else {
      o.classList.remove('sel'); o.classList.add('bad'); box.dataset.lock = 1;
      box.querySelectorAll('.opt').forEach(function (x) { if (x.dataset.i === '0') x.classList.add('good'); });
      S.wrong[it.id] = 1; save();
      if (!Q.retry && !R.quick) R.list.push({ it: it, inst: it.gen ? it.gen() : it.orig(), retry: 1 });
      say(L.show);
      msg.innerHTML = '<div class="why blk"><b>🤔 لماذا ليست ' + fmt(q.opts[+o.dataset.i]) + '؟</b><br>' + whyWrong(q, q.opts[+o.dataset.i]) + '</div><div class="again">👀 ' + L.show + '</div>';
      afterAnswer(q, true);
    }
  }
  // لماذا هذه الإجابة خطأ؟ — شرح يظهر تحت الخيار مباشرة
  var PL = { 10: 'العشرات', 100: 'المئات', 1000: 'الألوف', 10000: 'عشرات الألوف' };
  function whyWrong(q, v) {
    var w = q.wr && q.wr[v]; if (w) return w;
    if (q.sub && typeof v === 'number') {
      var a = q.sub.a, b = q.sub.b, ans = a - b, d = Math.abs(v - ans), t = '';
      if (v === a + b) t = 'هذا ناتج الجمع، لكن السؤال يحتاج طرحًا. ';
      else if (v === M.noBorrow(a, b)) t = 'يبدو أنكِ طرحتِ الرقم الأصغر من الأكبر في كل منزلة. لكن إذا كان الرقم العلوي أصغر، نعيد التجميع: نستلف من المنزلة التي على اليسار. ';
      else if (PL[d]) t = 'قريبة جدًا! الخطأ في منزلة ' + PL[d] + ': راجعي إعادة التجميع (الاستلاف) في هذه المنزلة. ';
      return t + 'تحقّقي بالجمع: ' + M.eq(v + ' + ' + b + ' = ' + (v + b)) + '، وليس ' + M.N(a) + '.';
    }
    return q.hint || 'ارجعي إلى الكلمة الملوّنة في السؤال، واقرئي المطلوب بالضبط.';
  }
  function afterAnswer(q, open) {
    var sol = q.steps ? '<b>١ أفهم:</b> ' + q.steps.fahm + '<br><b>٢ أخطّط:</b> ' + q.steps.plan + '<br><b>٣ أحلّ:</b><br>' + q.steps.hal + '<b>٤ أتحقّق:</b> ' + q.steps.check : (q.why || '');
    var f = el('<div class="after"><button class="btn w" id="solB">💡 ' + (open ? 'الحل' : 'اعرضي الحل') + '</button><div class="sol blk' + (open ? '' : ' hidden') + '">' + sol + '</div><button class="btn g" id="nextB">التالي ⬅</button></div>');
    $('#qStage').appendChild(f);
    if (open) f.querySelector('#solB').classList.add('hidden');
    f.querySelector('#solB').onclick = function () { f.querySelector('.sol').classList.toggle('hidden'); };
    f.querySelector('#nextB').onclick = function () { R.i++; ask(); };
    f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function finish() {
    var n = R.list.length, nw = Object.keys(S.wrong).length;
    $('#endT').textContent = L.done;
    $('#endS').innerHTML = (R.quick ? 'صحيح من أوّل محاولة: <b>' + ar(R.first) + '</b> من <b>' + ar(n) + '</b><br>' : '') + (nw ? 'أسئلة نتدرّب عليها: ' + ar(nw) + '. تجدينها في زرّ 🔁 في الصفحة الرئيسية.' : L.ready);
    say(L.done, nw ? L.redo : L.ready);
    $('#endHome').onclick = home;
    $('#endBack').classList.toggle('hidden', !R.back);
    $('#endBack').onclick = function () { secList(R.back); };
    show('end');
  }
  $('#qBack').onclick = function () { stop(); if (R && R.back) secList(R.back); else home(); };

  function tips() {
    stop();
    var t = [L.remind, L.ex1, L.ex2, L.ex3, L.logical, L.checkAdd, L.bye];
    $('#tipsBody').innerHTML = t.map(function (x) { return '<div class="tip blk">' + x + '</div>'; }).join('');
    $('#tipsPlay').onclick = function () { say.apply(null, t); };
    show('tips');
  }
  $('#tipsBack').onclick = home;
  document.querySelectorAll('.homeB').forEach(function (b) { b.onclick = function () { stop(); home(); }; });

  // ---------- البداية ----------
  $('#go').onclick = function () { say(L.bism, L.dua, L.hello, L.today, L.remind); home(); };
  $('#dua').onclick = function () { say(L.dua); };
  show('start');
})();
