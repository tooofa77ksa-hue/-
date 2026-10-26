(function () {
  const D = window.DIFAA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const anim = hasGsap && !reduce;
  if (anim) document.documentElement.classList.add("js-anim");
  if (D.DEMO) $("#demoBadge").hidden = false;

  // ---------- الترويسة والقائمة ----------
  const topbar = $("#topbar"), nav = $("#nav"), burger = $("#burger"), toTop = $("#toTop");
  const onScroll = () => {
    const y = scrollY;
    topbar.classList.toggle("solid", y > 40);
    toTop.classList.toggle("show", y > innerHeight);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    topbar.classList.add("solid");
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));

  // القسم الحالي في القائمة
  const links = $$("a", nav);
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["home", "awareness", "duty", "soldiers", "messages"].forEach((id) => io.observe(document.getElementById(id)));

  // ---------- عنوان الواجهة: تقسيم الكلمات ----------
  const title = $("#heroTitle");
  $$(".ln", title).forEach((ln) => {
    ln.innerHTML = ln.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
  });

  const veil = $("#introVeil");
  function intro() {
    if (!anim) { veil.remove(); return; }
    const tl = gsap.timeline({ delay: 0.05 });
    tl.to(veil, { opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => veil.remove() })
      .from(topbar, { y: -30, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.3)
      .from("[data-hero].hero-kicker", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.45)
      .from(".hero-title .w > span", { yPercent: 110, opacity: 0, rotate: 4, duration: 0.9, stagger: 0.08, ease: "expo.out" }, 0.55)
      .from(".hero-sub > *", { y: 16, opacity: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 1.0)
      .from(".hero-actions .btn", { y: 18, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 1.2)
      .from("#anthem", { y: 14, opacity: 0, duration: 0.6, ease: "power3.out" }, 1.35)
      .from(".scroll-cue", { opacity: 0, duration: 0.6 }, 1.6);
  }
  // الافتتاحية تبدأ فور فتح الصفحة: الكرة الأرضية ثم العنوان
  if (window.__startIntro) window.__startIntro();
  intro();

  // ---------- الظهور عند التمرير ----------
  if (anim) {
    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(el, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$("[data-stagger]").forEach((wrap) => {
      gsap.fromTo(wrap.children, { y: 50, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.09, ease: "power3.out", scrollTrigger: { trigger: wrap, start: "top 85%" } });
    });
    // الخط الذهبي يرسم نفسه
    $$(".ornament path.draw").forEach((p) => {
      const len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".ornament", start: "top 95%", end: "top 45%", scrub: 0.6 } });
    });
    gsap.from(".ornament-star", { scale: 0, rotate: 180, duration: 0.9, ease: "back.out(2)", scrollTrigger: { trigger: ".ornament", start: "top 75%" } });
    // حركة الصورة العريضة
    gsap.fromTo(".band-img", { yPercent: -9 }, { yPercent: 9, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".band-quote p", { letterSpacing: "6px", opacity: 0.3 }, { letterSpacing: "0px", opacity: 1, ease: "power2.out", scrollTrigger: { trigger: ".band", start: "top 75%", end: "center 55%", scrub: true } });
    // الصورة في قسم الواجب
    gsap.fromTo(".duty-photo img", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".duty-photo", start: "top bottom", end: "bottom center", scrub: true } });
  }

  // ---------- النشيد الوطني (لا يعمل إلا بالضغط، ويُشغَّل مرة واحدة) ----------
  const anthem = $("#anthem"), au = $("#anthemAudio"), aBar = $(".anthem-bar span", anthem), aSub = $(".anthem-txt small", anthem);
  function anthemUI(on) {
    anthem.classList.toggle("on", on);
    anthem.setAttribute("aria-pressed", on);
    aSub.textContent = on ? "اضغطوا للإيقاف" : "اضغطوا للاستماع";
    window.__anthemOn = on;
  }
  function playAnthem() {
    au.volume = 1;
    const p = au.play();
    if (p && p.catch) p.catch(() => anthemUI(false));
    anthemUI(true);
  }
  anthem.addEventListener("click", () => {
    if (au.paused) playAnthem(); else { au.pause(); anthemUI(false); }
  });
  au.addEventListener("timeupdate", () => { if (au.duration) aBar.style.width = (au.currentTime / au.duration) * 100 + "%"; });
  au.addEventListener("ended", () => { anthemUI(false); au.currentTime = 0; aBar.style.width = "0"; });
  // يتوقف إذا خرج الزائر من الصفحة
  document.addEventListener("visibilitychange", () => { if (document.hidden && !au.paused) { au.pause(); anthemUI(false); } });

  // ---------- العدّادات ----------
  function countUp(el, to) {
    to = Number(to) || 0;
    if (!anim) { el.textContent = to.toLocaleString("en"); return; }
    const o = { v: Number(el.dataset.shown || 0) };
    gsap.to(o, { v: to, duration: 2, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en")) });
    el.dataset.shown = to;
  }
  let statsSeen = false;
  const statsIO = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting) return;
    statsSeen = true; statsIO.disconnect();
    $$(".stat .num").forEach((n) => countUp(n, n.dataset.count));
  }, { threshold: 0.4 });
  statsIO.observe($("#stats"));
  function setStat(id, v) {
    const el = $(id); el.dataset.count = v;
    if (statsSeen) countUp(el, v);
  }

  // ---------- بطاقات الوعي ----------
  $$(".flip").forEach((f) => f.addEventListener("click", () => f.classList.toggle("on")));

  // ---------- التحدي ----------
  const QUIZ = [
    { q: "وصلتك رسالة في مجموعة الواتساب فيها «خبر عاجل» عن الوطن، بلا مصدر واضح.", o: [["أعيد إرسالها فورًا ليعرف الجميع", 0], ["أتحقق من الحسابات والجهات الرسمية قبل أي مشاركة", 1], ["أضيف عليها تعليقي ثم أنشرها", 0]], fb: "الكلمة أمانة؛ الأخبار تؤخذ من مصادرها الرسمية، وما لم نتحقق منه نوقفه عندنا." },
    { q: "شاهدت مقطعًا يسخر من فئة من أبناء الوطن بسبب منطقتها أو أصلها.", o: [["أشاركه لأنه مضحك فقط", 0], ["لا أشاركه، وأذكّر بأننا جميعًا أبناء وطنٍ واحد", 1]], fb: "النعرات تفرّق الصف؛ ووحدتنا قوة وطننا، فلا نكون جسرًا لما يفرّقنا." },
    { q: "حساب مجهول يطلب منك صورًا لمواقع أمنية أو عسكرية «للمسابقة».", o: [["أرسل الصور، فهي مجرد مسابقة", 0], ["أرفض، وأخبر أهلي، وأبلّغ الجهات المختصة", 1], ["أتجاهله وأحذف الرسالة فقط", 0]], fb: "أمن الوطن خط أحمر؛ الرفض والإبلاغ عبر القنوات الرسمية حمايةٌ للوطن ولك." },
    { q: "زميلتك قالت رأيًا يختلف عن رأيك في نقاش الفصل.", o: [["أحاورها بأدب وأحترم اختلافها", 1], ["أسخر من رأيها أمام الجميع", 0]], fb: "الاعتدال أن نختلف بأدب ونتحاور بالحكمة؛ فاختلاف الرأي لا يُفسد الودّ." },
  ];
  const qBody = $("#quizBody"), qBar = $("#quizBar");
  let qi = 0, score = 0;
  function renderQ() {
    qBar.style.width = (qi / QUIZ.length) * 100 + "%";
    if (qi >= QUIZ.length) {
      const msg = score === QUIZ.length ? "أحسنت! تصرّفت بوعي في كل المواقف، بتوفيق الله ثم بتركيزك." : "جهدٌ جميل! كل موقف تعلّمناه اليوم يجعلنا أكثر وعيًا ونفعًا لوطننا.";
      qBody.innerHTML = `<div class="q-end"><div class="medal">${score}/${QUIZ.length}</div><b>بفكرٍ واعٍ… لوطنٍ آمن</b><p>${msg}</p><button class="btn btn-ghost-green" id="qAgain">أعد التحدي</button></div>`;
      $("#qAgain").onclick = () => { qi = 0; score = 0; renderQ(); };
      return;
    }
    const it = QUIZ[qi];
    qBody.innerHTML = `<div class="q-step">الموقف ${qi + 1} من ${QUIZ.length}</div><div class="q-text">${it.q}</div><div class="q-opts">${it.o.map((o, i) => `<button class="q-opt" data-i="${i}">${o[0]}</button>`).join("")}</div>`;
    if (anim) gsap.from(qBody.children, { y: 14, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power2.out" });
    $$(".q-opt", qBody).forEach((b) => b.addEventListener("click", () => {
      const ok = it.o[b.dataset.i][1] === 1;
      if (ok) score++;
      $$(".q-opt", qBody).forEach((x) => { x.disabled = true; if (it.o[x.dataset.i][1]) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      const fb = document.createElement("div");
      fb.className = "q-fb";
      fb.innerHTML = (ok ? "<b>تصرّفٌ واعٍ 👏</b> " : "<b>لنفكّر معًا:</b> ") + it.fb;
      const nx = document.createElement("button");
      nx.className = "btn btn-green q-next";
      nx.textContent = qi + 1 < QUIZ.length ? "الموقف التالي" : "النتيجة";
      nx.onclick = () => { qi++; renderQ(); };
      qBody.append(fb, nx);
      if (anim) gsap.from([fb, nx], { y: 12, opacity: 0, stagger: 0.08, duration: 0.45 });
    }));
  }
  renderQ();

  // ---------- النافذة المكبّرة ----------
  const lb = $("#lightbox"), stage = $("#lbStage"), cap = $("#lbCap");
  let gal = [], gi = 0;
  function openLB(items, i) {
    gal = items; gi = i; showLB();
    lb.hidden = false; document.body.style.overflow = "hidden";
    $("#lbPrev").hidden = $("#lbNext").hidden = items.length < 2;
  }
  function showLB() {
    const it = gal[gi];
    if (it.type === "video") {
      stage.innerHTML = it.src.includes("drive.google.com") ? `<iframe src="${D.esc(it.src)}" allow="autoplay; fullscreen" allowfullscreen></iframe>` : `<video src="${D.esc(it.src)}" controls playsinline autoplay></video>`;
    } else stage.innerHTML = `<img src="${D.esc(it.src)}" alt="">`;
    cap.textContent = it.cap || "";
    if (anim) gsap.fromTo(stage.firstChild, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" });
  }
  function closeLB() { lb.hidden = true; stage.innerHTML = ""; document.body.style.overflow = ""; }
  $("#lbClose").onclick = closeLB;
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLB(); });
  $("#lbNext").onclick = () => { gi = (gi + 1) % gal.length; showLB(); };
  $("#lbPrev").onclick = () => { gi = (gi - 1 + gal.length) % gal.length; showLB(); };
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft" && gal.length > 1) $("#lbNext").click();
    if (e.key === "ArrowRight" && gal.length > 1) $("#lbPrev").click();
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx == null || gal.length < 2) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) (dx > 0 ? $("#lbNext") : $("#lbPrev")).click();
  });
  const figs = $$("#gallery .g");
  const galItems = figs.map((f) => ({ src: $("img", f).src, cap: $("figcaption", f).textContent }));
  figs.forEach((f, i) => f.addEventListener("click", () => openLB(galItems, i)));

  // ---------- النموذج ----------
  const form = $("#msgForm");
  const sel = (n, arr) => arr.forEach((v) => form[n].insertAdjacentHTML("beforeend", `<option value="${v}">${D.roleLabel(v)}</option>`));
  sel("role", D.ROLES); sel("grade", D.GRADES);
  const MAX = D.CFG.MAX_TEXT || 600, MAXMB = D.CFG.MAX_VIDEO_MB || 35;
  form.text.maxLength = MAX; $("#cntMax").textContent = MAX; $("#upHint").textContent = `مقطع قصير حتى ${MAXMB} ميجابايت`;
  form.text.addEventListener("input", () => ($("#cnt").textContent = form.text.value.length));
  const up = $("#upload"), upClear = $("#upClear"), err = $("#formErr");
  form.video.addEventListener("change", () => {
    const f = form.video.files[0];
    err.textContent = "";
    if (!f) return resetUp();
    if (!/^video\//.test(f.type) && !/\.(mp4|mov|m4v|3gp|webm)$/i.test(f.name)) { err.textContent = "الملف المختار ليس مقطع فيديو."; return resetUp(); }
    if (f.size > MAXMB * 1048576) { err.textContent = `حجم المقطع ${(f.size / 1048576).toFixed(1)} ميجابايت، والحد الأعلى ${MAXMB}. جرّبوا مقطعًا أقصر.`; return resetUp(); }
    up.classList.add("has"); upClear.hidden = false;
    $(".up-txt b", up).textContent = "تم اختيار المقطع ✓";
    $("#upHint").textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} م.ب`;
  });
  function resetUp() {
    form.video.value = ""; up.classList.remove("has"); upClear.hidden = true;
    $(".up-txt b", up).textContent = "أرفق مقطعًا (اختياري)";
    $("#upHint").textContent = `مقطع قصير حتى ${MAXMB} ميجابايت`;
  }
  upClear.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); resetUp(); });

  const btn = $("#sendBtn"), prog = $("#progress"), bar = $("#progress span"), done = $("#formDone");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    if (form.website.value) return; // حماية من الرسائل الآلية
    const text = form.text.value.trim();
    const file = form.video.files[0];
    if (!file && text.length < 5) { err.textContent = "اكتبوا رسالة (خمسة أحرف على الأقل) أو أرفقوا مقطعًا."; form.text.focus(); return; }
    const payload = { name: form.name.value.trim(), role: form.role.value, grade: form.grade.value, text };
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.textContent = file ? "جارٍ رفع المقطع…" : "جارٍ الإرسال…";
    try {
      if (file) {
        prog.hidden = false; bar.style.width = "4%";
        if (D.DEMO) payload.video_preview = URL.createObjectURL(file);
        else payload.video = { name: file.name, mime: file.type || "video/mp4", data: await D.fileToBase64(file) };
      }
      await D.post("submit", payload, (p) => (bar.style.width = Math.max(4, p * 100) + "%"));
      bar.style.width = "100%";
      done.hidden = false;
      if (anim) gsap.from(done.children, { y: 14, opacity: 0, stagger: 0.1, duration: 0.6, delay: 0.2 });
      lastSent = { name: payload.name, role: payload.role, grade: payload.grade };
      form.reset(); resetUp(); $("#cnt").textContent = 0;
    } catch (ex) {
      err.textContent = ex.message || "تعذّر الإرسال، حاولوا مرة أخرى.";
    } finally {
      btn.disabled = false; btn.innerHTML = label;
      setTimeout(() => { prog.hidden = true; bar.style.width = "0"; }, 600);
    }
  });
  let lastSent = {};
  $("#again").addEventListener("click", () => { done.hidden = true; form.text.focus(); });
  $("#getCert").addEventListener("click", () => window.DIFAA_CERT && window.DIFAA_CERT.open(lastSent));

  // ---------- جدار الوطن ----------
  const wall = $("#wall"), more = $("#more");
  const PAGE = 8;
  let items = [], shown = 0;
  const playSvg = '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8Z"/></svg>';
  function cardHTML(m, idx) {
    const who = [D.roleLabel(m.role), m.grade ? "الصف " + m.grade : ""].filter(Boolean).join(" · ");
    return `<article class="card">
      ${m.video_url ? `<button class="card-video" data-v="${idx}" aria-label="تشغيل المقطع"><span>${playSvg}</span></button>` : ""}
      ${m.text ? `<p>${D.esc(m.text)}</p>` : ""}
      <div class="card-meta"><span><span class="card-name">${D.esc(m.name || "محبٌّ للوطن")}</span>${who ? " · " + D.esc(who) : ""}</span><time>${D.fmtDate(m.created)}</time></div>
    </article>`;
  }
  function renderMore() {
    const next = items.slice(shown, shown + PAGE);
    const tmp = document.createElement("div");
    tmp.innerHTML = next.map((m, i) => cardHTML(m, shown + i)).join("");
    const nodes = [...tmp.children];
    nodes.forEach((n) => wall.appendChild(n));
    shown += next.length;
    more.hidden = shown >= items.length;
    if (anim) gsap.from(nodes, { y: 30, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: nodes[0], start: "top 95%" } });
  }
  more.addEventListener("click", renderMore);
  wall.addEventListener("click", (e) => {
    const b = e.target.closest(".card-video");
    if (!b) return;
    const m = items[b.dataset.v];
    openLB([{ type: "video", src: m.video_url, cap: m.name ? "مشاركة: " + m.name : "" }], 0);
  });
  async function loadWall() {
    try {
      const r = await D.post("public");
      items = r.items || [];
      wall.innerHTML = "";
      shown = 0;
      $("#wallCount").textContent = items.length ? `${items.length.toLocaleString("en")} مشاركة` : "";
      if (!items.length) wall.innerHTML = '<div class="wall-empty">كونوا أول من يكتب للوطن 💚</div>';
      else renderMore();
      setStat("#statMsgs", r.stats ? r.stats.approved : items.length);
      setStat("#statVideos", r.stats ? r.stats.videos : items.filter((m) => m.video_url).length);
      if (hasGsap) ScrollTrigger.refresh();
    } catch (ex) {
      wall.innerHTML = `<div class="wall-empty">تعذّر تحميل الرسائل الآن. <button class="btn btn-ghost-green" id="retry" style="margin-top:12px">إعادة المحاولة</button></div>`;
      $("#retry").onclick = () => { wall.innerHTML = '<div class="wall-loading"><span></span><span></span><span></span></div>'; loadWall(); };
    }
  }
  loadWall();
})();
