(function () {
  const D = window.DIFAA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SKEY = "difaa_pw";
  let PW = "";
  // الدخول برابط خاص (admin.html#key=…) بدون كتابة أي رمز، ويتذكّره الجهاز
  const fromLink = (location.hash.match(/key=([^&]+)/) || location.search.match(/[?&]k(?:ey)?=([^&#]+)/) || [])[1];
  if (fromLink) {
    PW = decodeURIComponent(fromLink);
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    PW = PW.trim();
  } else {
    try { PW = localStorage.getItem(SKEY) || ""; } catch (e) {}
  }

  // زر الشاشة الكاملة (يظهر فقط في الأجهزة التي تدعمه)
  const fsEl = document.documentElement;
  const fsReq = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
  const fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
  const fsBtn = $("#fsBtn");
  if (fsReq && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    fsBtn.hidden = false;
    fsBtn.addEventListener("click", () => {
      try {
        if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else { const r = fsReq.call(fsEl); if (r && r.catch) r.catch(() => {}); }
      } catch (e) {}
    });
    const upd = () => ($("span", fsBtn).textContent = fsOn() ? "خروج من الشاشة الكاملة" : "شاشة كاملة");
    document.addEventListener("fullscreenchange", upd);
    document.addEventListener("webkitfullscreenchange", upd);
  }

  // دعم النوافذ المنبثقة في المتصفحات القديمة (آيفون قبل iOS 15.4، وأجهزة أندرويد/هواوي القديمة)
  if (!window.HTMLDialogElement || typeof HTMLDialogElement.prototype.showModal !== "function") {
    document.documentElement.classList.add("no-dialog");
    const shade = document.createElement("div");
    shade.className = "dlg-shade"; shade.hidden = true;
    document.body.appendChild(shade);
    $$("dialog").forEach((d) => {
      d.returnValue = "";
      d.showModal = () => { d.setAttribute("open", ""); shade.hidden = false; };
      d.close = (v) => {
        if (!d.hasAttribute("open")) return;
        if (v !== undefined) d.returnValue = v;
        d.removeAttribute("open");
        if (!$("dialog[open]")) shade.hidden = true;
        d.dispatchEvent(new Event("close"));
      };
      const f = $("form", d);
      if (f) f.addEventListener("submit", (e) => {
        if (e.defaultPrevented) return;
        e.preventDefault();
        d.close(f._lastBtn || "");
      });
    });
  }
  // تذكّر الزر المضغوط داخل النوافذ (بديل e.submitter غير المدعوم في المتصفحات القديمة)
  $$("dialog form").forEach((f) => f.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) f._lastBtn = b.value;
  }, true));

  let all = [];
  let tab = "pending";
  const selected = new Set();

  if (D.DEMO) { $("#demoHint").hidden = false; $("#demoChip").hidden = false; }

  // ---------- أدوات ----------
  let toastT;
  function toast(msg, bad) {
    const t = $("#toast");
    t.textContent = msg; t.classList.toggle("bad", !!bad); t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  const api = (action, p) => D.post(action, Object.assign({ pw: PW }, p || {}));
  const ICON = {
    ok: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    no: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    ed: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>',
    cert: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/></svg>',
  };

  // ---------- الدخول ----------
  async function tryLogin(pw) {
    PW = pw;
    await api("admin_login");
    try { localStorage.setItem(SKEY, pw); } catch (e) {}
    $("#login").hidden = true; $("#app").hidden = false;
    await load();
  }
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const b = $("#loginBtn"); b.disabled = true; $("#loginErr").textContent = "";
    try { await tryLogin($("#pw").value); }
    catch (ex) { $("#loginErr").textContent = ex.message; }
    finally { b.disabled = false; }
  });
  if (PW) tryLogin(PW).catch(() => { PW = ""; try { localStorage.removeItem(SKEY); } catch (e) {} });

  // ---------- التحميل والعرض ----------
  const roleSel = $("#fRole");
  D.ROLES.forEach((r) => roleSel.insertAdjacentHTML("beforeend", `<option value="${r}">${D.roleLabel(r)}</option>`));
  const ef = $("#editForm");
  D.ROLES.forEach((r) => ef.role.insertAdjacentHTML("beforeend", `<option value="${r}">${D.roleLabel(r)}</option>`));
  D.GRADES.forEach((g) => ef.grade.insertAdjacentHTML("beforeend", `<option>${g}</option>`));

  async function load(quiet) {
    try {
      const r = await api("admin_list");
      all = (r.items || []).map((m) => Object.assign(m, { _flags: D.flagCats(m.text) }));
      render();
      if (!quiet) toast(`تم تحميل ${all.length} مشاركة`);
    } catch (ex) { toast(ex.message, true); }
  }
  $("#refresh").addEventListener("click", () => load());

  const isFlagged = (m) => m._flags && m._flags.length > 0;
  function inTab(m, t) {
    if (t === "all") return true;
    if (t === "flagged") return isFlagged(m) && m.status !== "rejected";
    return m.status === t;
  }
  function filtered(t = tab) {
    const q = $("#q").value.trim();
    const ty = $("#fType").value, ro = $("#fRole").value, so = $("#fSort").value;
    let v = all.filter((m) => inTab(m, t));
    if (q) v = v.filter((m) => [m.name, m.text, m.role, m.grade].join(" ").includes(q));
    if (ty === "video") v = v.filter((m) => m.video_url);
    if (ty === "text") v = v.filter((m) => !m.video_url);
    if (ro) v = v.filter((m) => m.role === ro);
    v.sort((a, b) => (so === "old" ? 1 : -1) * String(a.created).localeCompare(String(b.created)));
    return v;
  }

  function counts() {
    const c = { pending: 0, approved: 0, rejected: 0, flagged: 0, all: all.length };
    all.forEach((m) => { c[m.status] = (c[m.status] || 0) + 1; if (inTab(m, "flagged")) c.flagged++; });
    const set = (id, v) => ($(id).textContent = v.toLocaleString("en"));
    set("#kPending", c.pending); set("#kApproved", c.approved); set("#kRejected", c.rejected); set("#kFlagged", c.flagged); set("#kAll", c.all);
    set("#tPending", c.pending); set("#tApproved", c.approved); set("#tRejected", c.rejected); set("#tFlagged", c.flagged); set("#tAll", c.all);
  }

  function rowHTML(m) {
    const st = m.status;
    const flags = (m._flags || []).map((f) => `<span class="pill flag">⚑ ${f}</span>`).join("");
    const who = [D.roleLabel(m.role), m.grade ? "الصف " + m.grade : ""].filter(Boolean).join(" · ");
    return `<article class="row ${selected.has(m.id) ? "sel" : ""} ${isFlagged(m) ? "flagged" : ""}" data-id="${D.esc(m.id)}">
      <label class="chk"><input type="checkbox" class="pick" ${selected.has(m.id) ? "checked" : ""} aria-label="تحديد"><span></span></label>
      <div class="row-main">
        <div class="row-top">
          <span class="row-name">${D.esc(m.name || "بدون اسم")}</span>
          ${who ? `<span>${D.esc(who)}</span>` : ""}
          <span>${D.fmtDate(m.created, true)}</span>
          <span class="pill ${st}">${D.STATUS[st] || st}</span>
          ${m.source === "المديرة" ? '<span class="pill src">أضافتها المديرة</span>' : ""}
          ${flags}
        </div>
        ${m.text ? `<p class="row-text">${D.highlight(m.text)}</p>` : '<p class="row-text" style="color:var(--muted)">(مشاركة مرئية بدون نص)</p>'}
        ${m.video_url ? `<button class="row-video" data-act="video">${ICON.play} مشاهدة المقطع</button>` : ""}
      </div>
      <div class="row-act">
        <button class="act ok ${st === "approved" ? "cur" : ""}" data-act="approved" title="اعتماد" aria-label="اعتماد">${ICON.ok}</button>
        <button class="act no ${st === "rejected" ? "cur" : ""}" data-act="rejected" title="رفض" aria-label="رفض">${ICON.no}</button>
        ${st !== "pending" ? `<button class="act" data-act="pending" title="إرجاع للمراجعة" aria-label="إرجاع للمراجعة">${ICON.back}</button>` : ""}
        <button class="act ct" data-act="cert" title="شهادة شكر" aria-label="شهادة شكر">${ICON.cert}</button>
        <button class="act ed" data-act="edit" title="تعديل" aria-label="تعديل">${ICON.ed}</button>
        <button class="act del" data-act="delete" title="حذف" aria-label="حذف">${ICON.del}</button>
      </div>
    </article>`;
  }

  function render() {
    counts();
    $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    $$(".kpi").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    const v = filtered();
    // أبقِ التحديد ضمن الظاهر فقط
    [...selected].forEach((id) => { if (!v.some((m) => m.id === id)) selected.delete(id); });
    $("#list").innerHTML = v.map(rowHTML).join("");
    const empty = $("#empty");
    empty.hidden = v.length > 0;
    if (!v.length) {
      const msg = { pending: "لا توجد مشاركات بانتظار المراجعة 🌿", approved: "لا توجد مشاركات معتمدة بعد", rejected: "لا توجد مشاركات مرفوضة", flagged: "لا توجد تنبيهات، المشاركات سليمة ✓", all: "لا توجد مشاركات بعد" }[tab];
      empty.innerHTML = `<b>${msg}</b>${$("#q").value ? "جرّبي كلمة بحث أخرى" : ""}`;
    }
    updBulk(v);
  }
  function updBulk(v = filtered()) {
    const n = selected.size;
    $("#bulk").hidden = v.length === 0;
    $("#selCount").textContent = n ? `${n} محددة` : "تحديد الكل";
    $$("#bulk .btn").forEach((b) => (b.disabled = n === 0));
    const sa = $("#selAll");
    sa.checked = n > 0 && n === v.length; sa.indeterminate = n > 0 && n < v.length;
  }

  // ---------- التبويب والتصفية ----------
  const setTab = (t) => { tab = t; selected.clear(); render(); };
  $$("#tabs button, .kpi").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  ["#q", "#fType", "#fRole", "#fSort"].forEach((s) => $(s).addEventListener("input", render));

  $("#selAll").addEventListener("change", (e) => {
    const v = filtered();
    if (e.target.checked) v.forEach((m) => selected.add(m.id)); else selected.clear();
    render();
  });

  // ---------- أفعال الصف ----------
  $("#list").addEventListener("change", (e) => {
    if (!e.target.classList.contains("pick")) return;
    const id = e.target.closest(".row").dataset.id;
    e.target.checked ? selected.add(id) : selected.delete(id);
    e.target.closest(".row").classList.toggle("sel", e.target.checked);
    updBulk();
  });
  $("#list").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.classList.contains("cur")) return;
    const id = b.closest(".row").dataset.id;
    const m = all.find((x) => x.id === id);
    const act = b.dataset.act;
    if (act === "video") return playVideo(m);
    if (act === "edit") return openEdit(m);
    if (act === "cert") return window.DIFAA_CERT && window.DIFAA_CERT.open({ name: m.name, role: m.role, grade: m.grade });
    if (act === "delete") return del([id]);
    await setStatus([id], act);
  });

  async function setStatus(ids, status) {
    try {
      await api("admin_update", { ids, patch: { status } });
      all.forEach((m) => { if (ids.includes(m.id)) m.status = status; });
      selected.clear(); render();
      toast(status === "approved" ? `تم اعتماد ${ids.length > 1 ? ids.length + " مشاركات" : "المشاركة"} ✓ وستظهر في الموقع` : status === "rejected" ? "تم الرفض، ولن تظهر في الموقع" : "أُعيدت إلى المراجعة");
    } catch (ex) { toast(ex.message, true); }
  }
  $$("#bulk [data-bulk]").forEach((b) => b.addEventListener("click", () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (b.dataset.bulk === "delete") del(ids); else setStatus(ids, b.dataset.bulk);
  }));

  function ask(title, text) {
    const d = $("#confirmDlg");
    $("#confirmTitle").textContent = title; $("#confirmText").textContent = text;
    d.returnValue = "";
    d.showModal();
    return new Promise((res) => d.addEventListener("close", () => res(d.returnValue === "yes"), { once: true }));
  }
  async function del(ids) {
    const ok = await ask(ids.length > 1 ? `حذف ${ids.length} مشاركات نهائيًا؟` : "حذف المشاركة نهائيًا؟", "لن يمكن استرجاعها بعد الحذف، وسيُحذف المقطع المرفق إن وُجد.");
    if (!ok) return;
    try {
      await api("admin_delete", { ids });
      all = all.filter((m) => !ids.includes(m.id));
      ids.forEach((i) => selected.delete(i));
      render(); toast("تم الحذف");
    } catch (ex) { toast(ex.message, true); }
  }

  function playVideo(m) {
    const box = $("#videoBox");
    const u = m.video_url;
    box.innerHTML = u.includes("drive.google.com") ? `<iframe src="${D.esc(u)}" allow="autoplay; fullscreen" allowfullscreen></iframe>` : `<video src="${D.esc(u)}" controls playsinline autoplay></video>`;
    const d = $("#videoDlg");
    d.showModal();
    d.addEventListener("close", () => (box.innerHTML = ""), { once: true });
  }

  // ---------- التعديل والإضافة ----------
  let editing = null;
  function liveFlags() {
    $("#flagsLive").innerHTML = D.flagCats(ef.text.value).map((f) => `<span class="pill flag">⚑ ${f}</span>`).join("");
  }
  ef.text.addEventListener("input", liveFlags);
  function openEdit(m) {
    editing = m || null;
    $("#editTitle").textContent = m ? "تعديل المشاركة" : "إضافة رسالة جديدة";
    ef.name.value = m ? m.name || "" : "";
    ef.role.value = m ? m.role || "" : "";
    ef.grade.value = m ? m.grade || "" : "";
    ef.status.value = m ? m.status : "approved";
    ef.text.value = m ? m.text || "" : "";
    $("#editErr").textContent = "";
    ef._lastBtn = "";
    liveFlags();
    $("#editDlg").showModal();
  }
  $("#addBtn").addEventListener("click", () => openEdit(null));
  ef.addEventListener("submit", async (e) => {
    const sv = (e.submitter && e.submitter.value) || ef._lastBtn || "save";
    ef._lastBtn = "";
    if (sv === "cancel") return;
    e.preventDefault();
    const patch = { name: ef.name.value.trim(), role: ef.role.value, grade: ef.grade.value, status: ef.status.value, text: ef.text.value.trim() };
    if (!patch.text && !(editing && editing.video_url)) { $("#editErr").textContent = "اكتبي نص الرسالة."; return; }
    const btn = $("#saveBtn"); btn.disabled = true;
    try {
      if (editing) {
        await api("admin_update", { ids: [editing.id], patch });
        Object.assign(editing, patch, { _flags: D.flagCats(patch.text) });
        toast("تم حفظ التعديل ✓");
      } else {
        const r = await api("admin_add", { item: patch });
        const m = r.item || Object.assign({ id: "n" + Date.now(), created: new Date().toISOString(), source: "المديرة" }, patch);
        m._flags = D.flagCats(m.text);
        all.push(m);
        toast("تمت إضافة الرسالة ✓");
      }
      $("#editDlg").close();
      render();
    } catch (ex) { $("#editErr").textContent = ex.message; }
    finally { btn.disabled = false; }
  });

  // ---------- التصدير ----------
  let exportKind = "pdf";
  function openExport(kind) {
    exportKind = kind;
    $("#exportTitle").textContent = kind === "pdf" ? "تصدير PDF" : kind === "doc" ? "تصدير Word" : "تصدير Excel";
    $("#pdfTip").hidden = kind !== "pdf";
    $("#exportDlg").showModal();
  }
  $("#pdfBtn").addEventListener("click", () => openExport("pdf"));
  $("#xlsBtn").addEventListener("click", () => openExport("xlsx"));
  $("#docBtn").addEventListener("click", () => openExport("doc"));
  $("#exportDlg").addEventListener("close", () => {
    if ($("#exportDlg").returnValue !== "go") return;
    const f = $("#exportForm");
    const orient = f.orient.value, scope = f.scope.value;
    const rows = scope === "view" ? filtered() : filtered(scope === "approved" ? "approved" : "all");
    const scopeLabel = scope === "view" ? ({ pending: "بانتظار المراجعة", approved: "المعتمدة", rejected: "المرفوضة", flagged: "التنبيهات", all: "كل المشاركات" }[tab]) : scope === "approved" ? "المعتمدة" : "كل المشاركات";
    if (!rows.length) return toast("لا توجد مشاركات للتصدير في هذا الاختيار", true);
    if (exportKind === "pdf") exportPDF(rows, orient, scopeLabel).catch(() => printPDF(rows, orient, scopeLabel));
    else if (exportKind === "doc") exportDOC(rows, orient, scopeLabel);
    else exportXLSX(rows, orient, scopeLabel).catch((ex) => toast("تعذّر إنشاء ملف Excel: " + ex.message, true));
  });

  const today = () => D.fmtDate(new Date().toISOString());
  const todayG = () => new Date().toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });

  // باركود المقطع بألوان هوية المنصة (أخضر داكن، وزر تشغيل ذهبي في الوسط)
  const watchUrl = (m) => m.video_url.replace("/preview", "/view");
  function qrData(url) {
    if (!window.qrcode) return "";
    try {
      const q = window.qrcode(0, "H");
      q.addData(url); q.make();
      const n = q.getModuleCount(), cell = 8, pad = 4 * cell, size = n * cell + pad * 2;
      const cv = document.createElement("canvas");
      cv.width = cv.height = size;
      const x = cv.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, size, size);
      x.fillStyle = "#073826";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) x.fillRect(pad + c * cell, pad + r * cell, cell, cell);
      // عيون الباركود: إطار أخضر رسمي ومركز أخضر داكن (الألوان الفاتحة تمنع القراءة)
      [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
        x.fillStyle = "#ffffff"; x.fillRect(pad + c * cell, pad + r * cell, 7 * cell, 7 * cell);
        x.fillStyle = "#006c35"; x.fillRect(pad + c * cell, pad + r * cell, 7 * cell, 7 * cell);
        x.fillStyle = "#ffffff"; x.fillRect(pad + (c + 1) * cell, pad + (r + 1) * cell, 5 * cell, 5 * cell);
        x.fillStyle = "#073826"; x.fillRect(pad + (c + 2) * cell, pad + (r + 2) * cell, 3 * cell, 3 * cell);
      });
      // زر تشغيل ذهبي في الوسط
      const cx = size / 2, rad = size * 0.09;
      x.fillStyle = "#ffffff"; x.beginPath(); x.arc(cx, cx, rad + cell, 0, 7); x.fill();
      x.fillStyle = "#c9a44c"; x.beginPath(); x.arc(cx, cx, rad, 0, 7); x.fill();
      x.fillStyle = "#073826"; x.beginPath(); x.moveTo(cx - rad * 0.35, cx - rad * 0.5); x.lineTo(cx + rad * 0.55, cx); x.lineTo(cx - rad * 0.35, cx + rad * 0.5); x.closePath(); x.fill();
      return cv.toDataURL("image/png");
    } catch (e) { return ""; }
  }
  const qrCell = (m) => {
    const src = qrData(watchUrl(m));
    return src ? `<a class="rp-qr" href="${D.esc(watchUrl(m))}" target="_blank"><img src="${src}" alt="باركود المقطع"><small>امسحي للمشاهدة</small></a>` : `<a href="${D.esc(watchUrl(m))}">مشاهدة</a>`;
  };

  // ملف PDF جاهز بالاتجاه المختار (يعمل في الآيفون أيضًا)، صفحة صفحة مع تكرار رأس الجدول وترقيم الصفحات
  async function exportPDF(rows, orient, scopeLabel) {
    if (!window.html2canvas || !window.jspdf) return printPDF(rows, orient, scopeLabel);
    toast("جارٍ تجهيز ملف PDF…");
    const land = orient === "landscape";
    const W = land ? 1123 : 794, H = land ? 794 : 1123;
    const c = { approved: 0, pending: 0, rejected: 0 };
    rows.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    const vids = rows.filter((m) => m.video_url).length;
    const head = `<thead><tr><th style="width:4%">م</th><th style="width:${land ? 12 : 14}%">التاريخ</th><th style="width:${land ? 12 : 14}%">الاسم</th><th style="width:${land ? 10 : 12}%">الصفة</th>${land ? '<th style="width:7%">الصف</th>' : ""}<th>الرسالة</th><th style="width:${land ? 10 : 13}%">مقطع</th><th style="width:${land ? 9 : 11}%">الحالة</th></tr></thead>`;
    const ncol = land ? 8 : 7;
    const secHTML = (g) => `<tr class="rp-sec"><td colspan="${ncol}">${g.title} <span>(${g.rows.length})</span></td></tr>`;
    const rowHTML = (m, i) => `<tr><td>${i + 1}</td><td>${D.fmtDate(m.created)}</td><td>${D.esc(m.name || "—")}</td><td>${D.esc(D.roleLabel(m.role) || "—")}${!land && m.grade ? "<br>الصف " + D.esc(m.grade) : ""}</td>${land ? `<td>${D.esc(m.grade || "—")}</td>` : ""}<td class="msg">${D.esc(m.text || "(مشاركة مرئية)")}</td><td class="vq">${m.video_url ? qrCell(m) : "—"}</td><td class="st-${m.status}">${D.STATUS[m.status] || ""}</td></tr>`;
    const host = document.createElement("div");
    host.className = "pdf-host";
    host.style.width = W + "px";
    document.body.appendChild(host);
    const pages = [];
    function newPage() {
      const first = pages.length === 0;
      const pg = document.createElement("div");
      pg.className = "pdf-page";
      pg.style.width = W + "px"; pg.style.height = H + "px";
      pg.innerHTML = (first
        ? `<div class="rp-head"><img src="assets/moe-white.png" alt=""><div class="t"><h1>سجل رسائل منصة «بفكرٍ واعٍ… لوطنٍ آمن»</h1><p>المدرسة الابتدائية الخامسة والستون بعد المائة</p></div><div class="d">${today()}<br>${todayG()}</div></div>
           <div class="rp-sum"><span>المحتوى: ${scopeLabel}</span><span>العدد: ${rows.length}</span><span>معتمدة: ${c.approved}</span><span>بانتظار المراجعة: ${c.pending}</span><span>مرفوضة: ${c.rejected}</span><span>مقاطع مرئية: ${vids}</span></div>`
        : `<div class="rp-mini"><b>سجل رسائل منصة «بفكرٍ واعٍ… لوطنٍ آمن»</b><span>المدرسة الابتدائية الخامسة والستون بعد المائة</span></div>`) +
        `<div class="pdf-body"><table class="rp-table">${head}<tbody></tbody></table></div>
         <div class="rp-foot"><div><b>مديرة المدرسة: أ. جازية السميري</b></div><div class="pno"></div></div>`;
      host.appendChild(pg);
      pages.push(pg);
      return pg;
    }
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      let pg = newPage();
      // عنوان القسم لا يبقى وحده أسفل الصفحة: ينتقل مع أول صف بعده
      const add = (html, isSec) => {
        const body = pg.querySelector(".pdf-body");
        const tb = pg.querySelector("tbody");
        tb.insertAdjacentHTML("beforeend", html);
        if (body.scrollHeight > body.clientHeight && tb.children.length > 1) {
          tb.lastElementChild.remove();
          const carry = !isSec && tb.lastElementChild && tb.lastElementChild.classList.contains("rp-sec") ? tb.lastElementChild : null;
          if (carry) carry.remove();
          pg = newPage();
          const nb = pg.querySelector("tbody");
          if (carry) nb.appendChild(carry);
          nb.insertAdjacentHTML("beforeend", html);
        }
      };
      D.groupRows(rows).forEach((g) => {
        add(secHTML(g), true);
        g.rows.forEach((m, i) => add(rowHTML(m, i), false));
      });
      pages.forEach((p, i) => (p.querySelector(".pno").textContent = `صفحة ${i + 1} من ${pages.length} · منصة الدفاع عن الوطن`));
      await Promise.all([...host.querySelectorAll("img")].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
      const pdf = new window.jspdf.jsPDF({ orientation: orient, unit: "mm", format: "a4", compress: true });
      const pw = land ? 297 : 210, ph = land ? 210 : 297;
      for (let i = 0; i < pages.length; i++) {
        const cv = await window.html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        if (i) pdf.addPage("a4", orient);
        pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
        // الباركود قابل للضغط داخل ملف PDF أيضًا
        const pr = pages[i].getBoundingClientRect();
        pages[i].querySelectorAll("a.rp-qr").forEach((a) => {
          const r = a.getBoundingClientRect();
          pdf.link(((r.left - pr.left) / pr.width) * pw, ((r.top - pr.top) / pr.height) * ph, (r.width / pr.width) * pw, (r.height / pr.height) * ph, { url: a.href });
        });
      }
      pdf.setProperties({ title: "سجل رسائل منصة بفكر واع لوطن آمن" });
      pdf.save(`Watan-Messages-${land ? "landscape" : "portrait"}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast(`تم تجهيز ملف PDF ${land ? "بالعرض" : "بالطول"} (${pages.length} ${pages.length > 2 ? "صفحات" : "صفحة"}) ✓`);
    } finally {
      host.remove();
    }
  }

  function printPDF(rows, orient, scopeLabel) {
    const land = orient === "landscape";
    $("#pageStyle").textContent = `@page { size: A4 ${orient}; margin: 12mm 10mm; }`;
    const c = { approved: 0, pending: 0, rejected: 0 };
    rows.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    const vids = rows.filter((m) => m.video_url).length;
    $("#report").innerHTML = `
      <div class="rp-head">
        <img src="assets/moe-white.png" alt="">
        <div class="t"><h1>سجل رسائل منصة «بفكرٍ واعٍ… لوطنٍ آمن»</h1><p>المدرسة الابتدائية الخامسة والستون بعد المائة</p></div>
        <div class="d">${today()}<br>${todayG()}</div>
      </div>
      <div class="rp-sum"><span>المحتوى: ${scopeLabel}</span><span>العدد: ${rows.length}</span><span>معتمدة: ${c.approved}</span><span>بانتظار المراجعة: ${c.pending}</span><span>مرفوضة: ${c.rejected}</span><span>مقاطع مرئية: ${vids}</span></div>
      <table class="rp-table">
        <thead><tr><th style="width:4%">م</th><th style="width:${land ? 11 : 13}%">التاريخ</th><th style="width:${land ? 12 : 14}%">الاسم</th><th style="width:${land ? 10 : 11}%">الصفة</th>${land ? '<th style="width:7%">الصف</th>' : ""}<th>الرسالة</th><th style="width:${land ? 10 : 13}%">مقطع</th><th style="width:${land ? 9 : 10}%">الحالة</th></tr></thead>
        <tbody>${D.groupRows(rows).map((g) => `<tr class="rp-sec"><td colspan="${land ? 8 : 7}">${g.title} <span>(${g.rows.length})</span></td></tr>` + g.rows.map((m, i) => `<tr>
          <td>${i + 1}</td><td>${D.fmtDate(m.created)}</td><td>${D.esc(m.name || "—")}</td><td>${D.esc(D.roleLabel(m.role) || "—")}${!land && m.grade ? "<br>الصف " + D.esc(m.grade) : ""}</td>
          ${land ? `<td>${D.esc(m.grade || "—")}</td>` : ""}
          <td class="msg">${D.esc(m.text || "(مشاركة مرئية)")}</td><td class="vq">${m.video_url ? qrCell(m) : "—"}</td><td class="st-${m.status}">${D.STATUS[m.status] || ""}</td></tr>`).join("")).join("")}</tbody>
      </table>
      <div class="rp-foot"><div><b>مديرة المدرسة: أ. جازية السميري</b></div><div>منصة الدفاع عن الوطن · ${rows.length} مشاركة</div></div>`;
    const img = $("#report img");
    const go = () => setTimeout(() => window.print(), 150);
    img.complete ? go() : (img.onload = img.onerror = go);
  }

  // ملف Word (يفتح في Word وPages وGoogle Docs) بالاتجاه المختار، مقسّم بعناوين الفئات
  async function exportDOC(rows, orient, scopeLabel) {
    const land = orient === "landscape";
    const logo = await getLogo().catch(() => "");
    const c = { approved: 0, pending: 0, rejected: 0 };
    rows.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    const size = land ? "841.9pt 595.3pt" : "595.3pt 841.9pt";
    const th = (t, w) => `<th style="background:#006c35;color:#fff;border:1px solid #0b4d33;padding:5pt;font-size:11pt${w ? ";width:" + w : ""}">${t}</th>`;
    const td = (t, x) => `<td style="border:1px solid #e3d9c2;padding:5pt;font-size:10.5pt;vertical-align:top${x || ""}">${t}</td>`;
    const fr = [0.045, 0.13, 0.15, 0.09, 0.07, 0, 0.07, 0.1];
    fr[5] = 1 - fr.reduce((x, y) => x + y, 0);
    const wpt = fr.map((x) => (x * 100).toFixed(1) + "%");
    const cols = `<colgroup>${wpt.map((w) => `<col style="width:${w}" width="${w}">`).join("")}</colgroup>`;
    const head = `<tr>${["م", "التاريخ", "الاسم", "الصفة", "الصف", "الرسالة", "مقطع", "الحالة"].map((t, i) => th(t, wpt[i])).join("")}</tr>`;
    const stc = { approved: "#006c35", pending: "#a86a00", rejected: "#b3261e" };
    const sections = D.groupRows(rows).map((g) => `
      <h2 style="font-size:15pt;color:#ffffff;background:#073826;padding:6pt 10pt;margin:16pt 0 6pt;border-right:6pt solid #c9a44c">${g.title} (${g.rows.length})</h2>
      <table dir="rtl" style="width:100%;border-collapse:collapse;table-layout:fixed" width="100%">${cols}<thead>${head}</thead><tbody>${g.rows.map((m, i) => `<tr>
        ${td(i + 1, ";text-align:center")}${td(D.fmtDate(m.created))}${td(D.esc(m.name || "—"), ";font-weight:bold")}${td(D.esc(D.roleLabel(m.role) || "—"))}${td(D.esc(m.grade || "—"))}
        ${td(D.esc(m.text || "(مشاركة مرئية)"))}${td(m.video_url ? `<a href="${D.esc(m.video_url.replace("/preview", "/view"))}">مشاهدة</a>` : "—")}${td(D.STATUS[m.status] || "", ";font-weight:bold;color:" + (stc[m.status] || "#073826"))}</tr>`).join("")}</tbody></table>`).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl"><head><meta charset="utf-8"><title>سجل رسائل المنصة</title>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
      <style>@page WordSection1{size:${size};mso-page-orientation:${orient};margin:1.5cm 1.3cm}div.WordSection1{page:WordSection1}body{font-family:Arial,"Traditional Arabic",sans-serif;direction:rtl}thead{display:table-header-group}</style></head>
      <body dir="rtl"><div class="WordSection1" dir="rtl">
        <table dir="rtl" style="width:100%;border-collapse:collapse;background:#073826" width="100%"><tr>
          <td style="padding:8pt;width:70pt">${logo ? `<img src="${logo}" width="64" height="48">` : ""}</td>
          <td style="padding:8pt;color:#e3c67d;font-size:17pt;font-weight:bold">سجل رسائل منصة «بفكرٍ واعٍ… لوطنٍ آمن»<br><span style="color:#ffffff;font-size:11pt;font-weight:normal">المدرسة الابتدائية الخامسة والستون بعد المائة</span></td>
          <td style="padding:8pt;color:#ffffff;font-size:10pt;text-align:left">${today()}<br>${todayG()}</td></tr></table>
        <p style="font-size:10.5pt;color:#073826;background:#f3ebda;padding:5pt 8pt">المحتوى: ${scopeLabel} · العدد: ${rows.length} · معتمدة: ${c.approved} · بانتظار المراجعة: ${c.pending} · مرفوضة: ${c.rejected}</p>
        ${sections}
        <p style="margin-top:22pt;border-top:2pt solid #c9a44c;padding-top:6pt;font-size:12pt;color:#073826"><b>مديرة المدرسة: أ. جازية السميري</b></p>
      </div></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Watan-Messages-${land ? "landscape" : "portrait"}-${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(`تم تجهيز ملف Word ${land ? "بالعرض" : "بالطول"} ✓`);
  }

  let logoB64 = null;
  async function getLogo() {
    if (logoB64) return logoB64;
    const b = await (await fetch("assets/moe-white.png")).blob();
    logoB64 = await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    return logoB64;
  }

  async function exportXLSX(rows, orient, scopeLabel) {
    if (!window.ExcelJS) throw new Error("لم تُحمَّل مكتبة Excel بعد، تأكدي من الإنترنت");
    const land = orient === "landscape";
    const GREEN = "FF006C35", DARK = "FF073826", GOLD = "FFC9A44C", IVORY = "FFFBF7EE", SAND = "FFE3D9C2";
    const wb = new ExcelJS.Workbook();
    wb.creator = "منصة بفكرٍ واعٍ… لوطنٍ آمن"; wb.created = new Date();
    const ws = wb.addWorksheet("الرسائل", {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 5, showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: orient, fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 } },
      headerFooter: { oddFooter: "&Cصفحة &P من &N&Rمديرة المدرسة: أ. جازية السميري" },
    });
    const cols = [
      { h: "م", w: 5 }, { h: "التاريخ", w: 24 }, { h: "الاسم", w: 18 }, { h: "الصفة", w: 14 }, { h: "الصف", w: 9 },
      { h: "الرسالة", w: land ? 70 : 48 }, { h: "المقطع", w: 14 }, { h: "الحالة", w: 15 }, { h: "تنبيه", w: 16 },
    ];
    ws.columns = cols.map((c) => ({ width: c.w }));
    const last = String.fromCharCode(64 + cols.length);
    const border = { top: { style: "thin", color: { argb: SAND } }, bottom: { style: "thin", color: { argb: SAND } }, left: { style: "thin", color: { argb: SAND } }, right: { style: "thin", color: { argb: SAND } } };
    const font = (o) => Object.assign({ name: "Arial", size: 11 }, o);

    ws.mergeCells(`A1:${last}1`);
    Object.assign(ws.getCell("A1"), { value: "سجل رسائل منصة «بفكرٍ واعٍ… لوطنٍ آمن»" });
    ws.getCell("A1").font = font({ size: 17, bold: true, color: { argb: "FFE3C67D" } });
    ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 46;

    ws.mergeCells(`A2:${last}2`);
    ws.getCell("A2").value = "المدرسة الابتدائية الخامسة والستون بعد المائة · مديرة المدرسة: أ. جازية السميري";
    ws.getCell("A2").font = font({ size: 12, bold: true, color: { argb: "FFFFFFFF" } });
    ws.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    ws.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 26;

    const c = { approved: 0, pending: 0, rejected: 0 };
    rows.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    ws.mergeCells(`A3:${last}3`);
    ws.getCell("A3").value = `تاريخ التصدير: ${today()} (${todayG()})   ·   المحتوى: ${scopeLabel}   ·   العدد: ${rows.length}   ·   معتمدة: ${c.approved}   ·   بانتظار المراجعة: ${c.pending}   ·   مرفوضة: ${c.rejected}`;
    ws.getCell("A3").font = font({ size: 10.5, color: { argb: DARK } });
    ws.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3EBDA" } };
    ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(3).height = 22;
    ws.getRow(4).height = 6;

    const hr = ws.getRow(5);
    hr.values = cols.map((x) => x.h);
    hr.height = 28;
    hr.eachCell((cell) => {
      cell.font = font({ bold: true, color: { argb: DARK } });
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: { style: "thin", color: { argb: "FF9C7A2C" } }, bottom: { style: "medium", color: { argb: "FF9C7A2C" } }, left: { style: "thin", color: { argb: "FF9C7A2C" } }, right: { style: "thin", color: { argb: "FF9C7A2C" } } };
    });

    const stColor = { approved: GREEN, pending: "FFA86A00", rejected: "FFB3261E" };
    D.groupRows(rows).forEach((g) => {
      const sr = ws.addRow([`${g.title}  (${g.rows.length})`]);
      ws.mergeCells(`A${sr.number}:${last}${sr.number}`);
      sr.height = 26;
      sr.getCell(1).font = font({ size: 13, bold: true, color: { argb: "FFFFFFFF" } });
      sr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
      sr.getCell(1).alignment = { horizontal: "right", vertical: "middle", indent: 1, readingOrder: "rtl" };
      g.rows.forEach((m, i) => addMsgRow(m, i));
    });
    function addMsgRow(m, i) {
      const r = ws.addRow([i + 1, D.fmtDate(m.created, true), m.name || "—", D.roleLabel(m.role) || "—", m.grade || "—", m.text || "(مشاركة مرئية)", m.video_url ? "مشاهدة المقطع" : "—", D.STATUS[m.status] || "", (m._flags || []).join("، ")]);
      const lines = Math.max(1, Math.ceil(String(m.text || "").length / (land ? 75 : 50)));
      r.height = Math.max(36, lines * 17 + 8);
      r.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = font({ size: 11 });
        cell.border = border;
        cell.alignment = { vertical: "top", horizontal: col === 6 ? "right" : "center", wrapText: true, readingOrder: "rtl" };
        if (i % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: IVORY } };
      });
      r.getCell(8).font = font({ bold: true, color: { argb: stColor[m.status] || DARK } });
      if (m._flags && m._flags.length) r.getCell(9).font = font({ bold: true, color: { argb: "FFB3261E" } });
      if (m.video_url) { r.getCell(7).value = { text: "مشاهدة المقطع", hyperlink: m.video_url.replace("/preview", "/view") }; r.getCell(7).font = font({ color: { argb: "FF0563C1" }, underline: true }); }
    }
    ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: cols.length } };
    ws.pageSetup.printTitlesRow = "5:5";

    try {
      const id = wb.addImage({ base64: await getLogo(), extension: "png" });
      ws.addImage(id, { tl: { col: 0.15, row: 0.12 }, ext: { width: 54, height: 41 } });
    } catch (e) {}

    // ورقة الملخص
    const s = wb.addWorksheet("ملخص", { views: [{ rightToLeft: true, showGridLines: false }], pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1 } });
    s.columns = [{ width: 34 }, { width: 14 }];
    s.mergeCells("A1:B1");
    s.getCell("A1").value = "ملخص المشاركات";
    s.getCell("A1").font = font({ size: 15, bold: true, color: { argb: "FFE3C67D" } });
    s.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    s.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    s.getRow(1).height = 36;
    const block = (title, pairs) => {
      const h = s.addRow([title, "العدد"]);
      h.eachCell((cell) => { cell.font = font({ bold: true, color: { argb: "FFFFFFFF" } }); cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } }; cell.alignment = { horizontal: "center" }; cell.border = border; });
      pairs.forEach(([k, v], i) => {
        const r = s.addRow([k, v]);
        r.eachCell((cell) => { cell.font = font(); cell.border = border; cell.alignment = { horizontal: "center" }; if (i % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: IVORY } }; });
      });
      s.addRow([]);
    };
    s.addRow([]);
    block("الحالة", [["معتمدة", c.approved], ["بانتظار المراجعة", c.pending], ["مرفوضة", c.rejected], ["الإجمالي", rows.length]]);
    const byRole = {};
    rows.forEach((m) => { const k = D.roleLabel(m.role) || "غير محدد"; byRole[k] = (byRole[k] || 0) + 1; });
    block("الصفة", Object.entries(byRole));
    block("نوع المشاركة", [["رسالة نصية", rows.filter((m) => !m.video_url).length], ["مقطع مرئي", rows.filter((m) => m.video_url).length]]);

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Watan-Messages-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("تم تجهيز ملف Excel ✓");
  }
})();
