/* Science review app: review (question → reveal) and solve-alone modes, in the exact order of the test.
   Voices = the mother's earlier recordings only (no computer voice). Animal sounds from her sound pack. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const D = window.DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- sound ---------------- */
  let muted = false, unlocked = false, voice = null;
  const cache = {};
  const PRAISE = ['v12', 'v13', 'v14', 'v15', 'v16', 'v11'], RETRY = ['v17', 'v18', 'v21'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function howl(src) { return cache[src] || (cache[src] = new Howl({ src: [src], preload: true })); }
  function unlock() {
    if (unlocked) return; unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try { if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume(); } catch (e) {}
  }
  function play(src, onend) {
    if (!unlocked) return null;
    const h = howl(src); const id = h.play();
    (window.__sndLog = window.__sndLog || []).push(src.split('/').pop());
    if (onend) h.once('end', onend, id);
    return { h, id };
  }
  function say(name, onend) { stopVoice(); voice = play('audio/voice/' + name + '.mp3', onend); }
  /* explanation narration: audio/why/NN.mp3, NN = the item's place in the paper (01..41) */
  const WHY_N = new Map(); { let n = 0; D.tests.forEach(t => t.parts.forEach(p => (p.type === 'order' ? [p] : p.items).forEach(it => WHY_N.set(it, ++n)))); }
  const whySrc = st => { const n = WHY_N.get(st.item); return n ? 'audio/why/' + String(n).padStart(2, '0') + '.mp3' : null; };
  function sayWhy(st) { const src = whySrc(st); if (src) { stopVoice(); voice = play(src); } }
  function stopVoice() { if (voice) { voice.h.stop(voice.id); voice = null; } }
  const sfx = n => play('audio/ui/' + n + '.mp3');
  const animal = n => play('audio/animals/' + n + '.mp3');
  document.addEventListener('pointerdown', unlock, { capture: true });
  $('#muteBtn').addEventListener('click', () => {
    muted = !muted; Howler.mute(muted);
    $('#muteBtn').textContent = muted ? '🔇' : '🔊'; $('#muteBtn').setAttribute('aria-label', muted ? 'تشغيل الصوت' : 'كتم الصوت');
  });
  $('#homeBtn').addEventListener('click', () => { stopVoice(); home(); });

  /* ---------------- flatten tests into steps (same order as the paper) ---------------- */
  function stepsOf(test) {
    const out = [];
    test.parts.forEach((p, pi) => {
      if (p.type === 'order') out.push({ part: p, item: p, pi, ii: 0, first: true });
      else p.items.forEach((it, ii) => out.push({ part: p, item: it, pi, ii, first: ii === 0 }));
    });
    return out;
  }

  /* ---------------- home ---------------- */
  function home() {
    closeScene(); $('#topTitle').textContent = 'مراجعة العلوم';
    app.innerHTML = `
      <section class="hero">
        <img src="img/fe/1f52c.webp" alt="" class="hero-img">
        <h1>${esc(D.title)}</h1>
        <p>نفس أسئلة اختبار الفترة الأولى ١٤٤٨هـ وبنفس الترتيب: نراجع أولًا، ثم تحلّين وحدك.</p>
        <button class="big" id="startBtn" type="button">▶ ابدئي بـ«بسم الله»</button>
      </section>
      <section class="grid">
        <div class="card"><h2>١) المراجعة</h2><p>السؤال، ثم اكشفي الإجابة وشاهدي الشرح.</p>
          ${D.tests.map(t => `<button class="go" data-go="review:${t.id}" type="button">📖 ${esc(t.name)}</button>`).join('')}</div>
        <div class="card"><h2>٢) حلّي بنفسك</h2><p>نفس الأسئلة فارغة، اختاري الإجابة.</p>
          ${D.tests.map(t => `<button class="go" data-go="solve:${t.id}" type="button">✏️ ${esc(t.name)}</button>`).join('')}</div>
        <div class="card lab"><h2>🔬 مختبر الخلية</h2><p>خلية حيوانية ونباتية ثلاثية الأبعاد: دوّري، كبّري، افصلي الأجزاء.</p>
          <button class="go" data-go="lab" type="button">افتحي المختبر</button>
          <div class="chips"><button class="chip" data-scene="animal:fish" type="button">🐟 مجسّم السمكة</button><button class="chip" data-scene="animal:sheep" type="button">🐑 مجسّم الخروف</button></div></div>
        <div class="card"><h2>🎬 المشاهد المتحركة</h2><div class="chips">
          ${[['levels', 'مستويات التنظيم'], ['kingdoms', 'الممالك الست'], ['taxonomy', 'المملكة أكبر مجموعة'], ['backbone', 'فقاريات ولا فقاريات'], ['snake', 'الثعبان'], ['frog', 'الضفدع'], ['fish', 'الأسماك'], ['arthropods', 'المفصليات'], ['jelly', 'اللاسعات'], ['shells', 'الرخويات'], ['bat', 'الخفاش'], ['feathers', 'الريش والحراشف'], ['temp', 'حرارة الجسم'], ['heredity', 'الوراثة'], ['plantfood', 'النبات يصنع غذاءه']]
            .map(([k, n]) => `<button class="chip" data-scene="${k}" type="button">${n}</button>`).join('')}</div></div>
        <div class="card"><h2>📝 قبل الاختبار</h2><button class="go" data-go="tips" type="button">نصائح الاختبار</button>
          <button class="go soft" data-go="friends" type="button">💛 رسالة إلى صديقاتي</button></div>
      </section>
      <section><details class="credits"><summary>مصادر المجسّمات والصور</summary>
        <p>الخلية الحيوانية والنباتية: مجسّمان صُنعا في برنامج Blender لهذا الموقع، وفيهما الأجزاء المذكورة في الورقة فقط، وألوانهما للتوضيح.</p>
        <p>السمكة: مجسّم «Barramundi Fish» من مجموعة Khronos (رخصة CC0 مجانية). الخروف: من مجموعة Quaternius للحيوانات (رخصة CC0 مجانية).</p>
        <p>صور الحيوانات: Fluent Emoji من مايكروسوفت (رخصة MIT). الأصوات: تسجيلات صاحبة المشروع.</p></details>
      </section>`;
    $('#startBtn').onclick = () => { unlock(); say('v01', () => say('v02')); };
    app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      unlock(); sfx('click'); const [m, id] = b.dataset.go.split(':');
      if (m === 'lab') return lab(); if (m === 'tips') return tips(); if (m === 'friends') return friends();
      run(m, D.tests.find(t => t.id === id));
    });
    app.querySelectorAll('[data-scene]').forEach(b => b.onclick = () => { unlock(); openScene(b.dataset.scene, b.textContent); });
  }

  /* ---------------- quiz runner ---------------- */
  let S = null;
  function run(mode, test, only) {
    const all = stepsOf(test);
    S = { mode, test, steps: only || all, i: 0, wrong: 0, mistakes: [], score: 0, retry: !!only };
    $('#topTitle').textContent = (mode === 'review' ? 'المراجعة: ' : 'حلّي بنفسك: ') + test.name.split(':')[0];
    show();
  }
  function show() {
    stopVoice(); const st = S.steps[S.i]; if (!st) return finish();
    S.wrong = 0; const p = st.part, it = st.item, mode = S.mode;
    const prog = `<div class="prog"><i style="width:${(S.i / S.steps.length) * 100}%"></i></div><div class="cnt">${S.i + 1} / ${S.steps.length}</div>`;
    app.innerHTML = `${prog}
      <section class="q">
        <div class="ptitle">${esc(p.title)} ${p.voice ? `<button class="ic sm" id="pv" type="button" aria-label="اسمعي المطلوب">🔊</button>` : ''}</div>
        <div class="qbody" id="qbody"></div>
        <div class="fb" id="fb" aria-live="polite"></div>
        <div class="acts" id="acts"></div>
      </section>`;
    if (p.voice) $('#pv').onclick = () => say(p.voice);
    if (st.first && p.voice && S.i > 0) setTimeout(() => say(p.voice), 250);
    RENDER[p.type](st, $('#qbody'));
    const acts = $('#acts');
    if (mode === 'review') addBtn(acts, '👀 اكشفي الإجابة', 'reveal', () => reveal(st));
    addBtn(acts, S.i ? '▶ السابق' : '🏠 الرئيسية', 'soft', () => { if (S.i) { S.i--; show(); } else home(); });
    gsap.from('.q', { y: 14, opacity: 0, duration: 0.35 });
  }
  function addBtn(box, text, cls, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = text; b.onclick = fn; box.appendChild(b); return b; }
  function nextBtn() {
    const acts = $('#acts'); acts.querySelector('.reveal')?.remove();
    if (!acts.querySelector('.next')) addBtn(acts, S.i === S.steps.length - 1 ? 'إنهاء ✓' : 'التالي ◀', 'next', () => { S.i++; show(); });
  }
  function explain(st, ok) {
    const it = st.item, p = st.part, scene = it.scene || p.scene;
    const fb = $('#fb'); fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = `<p>${ok ? '✔️ ' : '💡 '}${esc(it.why || p.why || '')}</p>` + (scene ? `<button class="btn scene" type="button">🎬 شاهدي الشرح المتحرك</button>` : '');
    if (whySrc(st)) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn why'; b.textContent = '🔊 اسمعي الشرح'; b.onclick = () => { unlock(); sayWhy(st); }; fb.querySelector('p').after(b); }
    if (scene) fb.querySelector('.scene').onclick = () => openScene(scene, '', it.focus || it.key);
    (it.model || []).forEach(m => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn model';
      b.textContent = '🧊 مجسّم ' + (m === 'fish' ? 'السمكة' : 'الخروف'); b.onclick = () => openScene('animal:' + m); fb.appendChild(b); });
    gsap.from(fb, { opacity: 0, y: 8, duration: 0.3 });
  }
  function correct(st) {
    sfx('chime'); say(pick(PRAISE), () => sayWhy(st)); if (S.wrong === 0) S.score++;
    explain(st, true); lock(); nextBtn();
  }
  function wrong(st, el) {
    S.wrong++; sfx('pop'); if (el) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' });
    if (S.wrong === 1) { say(pick(RETRY)); const fb = $('#fb'); fb.className = 'fb bad'; fb.innerHTML = '<p>ليست هذه. فكّري مرة أخرى 💭</p>'; return; }
    if (!S.mistakes.includes(st)) S.mistakes.push(st);
    say('v22', () => sayWhy(st)); reveal(st, true);
  }
  function lock() { app.querySelectorAll('#qbody button').forEach(b => b.disabled = true); }
  function reveal(st, afterWrong) {
    REVEAL[st.part.type](st); explain(st, !afterWrong); lock(); nextBtn();
    if (!afterWrong) { sfx('chime'); sayWhy(st); }
  }
  const interactive = () => S.mode === 'solve';

  /* ---------------- renderers per question type ---------------- */
  const RENDER = {}, REVEAL = {};
  const blank = q => esc(q).replace('______', '<span class="blank" id="blank">…………</span>');

  RENDER.fill = (st, box) => {
    box.innerHTML = `<p class="qtext">${blank(st.item.q)}</p><div class="bank">${st.part.bank.map(w => `<button class="opt" type="button" data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    if (st.item.sound) soundBtn(box, st.item.sound);
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (!interactive()) return;
      if (b.dataset.v === st.item.ans) { b.classList.add('right'); $('#blank').textContent = st.item.ans; $('#blank').classList.add('filled'); correct(st); }
      else { b.classList.add('wrongc'); wrong(st, b); }
    });
  };
  REVEAL.fill = st => { const b = [...app.querySelectorAll('.opt')].find(x => x.dataset.v === st.item.ans); b && b.classList.add('right'); $('#blank').textContent = st.item.ans; $('#blank').classList.add('filled'); };

  RENDER.tf = (st, box) => {
    box.innerHTML = `<p class="qtext">${esc(st.item.q)}</p><div class="tf"><button class="opt tfb" type="button" data-v="1">✓ صح</button><button class="opt tfb" type="button" data-v="0">✗ خطأ</button></div>`;
    if (st.item.sound) soundBtn(box, st.item.sound);
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (!interactive()) return;
      if ((b.dataset.v === '1') === st.item.ans) { b.classList.add('right'); correct(st); } else { b.classList.add('wrongc'); wrong(st, b); }
    });
  };
  REVEAL.tf = st => app.querySelector(`.tfb[data-v="${st.item.ans ? 1 : 0}"]`).classList.add('right');

  RENDER.mcq = (st, box) => {
    const it = st.item, L = ['أ', 'ب', 'ج', 'د'];
    box.innerHTML = `<p class="qtext">${esc(it.q)}</p><div class="mcq">${it.opts.map((o, i) => {
      const t = typeof o === 'string' ? o : o.t; const im = typeof o === 'string' ? '' : `<img src="${o.img}" alt="">`;
      return `<button class="opt mc" type="button" data-i="${i}"><span class="L">${L[i]}</span>${im}<span>${esc(t)}</span></button>`; }).join('')}</div>`;
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (!interactive()) return;
      if (+b.dataset.i === it.ans) { b.classList.add('right'); correct(st); } else { b.classList.add('wrongc'); wrong(st, b); }
    });
  };
  REVEAL.mcq = st => app.querySelector(`.mc[data-i="${st.item.ans}"]`).classList.add('right');

  RENDER.match = (st, box) => {
    const it = st.item;
    box.innerHTML = `<div class="mleft">${it.img ? `<img src="${it.img}" alt="" class="anim">` : ''}<p class="qtext">${esc(it.q)}</p></div>
      <p class="hint">${esc(st.part.hint || 'اختاري ما يناسبها:')}</p>
      <div class="mright">${st.part.right.map(r => `<button class="opt" type="button" data-k="${r.k}"><span class="L">${r.k}</span> ${esc(r.t)}</button>`).join('')}</div>`;
    if (it.sound) soundBtn(box, it.sound);
    const im = box.querySelector('.anim'); if (im) gsap.to(im, { y: -6, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (!interactive()) return;
      if (b.dataset.k === it.ans) { b.classList.add('right'); correct(st); } else { b.classList.add('wrongc'); wrong(st, b); }
    });
  };
  REVEAL.match = st => app.querySelector(`.mright [data-k="${st.item.ans}"]`).classList.add('right');

  RENDER.tick = (st, box) => {
    const it = st.item, cols = st.part.cols;
    box.innerHTML = `<p class="qtext">ضعي ✓ أو ✗: <b>${esc(it.part)}</b></p>
      <div class="tick">${cols.map((c, ci) => `<div class="tcol"><div class="tch">${esc(c)}</div>
        <div class="tbtns"><button class="opt tk" type="button" data-c="${ci}" data-v="1">✓</button><button class="opt tk" type="button" data-c="${ci}" data-v="0">✗</button></div>
        <div class="tnote" data-n="${ci}"></div></div>`).join('')}</div>
      <button class="btn check" type="button" id="tcheck" ${interactive() ? '' : 'hidden'}>تحقّقي</button>`;
    const sel = [null, null];
    box.querySelectorAll('.tk').forEach(b => b.onclick = () => {
      if (!interactive()) return; const c = +b.dataset.c; sel[c] = b.dataset.v === '1'; sfx('click');
      box.querySelectorAll(`.tk[data-c="${c}"]`).forEach(x => x.classList.toggle('sel', x === b));
    });
    $('#tcheck', box).onclick = () => {
      if (sel.includes(null)) { const fb = $('#fb'); fb.className = 'fb bad'; fb.innerHTML = '<p>اختاري ✓ أو ✗ في الخانتين.</p>'; return; }
      if (sel[0] === it.ans[0] && sel[1] === it.ans[1]) { REVEAL.tick(st); correct(st); $('#tcheck').hidden = true; }
      else wrong(st, box.querySelector('.tick'));
    };
  };
  REVEAL.tick = st => {
    st.item.ans.forEach((v, c) => { app.querySelectorAll(`.tk[data-c="${c}"]`).forEach(x => x.classList.toggle('right', (x.dataset.v === '1') === v));
      if (st.item.note) app.querySelector(`.tnote[data-n="${c}"]`).textContent = st.item.note[c]; });
    const t = $('#tcheck'); if (t) t.hidden = true;
  };

  RENDER.order = (st, box) => {
    const ans = st.part.ans, sh = ans.slice().sort(() => Math.random() - 0.5);
    box.innerHTML = `<p class="qtext">رتّبي من الأصغر إلى الأكبر (اضغطي بالترتيب):</p>
      <div class="slots">${ans.map((_, i) => `<span class="slot" data-s="${i}">${i + 1}</span>`).join('<span class="arr">←</span>')}</div>
      <div class="bank">${sh.map(w => `<button class="opt" type="button" data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    let k = 0;
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (!interactive()) return;
      if (b.dataset.v === ans[k]) { b.classList.add('right'); b.disabled = true; const sl = box.querySelector(`[data-s="${k}"]`); sl.textContent = ans[k]; sl.classList.add('filled'); sfx('click'); k++; if (k === ans.length) correct(st); }
      else { b.classList.add('wrongc'); setTimeout(() => b.classList.remove('wrongc'), 600); wrong(st, b); }
    });
  };
  REVEAL.order = st => st.part.ans.forEach((w, i) => { const sl = app.querySelector(`[data-s="${i}"]`); sl.textContent = w; sl.classList.add('filled'); });

  function soundBtn(box, name) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn snd'; b.textContent = '🔊 اسمعي صوت الحيوان';
    b.onclick = () => animal(name); box.appendChild(b);
  }

  /* ---------------- end of test ---------------- */
  function finish() {
    const n = S.steps.length, solve = S.mode === 'solve';
    say('v26');
    app.innerHTML = `<section class="end"><img src="img/fe/1f3c6.webp" alt="" class="hero-img">
      <h2>${solve ? `أحسنتِ! صحيح من أول مرة: ${S.score} من ${n}` : 'انتهت المراجعة 🌟'}</h2>
      <div class="acts" id="eacts"></div></section>`;
    gsap.from('.end .hero-img', { scale: 0, rotation: -20, duration: 0.7, ease: 'back.out(1.8)' });
    const a = $('#eacts');
    if (solve && S.mistakes.length) addBtn(a, `🔁 أعيدي الأسئلة التي أخطأتِ فيها (${S.mistakes.length})`, 'next', () => { const m = S.mistakes.slice(); say('v27'); run('solve', S.test, m); });
    if (!solve) addBtn(a, '✏️ الآن حلّي بنفسك', 'next', () => run('solve', S.test));
    const other = D.tests.find(t => t !== S.test); if (other) addBtn(a, '➡️ ' + other.name, 'soft', () => run(S.mode, other));
    addBtn(a, '🏠 الرئيسية', 'soft', home);
  }

  function tips() {
    $('#topTitle').textContent = 'قبل الاختبار';
    const T = [['v29', 'في الاختبار: اقرئي بهدوء، وضعي خطًّا تحت المطلوب.'], ['v30', 'وإذا لم تفهمي السؤال، فاسألي المعلّمة بأدب.'], ['v31', 'وقبل أن تسلّمي الورقة، راجعيها من أولها إلى آخرها.'], ['v32', 'وفّقكِ الله يا بطلة.']];
    app.innerHTML = `<section class="card wide"><h2>📝 نصائح الاختبار</h2>${T.map(([v, t]) => `<button class="tip" type="button" data-v="${v}">🔊 ${t}</button>`).join('')}</section>`;
    app.querySelectorAll('.tip').forEach(b => b.onclick = () => say(b.dataset.v));
    let i = 0; const next = () => { if (i < T.length) say(T[i++][0], next); }; next();
  }
  function friends() {
    const F = D.friends; $('#topTitle').textContent = 'رسالة';
    app.innerHTML = `<section class="card wide friends"><img src="img/fe/1f467.webp" alt="" class="hero-img"><h2>${esc(F.title)}</h2>
      ${F.lines.map(l => `<p>${esc(l)}</p>`).join('')}<p class="hadith">${esc(F.hadith)}</p><p class="sign">${esc(F.sign)}</p></section>`;
    gsap.from('.friends > *', { opacity: 0, y: 12, stagger: 0.15, duration: 0.5 });
  }

  /* ---------------- 3D cell lab ---------------- */
  let cell = null;
  function cellReady(fn) { if (window.mountCell) fn(); else window.addEventListener('cell3d-ready', fn, { once: true }); }
  function labHTML(compact) {
    return `<div class="lab-wrap ${compact ? 'compact' : ''}">
      <div class="seg" role="group" aria-label="نوع الخلية">
        <button type="button" data-m="animal" class="on">🐑 خلية حيوانية</button><button type="button" data-m="plant">🌿 خلية نباتية</button><button type="button" data-m="compare">⚖️ مقارنة</button></div>
      <div class="c3" id="c3"><div class="c3-hint">حرّكي بإصبعك للتدوير، وبإصبعين للتكبير. اضغطي على أي جزء.</div></div>
      <div class="c3-tools">
        <button type="button" class="btn" data-t="explode">🧩 افصلي الأجزاء</button><button type="button" class="btn" data-t="cut">✂️ مقطع للداخل</button>
        <button type="button" class="btn" data-t="labels">🏷️ الأسماء</button><button type="button" class="btn" data-t="play">⏸ الحركة</button><button type="button" class="btn" data-t="reset">⟲</button></div>
      <div class="info" id="c3info" aria-live="polite">اضغطي على جزء من الخلية لتعرفي اسمه ووظيفته.</div>
      <p class="sc-note">الألوان للتوضيح فقط، وليست الألوان الحقيقية لأجزاء الخلية. المجسّم مبسّط ومصنوع جزءًا جزءًا.</p>
      <table class="ctable"><thead><tr><th>الجزء</th><th>حيوانية</th><th>نباتية</th></tr></thead><tbody>
        ${D.tests.flatMap(t => t.parts).find(p => p.id === 't4').items.map(r => `<tr data-k="${r.key}"><td>${esc(r.part)}</td><td>${r.ans[0] ? '✓' : '✗'}${r.note ? ' ' + r.note[0] : ''}</td><td>${r.ans[1] ? '✓' : '✗'}${r.note ? ' ' + r.note[1] : ''}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function bindLab(root, focus) {
    const setMode = m => { root.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); cell && cell.setMode(m); };
    cellReady(() => {
      if (cell) cell.dispose();
      cell = window.mountCell($('#c3', root), { data: D.parts3d, onPick: k => {
        const P = D.parts3d[k]; if (!P) return; sfx('click');
        $('#c3info', root).innerHTML = `<b>${esc(P.name)}</b>: ${esc(P.fn)}`;
        root.querySelectorAll('.ctable tr').forEach(tr => tr.classList.toggle('on', tr.dataset.k === k));
      } });
      window.__cell = cell;
      if (focus) { const plantOnly = D.parts3d[focus] && D.parts3d[focus].only === 'plant'; if (plantOnly || focus === 'vacuole') setMode('plant'); setTimeout(() => cell.focus(focus), 300); }
    });
    root.querySelectorAll('.seg button').forEach(b => b.onclick = () => { sfx('click'); setMode(b.dataset.m); });
    root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      if (!cell) return; sfx('click'); const t = b.dataset.t;
      if (t === 'explode') b.textContent = cell.explode() ? '🧩 أعيدي الأجزاء' : '🧩 افصلي الأجزاء';
      if (t === 'cut') b.classList.toggle('on', cell.cut());
      if (t === 'labels') b.classList.toggle('on', !cell.labels());
      if (t === 'play') { cell.isPlaying() ? cell.pause() : cell.play(); b.textContent = cell.isPlaying() ? '⏸ الحركة' : '▶ الحركة'; }
      if (t === 'reset') { cell.reset(); root.querySelector('[data-t="explode"]').textContent = '🧩 افصلي الأجزاء'; root.querySelector('[data-t="cut"]').classList.remove('on'); setMode('animal'); }
    });
    root.querySelectorAll('.ctable tr[data-k]').forEach(tr => tr.onclick = () => { setMode('compare'); cell && cell.focus(tr.dataset.k); });
  }
  function lab() {
    closeScene(); $('#topTitle').textContent = 'مختبر الخلية';
    app.innerHTML = labHTML(false); bindLab(app);
  }

  /* ---------------- scene modal ---------------- */
  let scene = null;
  const ANIMAL_FILES = {}; ['snake', 'frog', 'bee', 'fly', 'crow', 'dove', 'sparrow', 'rooster', 'sheep', 'cow', 'camel'].forEach(n => ANIMAL_FILES[n] = { src: ['audio/animals/' + n + '.mp3'] });
  function openScene(key, title, focus) {
    closeScene(); stopVoice();
    const M = $('#sceneModal'); M.hidden = false; document.body.classList.add('noscroll');
    $('#scTitle').textContent = title || 'الشرح المتحرك';
    const box = $('#scBox'), ctl = $('#scCtl'); box.innerHTML = ''; ctl.innerHTML = ''; $('#scCap').textContent = '';
    if (key.startsWith('animal:')) return openAnimal(key.slice(7));
    if (key === 'cell3d') {
      $('#scTitle').textContent = 'مجسّم الخلية'; $('#scNote').textContent = '';
      box.innerHTML = labHTML(true); bindLab(box, focus); scene = { cell: true }; return;
    }
    const sc = window.SVGScenes[key](box);
    const sync = AudioSync({ tl: sc.tl, files: ANIMAL_FILES, cues: sc.cues || [] });
    const player = EduPlayer({ tl: sc.tl, mount: ctl, captionEl: '#scCap', captions: sc.captions, steps: sc.steps, audio: sync });
    $('#scNote').textContent = 'محاكاة تعليمية مبسّطة' + (sc.note ? ': ' + sc.note : '.');
    scene = { sc, sync, player }; window.__scene = scene;
    const M3 = { fish: 'fish', temp: 'sheep' }[key];
    if (M3) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn model'; b.textContent = '🧊 شاهدي المجسّم ثلاثي الأبعاد';
      b.onclick = () => openScene('animal:' + M3); ctl.appendChild(b); }
    setTimeout(() => player.play(), 200);        // the user tapped to open it, so starting is allowed
  }
  let animal3d = null;
  function openAnimal(k) {
    const box = $('#scBox'), ctl = $('#scCtl');
    const go = () => {
      const A = window.ANIMALS[k];
      $('#scTitle').textContent = 'مجسّم ' + A.name;
      box.innerHTML = `<div class="c3 animal3d" id="a3"><div class="c3-hint">حرّكي بإصبعك للتدوير، وبإصبعين للتكبير.</div></div>
        <div class="c3-tools"><button type="button" class="btn" id="aPlay">⏸ الحركة</button>${A.rig ? '<button type="button" class="btn" id="aWalk">🚶 يمشي</button>' : ''}${A.sound ? '<button type="button" class="btn" id="aSnd">🔊 صوته</button>' : ''}${A.photo ? '<button type="button" class="btn" id="aPhoto">📷 صورة حقيقية</button>' : ''}</div>
        <div class="info"><b>${esc(A.name)}</b>: ${esc(A.fact)}</div>`;
      $('#scCap').textContent = '';
      $('#scNote').textContent = k === 'fish' ? 'مجسّم واقعي مجاني (CC0). الحركة هنا تمايل مبسّط، لأن هذا المجسّم بلا مفاصل.' : 'مجسّم مجاني (CC0) بمفاصل حقيقية: يقف ويمشي. شكله مبسّط.';
      animal3d = window.mountAnimal($('#a3'), k); window.__animal = animal3d; scene = { animal: true };
      $('#aPlay').onclick = () => { animal3d.isPlaying() ? animal3d.pause() : animal3d.play(); $('#aPlay').textContent = animal3d.isPlaying() ? '⏸ الحركة' : '▶ الحركة'; };
      if (A.rig) $('#aWalk').onclick = () => { const w = animal3d.walk(!animal3d.state().walking); $('#aWalk').textContent = w ? '🧍 يقف' : '🚶 يمشي'; if (w && A.sound) animal(A.sound); };
      if (A.sound) $('#aSnd').onclick = () => animal(A.sound);
      if (A.photo) $('#aPhoto').onclick = () => {
        let ph = $('#aReal'); if (!ph) { $('#a3').insertAdjacentHTML('beforeend', `<img id="aReal" class="a3-real" src="${A.photo}" alt="${esc(A.name)} حقيقي">`); ph = $('#aReal'); ph.hidden = true; }
        ph.hidden = !ph.hidden; $('#aPhoto').textContent = ph.hidden ? '📷 صورة حقيقية' : '🧊 المجسّم';
        if (!ph.hidden) gsap.from(ph, { opacity: 0, scale: 0.9, duration: 0.4 });
      };
    };
    closeScene(); stopVoice();
    const M = $('#sceneModal'); M.hidden = false; document.body.classList.add('noscroll'); ctl.innerHTML = '';
    if (window.mountAnimal) go(); else window.addEventListener('cell3d-ready', go, { once: true });
  }
  function closeScene() {
    if (animal3d) { animal3d.dispose(); animal3d = null; }
    const M = $('#sceneModal'); if (!M) return;
    if (scene) { if (scene.sc) { scene.sc.tl.kill(); scene.sync.stopAll(); } if (scene.cell && cell) { cell.dispose(); cell = null; } }
    scene = null; M.hidden = true; document.body.classList.remove('noscroll'); $('#scCtl').innerHTML = ''; $('#scBox').innerHTML = '';
  }
  $('#scClose').onclick = closeScene;
  $('#sceneModal').addEventListener('click', e => { if (e.target.id === 'sceneModal') closeScene(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeScene(); });

  gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, MorphSVGPlugin);
  window.__app = { run, show, home, lab, openScene, closeScene, state: () => S };
  home();
  // deep links from the PowerPoint: #scene=levels , #lab
  function deepLink() {
    const h = decodeURIComponent(location.hash || '');
    if (h === '#lab') lab();
    else if (h.startsWith('#scene=') && window.SVGScenes[h.slice(7)]) openScene(h.slice(7));
  }
  deepLink(); window.addEventListener('hashchange', deepLink);
})();
