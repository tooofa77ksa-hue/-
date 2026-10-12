/* 2D teaching scenes: SVG + GSAP. Each scene builds its drawing into `box` and returns
   { tl, steps, captions, cues, note }  — tl is a paused GSAP timeline with one label per step,
   cues = [{at:label, sound:name}] for AudioSync. Facts follow the school book wording (see QUESTION_MAP.md). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const IMG = n => 'img/fe/' + n + '.webp';
  function svg(box, vb = '0 0 400 280') {
    box.innerHTML = ''; const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', vb); s.setAttribute('class', 'scene-svg'); s.setAttribute('role', 'img'); box.appendChild(s); return s;
  }
  function el(parent, tag, a = {}, text) {
    const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]);
    if (text != null) e.textContent = text; parent.appendChild(e); return e;
  }
  const g = (p, a) => el(p, 'g', a);
  const pic = (p, n, x, y, w, a = {}) => el(p, 'image', { href: IMG(n), x: x - w / 2, y: y - w / 2, width: w, height: w, ...a });
  const label = (p, x, y, t, a = {}) => el(p, 'text', { x, y, 'text-anchor': 'middle', class: 'sc-lbl', ...a }, t);
  // pill label sized to its real text width and kept inside the 400-wide viewBox
  const chip = (p, x, y, t, cls = 'sc-chip') => {
    const G = g(p, { class: cls }); const tx = label(G, x, y + 5, t);
    let w = 0; try { w = tx.getBBox().width; } catch (e) {} if (!w) w = t.length * 8;
    w += 22; const cx = Math.max(w / 2 + 4, Math.min(396 - w / 2, x)); tx.setAttribute('x', cx);
    const r = document.createElementNS(NS, 'rect'); Object.entries({ x: cx - w / 2, y: y - 14, width: w, height: 28, rx: 14 }).forEach(([k, v]) => r.setAttribute(k, v));
    G.insertBefore(r, tx); return G; };
  const TL = () => gsap.timeline({ paused: true, repeat: 0, defaults: { ease: 'power2.out' } });
  const pulse = (tl, t, at, s = 1.08) => tl.to(t, { scale: s, transformOrigin: '50% 50%', duration: 0.35, yoyo: true, repeat: 1 }, at);

  const S = {};

  // Levels of organization: muscle cell → muscle tissue → stomach (organ) → digestive system → human
  S.levels = box => {
    const s = svg(box, '0 0 400 300'), tl = TL();
    const names = ['خلية', 'نسيج', 'عضو', 'جهاز حيوي', 'كائن حي'];
    const X = [366, 290, 214, 128, 40];
    const tags = names.map((n, i) => chip(s, X[i], 280, n, 'sc-tag'));
    const arrows = [0, 1, 2, 3].map(i => label(s, (X[i] + X[i + 1]) / 2 + (i === 2 ? 4 : 0), 285, '←', { class: 'sc-lbl b sc-arr' }));
    const defs = el(s, 'defs'); const m = el(defs, 'marker', { id: 'ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
    el(m, 'path', { d: 'M0,0 L10,5 L0,10 z', class: 'sc-ahead' });
    const stage = g(s, {}); const cap = label(s, 200, 32, '', { class: 'sc-title' });
    const cell = (G, x, y, sc = 1) => { const c = g(G, { transform: `translate(${x},${y}) scale(${sc})` });
      el(c, 'ellipse', { rx: 34, ry: 9, class: 'sc-muscle' }); el(c, 'ellipse', { rx: 6, ry: 3.5, class: 'sc-nuc' }); return c; };
    const c0 = g(stage, {}); cell(c0, 200, 140, 2.2);
    const tissue = g(stage, { opacity: 0 }); const tc = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) tc.push(cell(tissue, 140 + k * 60 + (r % 2) * 30, 100 + r * 20, 1));
    const organ = g(stage, { opacity: 0 });
    el(organ, 'path', { d: 'M175,70 C170,95 150,110 150,145 C150,195 205,215 245,190 C270,175 268,150 250,140 C232,130 222,150 205,140 C192,132 195,105 198,70 Z', class: 'sc-stomach' });
    for (let i = 0; i < 6; i++) el(organ, 'path', { d: `M${160 + i * 15},${120 + (i % 2) * 6} q8,30 30,45`, class: 'sc-stripe' });
    label(organ, 200, 238, 'المعدة', { class: 'sc-lbl b' });
    const system = g(stage, { opacity: 0 });
    el(system, 'path', { d: 'M200,40 c-40,0 -55,25 -55,55 v120 c0,30 25,40 55,40 c30,0 55,-10 55,-40 v-120 c0,-30 -15,-55 -55,-55z', class: 'sc-body' });
    el(system, 'path', { d: 'M200,48 V110', class: 'sc-eso' });
    el(system, 'path', { d: 'M200,108 c-10,10 -22,18 -22,32 c0,22 30,26 44,14 c8,-7 4,-16 -4,-14', class: 'sc-stomach sm' });
    el(system, 'path', { d: 'M170,190 h60 v-28 h-60 v28 M178,182 c10,-14 20,10 30,-4 s14,10 18,-2', class: 'sc-gut' });
    label(system, 200, 272 - 10, 'الجهاز الهضمي', { class: 'sc-lbl b' });
    const human = g(stage, { opacity: 0 }); pic(human, '1f9cd', 200, 140, 170); label(human, 200, 240, 'الإنسان', { class: 'sc-lbl b' });
    const lit = i => tl.to(tags[i], { opacity: 1, scale: 1.12, transformOrigin: '50% 50%', duration: 0.3 }, '<').to(tags[i], { scale: 1, duration: 0.2 });
    gsap.set(tags, { opacity: 0.35 }); gsap.set(arrows, { opacity: 0.25 });
    tl.addLabel('s0').call(() => cap.textContent = 'خلية عضلية').from(c0, { scale: 0, transformOrigin: '200px 140px', duration: 0.7, ease: 'back.out(1.7)' }, 's0'); lit(0);
    tl.addLabel('s1', '+=0.8').call(() => cap.textContent = 'خلايا متشابهة = نسيج عضلي', null, 's1').to(c0, { opacity: 0, duration: 0.3 }, 's1').to(tissue, { opacity: 1, duration: 0.2 }, 's1')
      .from(tc, { x: (i) => 60 - (i % 3) * 60, y: (i) => 40 - Math.floor(i / 3) * 20, opacity: 0, stagger: 0.05, duration: 0.5 }, 's1').to(arrows[0], { opacity: 1 }, 's1'); lit(1);
    tl.addLabel('s2', '+=0.8').call(() => cap.textContent = 'أنسجة تكوّن عضوًا: المعدة', null, 's2').to(tissue, { scale: 0.25, transformOrigin: '205px 150px', opacity: 0, duration: 0.6 }, 's2')
      .fromTo(organ, { opacity: 0, scale: 1.6, transformOrigin: '205px 150px' }, { opacity: 1, scale: 1, duration: 0.7 }, 's2+=0.2').to(arrows[1], { opacity: 1 }, 's2'); lit(2);
    tl.addLabel('s3', '+=0.8').call(() => cap.textContent = 'أعضاء تعمل معًا = جهاز حيوي', null, 's3').to(organ, { scale: 0.3, x: 0, y: -10, opacity: 0, transformOrigin: '205px 150px', duration: 0.6 }, 's3')
      .fromTo(system, { opacity: 0, scale: 1.3, transformOrigin: '200px 150px' }, { opacity: 1, scale: 1, duration: 0.7 }, 's3+=0.2').to(arrows[2], { opacity: 1 }, 's3'); lit(3);
    tl.addLabel('s4', '+=0.8').call(() => cap.textContent = 'الأجهزة كلها = كائن حي', null, 's4').to(system, { scale: 0.4, opacity: 0, transformOrigin: '200px 140px', duration: 0.6 }, 's4')
      .fromTo(human, { opacity: 0, scale: 0.6, transformOrigin: '200px 140px' }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, 's4+=0.2').to(arrows[3], { opacity: 1 }, 's4'); lit(4);
    tl.to({}, { duration: 1.2 });
    return { tl, steps: ['s0', 's1', 's2', 's3', 's4'],
      captions: { s0: 'نبدأ بالأصغر: خلية عضلية.', s1: 'النسيج: مجموعة من الخلايا المتماثلة.', s2: 'العضو: مجموعة من الأنسجة تقوم بوظيفة معينة، مثل المعدة.', s3: 'أعضاء تعمل معًا تكوّن جهازًا حيويًا مثل الجهاز الهضمي.', s4: 'الأجهزة كلها تكوّن الكائن الحي.' },
      note: 'رسم تعليمي مبسّط للترتيب، والأشكال ليست بمقاسها الحقيقي.' };
  };

  // Six kingdoms
  S.kingdoms = box => {
    const s = svg(box, '0 0 400 290'), tl = TL();
    const K = [['البكتيريا القديمة', '1f9a0'], ['البكتيريا الحقيقية', '1f9a0'], ['الطلائعيات', '1f52c'], ['الفطريات', '1f344'], ['النباتات', '1fab4'], ['الحيوانات', '1f411']];
    label(s, 200, 30, 'المخلوقات الحية ست ممالك', { class: 'sc-title' });
    const cards = K.map(([n, e], i) => { const x = 330 - (i % 3) * 130, y = 100 + Math.floor(i / 3) * 120; const G = g(s, { class: 'sc-card' });
      el(G, 'rect', { x: x - 58, y: y - 50, width: 116, height: 104, rx: 16 }); pic(G, e, x, y - 8, 58); label(G, x, y + 42, n); label(G, x + 46, y - 34, String(i + 1), { class: 'sc-num' }); return G; });
    tl.addLabel('k0');
    cards.forEach((c, i) => tl.addLabel('k' + i, i ? '+=0.35' : 0).from(c, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(1.7)' }, 'k' + i));
    tl.addLabel('six', '+=0.4').to(cards, { y: -6, duration: 0.25, yoyo: true, repeat: 1, stagger: 0.06 }, 'six');
    return { tl, steps: ['k0', 'k2', 'k4', 'six'], captions: { k0: 'البكتيريا بنوعيها: القديمة والحقيقية.', k2: 'الطلائعيات والفطريات.', k4: 'النباتات والحيوانات.', six: 'المجموع: ست ممالك.' },
      note: 'الصور رموز توضيحية: الطلائعيات والبكتيريا لا تُرى إلا بالمجهر.' };
  };

  // Kingdom ⊃ phylum ⊃ class ⊃ order (the kingdom holds the most living things)
  S.taxonomy = box => {
    const s = svg(box, '0 0 400 290'), tl = TL();
    const lv = [['المملكة', 20, 34, 360, 240], ['الشعبة', 70, 74, 260, 190], ['الطائفة', 112, 112, 176, 144], ['الرتبة', 148, 148, 104, 100]];
    const animals = ['1f411', '1f42b', '1f404', '1f987', '1f42c', '1f426', '1f438', '1f40d', '1f41f', '1f41d', '1f419', '1fabc', '1f40c', '1f980'];
    const boxes = lv.map(([n, x, y, w, h], i) => { const G = g(s, {}); el(G, 'rect', { x, y, width: w, height: h, rx: 18, class: 'sc-nest n' + i }); label(G, x + w - 40, y + 20, n, { class: 'sc-lbl b' }); return G; });
    const pos = [[45, 70], [45, 120], [45, 170], [45, 220], [355, 70], [355, 120], [355, 170], [355, 220], [100, 245], [300, 245], [95, 100], [305, 100], [138, 140], [262, 140]];
    const icons = animals.map((a, i) => pic(s, a, pos[i][0], pos[i][1], 30));
    tl.addLabel('l0').from(boxes[0], { opacity: 0, scale: 0.9, transformOrigin: '50% 50%', duration: 0.5 }).from(icons, { scale: 0, transformOrigin: '50% 50%', stagger: 0.04, duration: 0.3 }, '<0.2');
    ['l1', 'l2', 'l3'].forEach((L, i) => tl.addLabel(L, '+=0.6').from(boxes[i + 1], { opacity: 0, scale: 1.15, transformOrigin: '50% 50%', duration: 0.5 }, L));
    tl.addLabel('big', '+=0.4'); pulse(tl, boxes[0], 'big', 1.03);
    return { tl, steps: ['l0', 'l1', 'l2', 'l3', 'big'], captions: { l0: 'المملكة: أكبر مجموعة، فيها أكبر عدد من المخلوقات.', l1: 'داخلها الشعبة: أصغر منها.', l2: 'ثم الطائفة: أصغر.', l3: 'ثم الرتبة: أصغر.', big: 'إذن المملكة هي المجموعة الكبرى.' }, note: 'رسم توضيحي للترتيب من الأكبر إلى الأصغر.' };
  };

  // Backbone: vertebrates vs invertebrates (an x-ray bar scans each animal)
  S.backbone = box => {
    const s = svg(box, '0 0 400 300'), tl = TL();
    label(s, 300, 30, 'فقاريات: لها عمود فقري', { class: 'sc-title sm' }); label(s, 100, 30, 'لا فقاريات: ليس لها', { class: 'sc-title sm' });
    el(s, 'line', { x1: 200, y1: 45, x2: 200, y2: 290, class: 'sc-div' });
    const V = ['1f41f', '1f438', '1f40d', '1f426', '1f411'], I = ['1f419', '1f577-fe0f', '1fabc', '1f40c', '1f41d'];
    const spine = (x, y) => { const G = g(s, { opacity: 0 }); for (let k = 0; k < 6; k++) el(G, 'rect', { x: x - 21 + k * 7.5, y: y + 24, width: 6, height: 9, rx: 2, class: 'sc-vert' }); return G; };
    const vs = V.map((a, i) => { const x = i < 3 ? 255 + i * 55 - 0 : 280 + (i - 3) * 60, y = i < 3 ? 85 : 190; return { im: pic(s, a, x, y, 54), sp: spine(x, y) }; });
    const is = I.map((a, i) => { const x = i < 3 ? 45 + i * 55 : 70 + (i - 3) * 60, y = i < 3 ? 85 : 190; const no = label(s, x, y + 38, '✗', { class: 'sc-no', opacity: 0 }); return { im: pic(s, a, x, y, 54), no }; });
    const bar = el(s, 'rect', { x: 205, y: 48, width: 6, height: 240, class: 'sc-xray', opacity: 0 });
    tl.addLabel('v').from(vs.map(o => o.im), { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.35 })
      .to(bar, { opacity: 0.6, duration: 0.1 }).fromTo(bar, { x: 0 }, { x: 180, duration: 1.4, ease: 'none' })
      .to(vs.map(o => o.sp), { opacity: 1, stagger: 0.22, duration: 0.2 }, '<0.1').to(bar, { opacity: 0, duration: 0.1 });
    tl.addLabel('i', '+=0.4').from(is.map(o => o.im), { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.35 }, 'i')
      .set(bar, { attr: { x: 5 } }).to(bar, { opacity: 0.6, duration: 0.1 }).fromTo(bar, { x: 0 }, { x: 180, duration: 1.4, ease: 'none' })
      .to(is.map(o => o.no), { opacity: 1, stagger: 0.22, duration: 0.2 }, '<0.1').to(bar, { opacity: 0, duration: 0.1 });
    tl.addLabel('end', '+=0.3'); pulse(tl, is[0].im, 'end', 1.15);
    return { tl, steps: ['v', 'i', 'end'], captions: { v: 'الفقاريات لها عمود فقري: السمكة، الضفدع، الثعبان، الطائر، الخروف.', i: 'اللافقاريات ليس لها عمود فقري: الأخطبوط، العنكبوت، قنديل البحر، الحلزون، النحلة.', end: 'الأخطبوط من اللافقاريات.' },
      note: 'العمود الفقري مرسوم كرمز تحت كل حيوان، وليس بشكله الحقيقي داخل الجسم.' };
  };

  // Snake (reptile): slither + scales
  S.snake = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 0, y: 200, width: 400, height: 80, class: 'sc-sand' });
    const sn = pic(s, '1f40d', 330, 165, 110);
    label(s, 200, 40, 'الثعبان من الزواحف', { class: 'sc-title' });
    const c1 = chip(s, 300, 80, 'له عمود فقري ✓'), c2 = chip(s, 300, 118, 'جلده حراشف');
    tl.addLabel('in').from(sn, { opacity: 0, duration: 0.3 })
      .to(sn, { x: -230, duration: 3, ease: 'none' }, 'in').to(sn, { y: '+=8', duration: 0.25, yoyo: true, repeat: 11, ease: 'sine.inOut' }, 'in')
      .to(sn, { scaleX: 0.92, transformOrigin: '50% 50%', duration: 0.25, yoyo: true, repeat: 11 }, 'in');
    tl.addLabel('facts', 'in+=0.8').from([c1, c2], { opacity: 0, x: 20, stagger: 0.4, duration: 0.4 }, 'facts');
    return { tl, steps: ['in', 'facts'], captions: { in: 'الثعبان يزحف على الأرض.', facts: 'له عمود فقري، وجلده مغطى بالحراشف، فهو من الزواحف.' }, cues: [{ at: 'in', sound: 'snake' }] };
  };

  // Frog (amphibian): water → land
  S.frog = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 200, y: 190, width: 200, height: 90, class: 'sc-water' }); el(s, 'rect', { x: 0, y: 190, width: 200, height: 90, class: 'sc-grass' });
    label(s, 300, 245, 'الماء', { class: 'sc-lbl w' }); label(s, 100, 245, 'اليابسة', { class: 'sc-lbl' });
    const path = el(s, 'path', { d: 'M310,185 C280,90 160,90 110,175', class: 'sc-hop' });
    const fr = pic(s, '1f438', 310, 175, 70);
    label(s, 200, 36, 'الضفدع من البرمائيات', { class: 'sc-title' });
    tl.addLabel('water').to(fr, { y: '+=6', duration: 0.4, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .addLabel('jump').from(path, { drawSVG: 0, duration: 0.6 }, 'jump').to(fr, { motionPath: { path, align: path, alignOrigin: [0.5, 0.75] }, duration: 1.2, ease: 'power1.inOut' }, 'jump+=0.2')
      .addLabel('land', '+=0.2');
    pulse(tl, fr, 'land');
    return { tl, steps: ['water', 'jump', 'land'], captions: { water: 'يبدأ الضفدع حياته في الماء.', jump: 'ثم ينتقل بين الماء واليابسة.', land: 'لذلك هو من البرمائيات، وحرارة جسمه متغيرة.' }, cues: [{ at: 'water', sound: 'frog' }] };
  };

  // Fish: swims, scales
  S.fish = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 0, y: 40, width: 400, height: 240, class: 'sc-water' });
    const path = el(s, 'path', { d: 'M360,150 C300,100 240,200 180,150 S80,110 40,160', class: 'sc-swim' });
    const f = pic(s, '1f41f', 360, 150, 70); const sh = pic(s, '1f988', 330, 235, 70, { opacity: 0 });
    label(s, 200, 30, 'الأسماك', { class: 'sc-title' });
    const c1 = chip(s, 110, 70, 'جلدها قشور'), c2 = chip(s, 290, 70, 'القرش: هيكله غضاريف');
    tl.addLabel('swim').to(f, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: false }, duration: 3, ease: 'sine.inOut' })
      .to(f, { scaleY: 0.9, transformOrigin: '50% 50%', duration: 0.2, yoyo: true, repeat: 13 }, 'swim')
      .addLabel('facts', 'swim+=0.6').from(c1, { opacity: 0, y: -10, duration: 0.4 }, 'facts')
      .addLabel('shark', '+=0.6').to(sh, { opacity: 1, x: -150, duration: 1.6 }, 'shark').from(c2, { opacity: 0, duration: 0.4 }, 'shark+=0.6');
    return { tl, steps: ['swim', 'facts', 'shark'], captions: { swim: 'الأسماك تعيش في الماء.', facts: 'يغطي جلدها القشور.', shark: 'وبعضها هيكله من الغضاريف مثل القرش.' } };
  };

  // Arthropods: largest invertebrate group, hard outer skeleton, jointed legs
  S.arthropods = box => {
    const s = svg(box), tl = TL();
    label(s, 200, 32, 'المفصليات: أكبر مجموعة في اللافقاريات', { class: 'sc-title sm' });
    const A = ['1f41d', '1f41c', '1f577-fe0f', '1f980', '1f98b', '1f982', '1f997', '1f41e', '1f990', '1f99e', '1fab2', '1f99f'];
    const ims = A.map((a, i) => pic(s, a, 350 - (i % 6) * 60, 95 + Math.floor(i / 6) * 70, 50));
    const c1 = chip(s, 290, 245, 'هيكل خارجي صلب'), c2 = chip(s, 110, 245, 'أرجل مفصلية');
    tl.addLabel('many').from(ims, { scale: 0, transformOrigin: '50% 50%', stagger: 0.07, duration: 0.3, ease: 'back.out(2)' })
      .addLabel('walk', '+=0.2').to(ims, { x: 6, duration: 0.18, yoyo: true, repeat: 5, stagger: 0.03, ease: 'sine.inOut' }, 'walk')
      .addLabel('facts', '+=0.1').from([c1, c2], { opacity: 0, y: 12, stagger: 0.35, duration: 0.4 }, 'facts');
    return { tl, steps: ['many', 'walk', 'facts'], captions: { many: 'الحشرات والعناكب والسرطانات كلها مفصليات، وهي أكبر مجموعة في اللافقاريات.', walk: 'أرجلها مفصلية، تنثني عند المفاصل.', facts: 'ولها هيكل خارجي صلب يحمي جسمها، مثل الحشرات.' }, cues: [{ at: 'many', sound: 'bee' }] };
  };

  // Jellyfish (cnidarian): pulsing bell, stinging tentacles
  S.jelly = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 0, y: 0, width: 400, height: 280, class: 'sc-water' });
    const j = pic(s, '1fabc', 200, 150, 130);
    label(s, 200, 30, 'قنديل البحر من اللاسعات', { class: 'sc-title' });
    const sparks = [150, 180, 215, 245].map((x, i) => label(s, x, 232 + (i % 2) * 8, '⚡', { class: 'sc-spark', opacity: 0 }));
    const c1 = chip(s, 330, 70, 'لوامس تشبه الأذرع');
    tl.addLabel('swim');
    for (let k = 0; k < 3; k++) tl.to(j, { scaleY: 0.86, scaleX: 1.08, transformOrigin: '50% 30%', duration: 0.35, ease: 'sine.in' }).to(j, { scaleY: 1, scaleX: 1, y: '-=12', duration: 0.6, ease: 'sine.out' });
    tl.addLabel('sting', '+=0.1').from(c1, { opacity: 0, duration: 0.3 }, 'sting').to(sparks, { opacity: 1, scale: 1.4, transformOrigin: '50% 50%', stagger: 0.12, duration: 0.25, yoyo: true, repeat: 3 }, 'sting');
    return { tl, steps: ['swim', 'sting'], captions: { swim: 'قنديل البحر يسبح بانقباض جسمه.', sting: 'لوامسه تنتهي بخلايا لاسعة يصطاد بها ويدافع عن نفسه.' } };
  };

  // Molluscs and shells
  S.shells = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 0, y: 205, width: 400, height: 75, class: 'sc-sand' });
    const sn = pic(s, '1f40c', 340, 180, 80), sh = pic(s, '1f41a', 200, 185, 64), oc = pic(s, '1f419', 70, 170, 74);
    label(s, 200, 32, 'الرخويات: جسم طري', { class: 'sc-title' });
    const c1 = chip(s, 270, 80, 'الصدفة تحمي الجسم الطري'), c2 = chip(s, 110, 122, 'الأخطبوط رخوي بلا صدفة');
    tl.addLabel('snail').from(sn, { opacity: 0, x: 40, duration: 0.6 }).to(sn, { x: -40, duration: 2.2, ease: 'none' })
      .addLabel('shell', '-=1').from(sh, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)' }, 'shell').from(c1, { opacity: 0, duration: 0.4 }, 'shell+=0.3')
      .addLabel('octo', '+=0.4').from(oc, { opacity: 0, y: 20, duration: 0.5 }, 'octo').from(c2, { opacity: 0, duration: 0.4 }, 'octo+=0.3');
    return { tl, steps: ['snail', 'shell', 'octo'], captions: { snail: 'الحلزون من الرخويات، يحمل صدفته معه.', shell: 'الأصداف تعود إلى حيوانات لا فقارية تسمى الرخويات.', octo: 'والأخطبوط أيضًا من الرخويات، لكن بلا صدفة.' } };
  };

  // Bat: flies but it is a mammal
  S.bat = box => {
    const s = svg(box), tl = TL();
    el(s, 'rect', { x: 0, y: 0, width: 400, height: 280, class: 'sc-night' });
    const path = el(s, 'path', { d: 'M360,200 C300,60 200,220 140,90 S60,120 50,80', class: 'sc-fly' });
    const b = pic(s, '1f987', 360, 200, 70);
    label(s, 200, 34, 'الخفاش يطير… لكنه من الثدييات', { class: 'sc-title w' });
    const c1 = chip(s, 120, 200, 'يرضع صغاره'), c2 = chip(s, 270, 240, 'جسمه مغطى بالشعر');
    tl.addLabel('fly').to(b, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 3, ease: 'sine.inOut' })
      .to(b, { scaleY: 0.55, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 23 }, 'fly')
      .addLabel('facts', 'fly+=1.5').from([c1, c2], { opacity: 0, y: 10, stagger: 0.4, duration: 0.4 }, 'facts');
    return { tl, steps: ['fly', 'facts'], captions: { fly: 'الخفاش يطير مثل الطيور.', facts: 'لكنه يرضع صغاره وجسمه مغطى بالشعر، فهو من الثدييات.' } };
  };

  // Feathers (birds) vs scales (reptiles)
  S.feathers = box => {
    const s = svg(box), tl = TL();
    el(s, 'line', { x1: 200, y1: 50, x2: 200, y2: 270, class: 'sc-div' });
    const bd = pic(s, '1f426', 300, 120, 100), ft = pic(s, '1fab6', 300, 215, 56), sn = pic(s, '1f40d', 100, 125, 100), lz = pic(s, '1f98e', 100, 215, 56);
    const c1 = chip(s, 300, 262, 'الطيور ← ريش'), c2 = chip(s, 100, 262, 'الزواحف ← حراشف');
    label(s, 200, 32, 'ماذا يغطي الجسم؟', { class: 'sc-title' });
    tl.addLabel('bird').from(bd, { opacity: 0, y: -20, duration: 0.5 }).to(bd, { y: -8, duration: 0.3, yoyo: true, repeat: 3 }).from([ft, c1], { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', stagger: 0.2, duration: 0.4 })
      .addLabel('rep', '+=0.3').from(sn, { opacity: 0, x: -20, duration: 0.5 }, 'rep').from([lz, c2], { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', stagger: 0.2, duration: 0.4 });
    return { tl, steps: ['bird', 'rep'], captions: { bird: 'الريش يغطي أجسام الطيور.', rep: 'أما الحراشف فتغطي أجسام الزواحف مثل الثعبان والسحلية.' }, cues: [{ at: 'bird', sound: 'sparrow' }] };
  };

  // Body temperature: constant (mammals, birds) vs variable (amphibians, reptiles, fish)
  S.temp = box => {
    const s = svg(box, '0 0 400 300'), tl = TL();
    const bg = el(s, 'rect', { x: 0, y: 0, width: 400, height: 300, class: 'sc-env' });
    const env = label(s, 200, 34, 'الجو: معتدل', { class: 'sc-title' });
    const therm = (x, a, name) => { const G = g(s, {}); pic(G, a, x, 95, 70); el(G, 'rect', { x: x - 9, y: 140, width: 18, height: 110, rx: 9, class: 'sc-tube' });
      el(G, 'circle', { cx: x, cy: 258, r: 15, class: 'sc-bulb' }); const lv = el(G, 'rect', { x: x - 5, y: 195, width: 10, height: 60, rx: 5, class: 'sc-merc' }); label(G, x, 292, name, { class: 'sc-lbl b' }); return lv; };
    const sheep = therm(300, '1f411', 'ثابتة'), frog = therm(100, '1f438', 'متغيرة');
    const setLv = (lv, h) => ({ attr: { y: 255 - h, height: h } });
    tl.addLabel('mild').to({}, { duration: 0.6 })
      .addLabel('cold').call(() => { env.textContent = 'الجو: بارد ❄️'; }, null, 'cold').to(bg, { attr: { class: 'sc-env cold' }, duration: 0.01 }, 'cold').to(frog, { ...setLv(frog, 25), duration: 1 }, 'cold')
      .addLabel('hot', '+=0.8').call(() => { env.textContent = 'الجو: حار ☀️'; }, null, 'hot').to(bg, { attr: { class: 'sc-env hot' }, duration: 0.01 }, 'hot').to(frog, { ...setLv(frog, 100), duration: 1.2 }, 'hot')
      .addLabel('sum', '+=0.6').call(() => { env.textContent = 'الخلاصة'; }, null, 'sum'); pulse(tl, sheep, 'sum', 1.05);
    return { tl, steps: ['mild', 'cold', 'hot', 'sum'],
      captions: { mild: 'الخروف من الثدييات، والضفدع من البرمائيات.', cold: 'برد الجو: حرارة الضفدع نزلت، وحرارة الخروف بقيت كما هي.', hot: 'صار الجو حارًا: حرارة الضفدع ارتفعت، وحرارة الخروف بقيت ثابتة.', sum: 'الثدييات والطيور حرارتها ثابتة. البرمائيات والزواحف والأسماك حرارتها متغيرة.' },
      note: 'مقياس الحرارة توضيحي بلا أرقام.' };
  };

  // Heredity: inherited traits vs learned behaviour
  S.heredity = box => {
    const s = svg(box, '0 0 400 300'), tl = TL();
    el(s, 'line', { x1: 200, y1: 50, x2: 200, y2: 290, class: 'sc-div' });
    label(s, 300, 34, 'صفات وراثية', { class: 'sc-title sm' }); label(s, 100, 34, 'سلوك مكتسب', { class: 'sc-title sm' });
    const fam = pic(s, '1f469-200d-1f467', 300, 115, 110), dna = pic(s, '1f9ec', 300, 205, 44);
    const t1 = chip(s, 300, 245, 'لون العينين'), t2 = chip(s, 300, 278, 'لون الشعر');
    const acts = [['1f6b2', 'ركوب الدراجة'], ['1f4d6', 'القراءة'], ['1f3ca', 'السباحة']].map(([a, n], i) => { const G = g(s, {}); pic(G, a, 100, 76 + i * 62, 46); label(G, 100, 110 + i * 62, n); return G; });
    const learn = chip(s, 100, 272, 'نتعلّمه بالتدريب');
    tl.addLabel('her').from(fam, { opacity: 0, scale: 0.7, transformOrigin: '50% 50%', duration: 0.5 })
      .from(dna, { opacity: 0, y: -60, duration: 0.6 }).to(dna, { rotation: 360, transformOrigin: '50% 50%', duration: 1 }, '<')
      .from([t1, t2], { opacity: 0, x: 20, stagger: 0.25, duration: 0.35 })
      .addLabel('acq', '+=0.4').from(acts, { opacity: 0, x: -20, stagger: 0.3, duration: 0.4 }, 'acq').from(learn, { opacity: 0, duration: 0.4 });
    return { tl, steps: ['her', 'acq'], captions: { her: 'الوراثة: صفات تنتقل من الآباء إلى الأبناء، مثل لون العينين ولون الشعر.', acq: 'أما ركوب الدراجة والقراءة والسباحة فسلوك نتعلّمه بالتدريب، وليس صفة وراثية.' } };
  };

  // Plants make their own food
  S.plantfood = box => {
    const s = svg(box, '0 0 400 300'), tl = TL();
    el(s, 'rect', { x: 0, y: 235, width: 400, height: 65, class: 'sc-soil' });
    const sun = pic(s, '2600-fe0f', 70, 60, 80), pl = pic(s, '1fab4', 200, 185, 120), mu = el(s, 'image', { href: 'img/bread_mold.webp', x: 290, y: 178, width: 104, height: 57 }); label(s, 342, 252, 'عفن الخبز', { class: 'sc-lbl b' });
    const rays = [0, 1, 2].map(i => el(s, 'path', { d: `M${100 + i * 8},${80 + i * 10} L${170 + i * 10},${140 + i * 6}`, class: 'sc-ray' }));
    const drops = [0, 1, 2].map(i => el(s, 'circle', { cx: 185 + i * 15, cy: 270, r: 5, class: 'sc-drop' }));
    const food = label(s, 235, 120, '✨', { class: 'sc-spark', opacity: 0 });
    label(s, 200, 30, 'النباتات تصنع غذاءها بنفسها', { class: 'sc-title' });
    const c1 = chip(s, 310, 150, 'الفطريات لا تصنع غذاءها');
    tl.addLabel('sun').from(rays, { drawSVG: 0, stagger: 0.15, duration: 0.6 })
      .addLabel('water').to(drops, { attr: { cy: 210 }, opacity: 0, stagger: 0.2, duration: 0.9 }, 'water')
      .addLabel('food', '+=0.1').to(food, { opacity: 1, scale: 1.6, transformOrigin: '50% 50%', duration: 0.4, yoyo: true, repeat: 3 }, 'food'); pulse(tl, pl, 'food', 1.06);
    tl.addLabel('fungi', '+=0.3').from(c1, { opacity: 0, duration: 0.4 }, 'fungi'); pulse(tl, mu, 'fungi', 1.12);
    return { tl, steps: ['sun', 'water', 'food', 'fungi'], captions: { sun: 'يأخذ النبات ضوء الشمس.', water: 'ويمتص الماء من التربة، ويأخذ الهواء.', food: 'فيصنع غذاءه بنفسه في أوراقه.', fungi: 'أما الفطريات، مثل عفن الخبز، فلا تصنع غذاءها.' } };
  };

  window.SVGScenes = S;
})();
