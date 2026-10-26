// شهادة شكر وتقدير للمشاركين — تُستخدم في الموقع العام (بعد الإرسال) وفي لوحة المديرة.
// تُرسم الشهادة كعنصر بحجم A4 ثم تُحوَّل إلى PDF أو صورة، أو تُطبع، بالطول أو بالعرض.
(function () {
  const D = window.DIFAA;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SIZE = { landscape: [1123, 794], portrait: [794, 1123] };
  const PARENT_ROLES = ["ولي أمر", "ولية أمر"];

  // ---------- خريطة المملكة (علامة مائية) ----------
  let mapPath = "";
  fetch("assets/sau.json").then((r) => r.json()).then((ring) => {
    const lo = [34.4, 55.8], la = [16.2, 32.3];
    const W = 100, H = 100 * ((la[1] - la[0]) / (lo[1] - lo[0]));
    mapPath = { d: ring.map(([x, y], i) => (i ? "L" : "M") + (((x - lo[0]) / (lo[1] - lo[0])) * W).toFixed(2) + " " + (((la[1] - y) / (la[1] - la[0])) * H).toFixed(2)).join("") + "Z", vb: `0 0 ${W} ${H.toFixed(2)}` };
  }).catch(() => {});

  const corner = `<svg viewBox="0 0 100 100" class="c-corner-svg"><path d="M4 96V4h92" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 96V14h82" fill="none" stroke="currentColor" stroke-width="1"/><path d="M14 14 30 30" stroke="currentColor" stroke-width="1"/><path d="M30 22 38 30 30 38 22 30Z" fill="currentColor"/><path d="M4 4 9 9" stroke="currentColor" stroke-width="2.4"/><circle cx="56" cy="14" r="2.4" fill="currentColor"/><circle cx="14" cy="56" r="2.4" fill="currentColor"/></svg>`;
  const star = `<svg viewBox="0 0 40 40"><path d="M20 2 25 15 38 20 25 25 20 38 15 25 2 20 15 15Z" fill="currentColor"/></svg>`;

  // ---------- نص الشهادة ----------
  function salutation(o) {
    const isParent = PARENT_ROLES.includes(o.role);
    const female = ["ولية أمر", "طالبة", "معلمة", "منسوبة المدرسة"].includes(o.role);
    const title = o.role === "ولي أمر" ? "الأستاذ" : o.role === "ولية أمر" ? "الأستاذة" : o.role === "طالبة" ? "الطالبة" : o.role === "معلمة" ? "المعلمة" : o.role === "منسوبة المدرسة" ? "الأستاذة" : "";
    let sub = "";
    if (o.student) sub = `${isParent ? (female ? "ولية أمر" : "ولي أمر") + " " : ""}الطالبة: <b>${esc(o.student)}</b>${o.grade ? ` · الصف ${esc(o.grade)}` : ""}`;
    else if (o.role === "طالبة" && o.grade) sub = `الصف ${esc(o.grade)}`;
    return { title, sub, female };
  }

  function certHTML(o, orient) {
    const [W, H] = SIZE[orient];
    const s = salutation(o);
    const date = D.fmtDate(new Date().toISOString());
    const map = `<img class="c-map" alt="" src="assets/sau-map.png">`;
    return `<div class="cert cert-${orient}" style="width:${W}px;height:${H}px">
      <div class="c-paper">
        ${map}
        <div class="c-frame">
          <span class="c-corner tr">${corner}</span><span class="c-corner tl">${corner}</span><span class="c-corner br">${corner}</span><span class="c-corner bl">${corner}</span>
          <div class="c-in">
            <div class="c-top">
              <div class="c-logo"><img src="assets/moe-white.png" alt=""></div>
              
              <div class="c-tag"><img src="assets/flag.png" alt=""><span>الدفاع عن الوطن<br><b>بفكرٍ واعٍ… لوطنٍ آمن</b></span></div>
            </div>
            <h1 class="c-title">شهادة شكر وتقدير</h1>
            <div class="c-orn"><i></i>${star}<i></i></div>
            <p class="c-lead">تتقدّم إدارة المدرسة الابتدائية الخامسة والستين بعد المائة بخالص الشكر والتقدير إلى</p>
            <div class="c-name">${s.title ? `<small>${s.title}</small>` : ""}<span>${esc(o.name || "")}</span><i class="c-nline"></i></div>
            ${s.sub ? `<p class="c-sub">${s.sub}</p>` : ""}
            <p class="c-body">على مشاركتكم المميّزة في منصة «بفكرٍ واعٍ… لوطنٍ آمن» للدفاع عن الوطن، تعبيرًا صادقًا عن حبّ الوطن والوفاء له،<br>سائلين الله أن يحفظ وطننا وقيادتنا وجنودنا البواسل، وأن يديم علينا نعمة الأمن والأمان.</p>
            <div class="c-foot">
              <div class="c-date"><span>حُرّرت في</span><b>${date}</b></div>
              <div class="c-seal"><div class="c-seal-in"><img src="assets/flag.png" alt=""><span>الدفاع عن الوطن</span><small>ابتدائية ١٦٥</small></div></div>
              <div class="c-sign"><span>مديرة المدرسة</span><b>أ. جازية السميري</b><i></i><em>التوقيع</em></div>
            </div>
            <div class="c-base"><span>الإدارة العامة للتعليم بمحافظة جدة</span><span>المدرسة الابتدائية الخامسة والستون بعد المائة</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ---------- الأنماط ----------
  const css = `
  .cert{position:relative;box-sizing:border-box;direction:rtl;font-family:"Tajawal","Noto Kufi Arabic",sans-serif;color:#1b2a23;background:#fbf7ee;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cert *{box-sizing:border-box}
  .c-paper{position:absolute;inset:0;padding:22px;background:radial-gradient(70% 60% at 50% 45%,#fffdf6 0%,#f7f0de 70%,#efe4c8 100%)}
  .c-map{position:absolute;left:50%;top:52%;width:52%;height:62%;transform:translate(-50%,-50%);opacity:.08;object-fit:contain}
  .c-frame{position:relative;height:100%;border:3px solid #0b4d33;padding:10px}
  .c-frame::before{content:"";position:absolute;inset:6px;border:1.5px solid #c9a44c;pointer-events:none}
  .c-frame::after{content:"";position:absolute;inset:11px;border:1px solid rgba(201,164,76,.45);pointer-events:none}
  .c-corner{position:absolute;width:86px;height:86px;color:#b8933a;z-index:2}
  .c-corner-svg{width:100%;height:100%;display:block}
  .c-corner.tr{top:-3px;right:-3px;transform:scaleX(-1)} .c-corner.tl{top:-3px;left:-3px}
  .c-corner.br{bottom:-3px;right:-3px;transform:scale(-1,-1)} .c-corner.bl{bottom:-3px;left:-3px;transform:scaleY(-1)}
  .c-in{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 58px 16px}
  .c-top{width:100%;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px}
  .c-org{grid-column:1;grid-row:1;justify-self:start;text-align:right;font-size:15px;line-height:1.8;color:#3d4b44}
  .c-org b{color:#0b4d33;font-weight:800}
  .c-logo{grid-column:2;grid-row:1;width:118px;height:118px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#1f8a55,#073826 70%);display:grid;place-items:center;box-shadow:0 0 0 5px #fbf7ee,0 0 0 7px #c9a44c,0 0 0 11px #fbf7ee,0 0 0 12px rgba(201,164,76,.5),0 10px 24px -8px rgba(4,36,26,.5)}
  .c-logo img{width:92px;height:auto}
  .c-tag{grid-column:3;grid-row:1;justify-self:end;display:flex;align-items:center;gap:10px;font-size:12.5px;line-height:1.6;color:#3d4b44;text-align:right}
  .c-tag img{width:54px;height:36px;object-fit:cover;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
  .c-tag b{font-family:"Noto Kufi Arabic",sans-serif;color:#9c7a2c;font-size:12.5px}
  .c-title{margin:6px 0 0;font-family:"Aref Ruqaa","Noto Kufi Arabic",serif;font-weight:700;font-size:54px;line-height:1.25;color:#0b4d33}
  .c-orn{display:flex;align-items:center;gap:12px;color:#c9a44c;margin:22px 0 6px}
  .c-orn i{display:block;width:150px;height:1.5px;background:linear-gradient(90deg,transparent,#c9a44c)}
  .c-orn i:last-child{background:linear-gradient(90deg,#c9a44c,transparent)}
  .c-orn svg{width:20px;height:20px}
  .c-lead{margin:0;font-size:20px;color:#3d4b44}
  .c-name{margin:8px 0 2px;display:flex;flex-direction:column;align-items:center}
  .c-name small{font-size:16px;color:#9c7a2c;font-weight:700}
  .c-name span{font-family:"Noto Kufi Arabic",sans-serif;font-weight:800;font-size:40px;line-height:1.5;color:#006c35;padding:0 30px}
  .c-nline{display:block;width:540px;max-width:90%;height:2px;margin-top:18px;background:linear-gradient(90deg,transparent,#c9a44c 15%,#c9a44c 85%,transparent)}
  .c-sub{margin:8px 0 0;font-size:17px;color:#3d4b44}
  .c-sub b{color:#0b4d33}
  .c-body{margin:8px 0 8px;font-size:17.5px;line-height:1.8;color:#2c3a33;max-width:860px}
  .c-foot{margin-top:auto;width:100%;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:20px}
  .c-date{justify-self:start;display:flex;flex-direction:column;align-items:flex-start;font-size:13px;color:#5d6b63}
  .c-date b{font-family:"Noto Kufi Arabic",sans-serif;font-size:15px;color:#0b4d33}
  .c-seal{width:108px;height:108px;border-radius:50%;border:3px double #c9a44c;display:grid;place-items:center;background:radial-gradient(circle,#fffaf0,#f3e7c6)}
  .c-seal-in{width:88px;height:88px;border-radius:50%;border:1.5px solid #0b4d33;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
  .c-seal-in img{width:44px;height:29px;border-radius:3px}
  .c-seal-in span{font-family:"Noto Kufi Arabic",sans-serif;font-weight:800;font-size:9.5px;color:#0b4d33;line-height:1.4}
  .c-seal-in small{font-size:9.5px;color:#9c7a2c;font-weight:700}
  .c-sign{justify-self:end;display:flex;flex-direction:column;align-items:center;min-width:220px}
  .c-sign span{font-size:15px;color:#5d6b63}
  .c-sign b{font-family:"Noto Kufi Arabic",sans-serif;font-size:21px;font-weight:800;color:#0b4d33;margin-top:2px}
  .c-sign i{display:block;width:200px;height:24px;border-bottom:1.5px dashed #9c7a2c}
  .c-sign em{font-style:normal;font-size:11.5px;color:#9c7a2c;margin-top:3px}
  .c-base{width:100%;display:flex;justify-content:space-between;gap:20px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(201,164,76,.55);font-family:"Noto Kufi Arabic",sans-serif;font-weight:700;font-size:13px;color:#0b4d33}
  /* الطولي */
  .cert-portrait .c-in{padding:34px 44px 30px}
  .cert-portrait .c-top{grid-template-columns:1fr;justify-items:center;gap:8px}
  .cert-portrait .c-logo{grid-column:1;grid-row:1;width:128px;height:128px}
  .cert-portrait .c-logo img{width:100px}
  .cert-portrait .c-name span{line-height:1.6}
  .cert-portrait .c-seal-in{width:96px;height:96px}
  .cert-portrait .c-logo img{width:72px}
  .cert-portrait .c-org{grid-column:1;grid-row:2;justify-self:center;text-align:center;line-height:1.6}
  .cert-portrait .c-tag{grid-column:1;grid-row:2;justify-self:center;margin-top:10px}
  .cert-portrait .c-title{margin-top:auto;font-size:62px}
  .cert-portrait .c-orn{margin:30px 0 12px}
  .cert-portrait .c-lead{font-size:19px}
  .cert-portrait .c-name{margin-top:14px}
  .cert-portrait .c-name span{font-size:40px;padding:0 10px}
  .cert-portrait .c-nline{width:460px}
  .cert-portrait .c-body{font-size:18px;line-height:1.95;margin-top:22px;margin-bottom:0}
  .cert-portrait .c-foot{margin-top:auto}
  .cert-portrait .c-map{width:78%;height:46%;top:56%}
  .cert-portrait .c-foot{grid-template-columns:1fr auto 1fr;gap:10px}
  .cert-portrait .c-seal{width:120px;height:120px}
  .cert-portrait .c-sign{min-width:0}
  .cert-portrait .c-sign i{width:170px}
  .cert-portrait .c-base{font-size:12px}
  /* نافذة الشهادة */
  .cdlg{position:fixed;inset:0;z-index:200;background:rgba(2,18,12,.82);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 12px 24px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
  .cdlg[hidden]{display:none}
  .cdlg-card{width:min(1180px,100%);background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 40px 90px -30px #000;direction:rtl;font-family:"Tajawal","Noto Kufi Arabic",sans-serif;color:#1b2a23}
  .cdlg-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:linear-gradient(135deg,#073826,#021a12);color:#fff}
  .cdlg-head h3{margin:0;font-family:"Noto Kufi Arabic",sans-serif;font-size:18px;color:#e3c67d}
  .cdlg-x{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:18px;cursor:pointer}
  .cdlg-body{display:grid;grid-template-columns:300px 1fr;gap:0}
  .cdlg-form{padding:18px;border-left:1px solid #eadfc6;background:#fbf7ee;display:flex;flex-direction:column;gap:12px}
  .cdlg-form label{display:block;font-weight:700;font-size:14px;color:#073826}
  .cdlg-form input,.cdlg-form select{display:block;width:100%;margin-top:5px;font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid #eadfc6;border-radius:12px;background:#fff;color:#1b2a23}
  .cdlg-form input:focus,.cdlg-form select:focus{outline:none;border-color:#006c35;box-shadow:0 0 0 3px rgba(0,108,53,.12)}
  .cseg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:5px}
  .cseg label{position:relative;cursor:pointer}
  .cseg input{position:absolute;opacity:0;margin:0}
  .cseg span{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:12px;border:1.5px solid #eadfc6;background:#fff;font-weight:700;font-size:14.5px}
  .cseg input:checked+span{border-color:#006c35;background:#e9f5ee;color:#073826}
  .cseg i{display:inline-block;border:2px solid currentColor;border-radius:2px;opacity:.7}
  .cbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;border:0;border-radius:14px;cursor:pointer;font-family:"Noto Kufi Arabic",sans-serif;font-weight:700;font-size:15px}
  .cbtn.gold{background:linear-gradient(135deg,#f4e4b5,#e3c67d 40%,#c9a44c);color:#04241a}
  .cbtn.green{background:#006c35;color:#fff}
  .cbtn.line{background:#fff;color:#073826;border:1.5px solid #eadfc6}
  .cbtn[disabled]{opacity:.6;cursor:wait}
  .cnote{font-size:13px;color:#5d6b63;line-height:1.7;margin:0}
  .cdlg-prev{padding:18px;display:grid;place-items:center;background:repeating-linear-gradient(45deg,#f3ebda 0 12px,#f7f1e3 12px 24px);min-height:300px;overflow:hidden}
  .cprev-box{position:relative;box-shadow:0 18px 40px -18px rgba(0,0,0,.5)}
  .cprev-box .cert{position:absolute;top:0;right:0;transform-origin:top right}
  .c-host{position:fixed;top:0;left:-20000px;z-index:-1}
  @media (max-width:820px){.cdlg-body{grid-template-columns:1fr}.cdlg-form{border-left:0;border-bottom:1px solid #eadfc6}.cdlg-prev{order:-1}}
  @media print{body.cert-printing>*:not(#certPrint){display:none!important}body.cert-printing #certPrint{display:block!important}#certPrint .cert{page-break-after:avoid}}
  #certPrint{display:none}
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  // ---------- النافذة ----------
  const dlg = document.createElement("div");
  dlg.className = "cdlg"; dlg.hidden = true;
  dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-label", "شهادة الشكر");
  dlg.innerHTML = `<div class="cdlg-card">
    <div class="cdlg-head"><h3>🎖️ شهادة شكر وتقدير</h3><button class="cdlg-x" type="button" aria-label="إغلاق">✕</button></div>
    <div class="cdlg-body">
      <div class="cdlg-form">
        <label>الاسم على الشهادة<input id="cName" maxlength="60" autocomplete="name"></label>
        <label>الصفة<select id="cRole"><option value="">بدون</option></select></label>
        <label>اسم الطالبة (اختياري)<input id="cStudent" maxlength="60" placeholder="لتظهر: ولي أمر الطالبة …"></label>
        <label>الصف (اختياري)<select id="cGrade"><option value="">—</option></select></label>
        <div><b style="font-size:14px;color:#073826">اتجاه الصفحة</b>
          <div class="cseg"><label><input type="radio" name="cOri" value="landscape" checked><span><i style="width:20px;height:14px"></i>أفقي</span></label><label><input type="radio" name="cOri" value="portrait"><span><i style="width:14px;height:20px"></i>طولي</span></label></div>
        </div>
        <button class="cbtn gold" id="cPdf" type="button">⬇️ تحميل الشهادة PDF</button>
        <button class="cbtn green" id="cPng" type="button">🖼️ تحميل كصورة</button>
        <button class="cbtn line" id="cPrint" type="button">🖨️ طباعة</button>
        <p class="cnote">في الآيفون: يفتح الملف، اضغطوا زر المشاركة ⬆️ ثم «حفظ في الملفات» أو «طباعة».</p>
      </div>
      <div class="cdlg-prev"><div class="cprev-box" id="cPrev"></div></div>
    </div>
  </div>`;
  document.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s);
  D.ROLES.forEach((r) => $("#cRole").insertAdjacentHTML("beforeend", `<option value="${r}">${D.roleLabel(r)}</option>`));
  D.GRADES.forEach((g) => $("#cGrade").insertAdjacentHTML("beforeend", `<option>${g}</option>`));
  const printBox = document.createElement("div");
  printBox.id = "certPrint";
  document.body.appendChild(printBox);

  const data = () => ({ name: $("#cName").value.trim(), role: $("#cRole").value, student: $("#cStudent").value.trim(), grade: $("#cGrade").value });
  const orient = () => dlg.querySelector('input[name="cOri"]:checked').value;

  function preview() {
    const o = orient(), [W, H] = SIZE[o];
    const box = $("#cPrev"), area = $(".cdlg-prev");
    const avail = Math.min(area.clientWidth - 36, 860);
    const k = Math.min(1, avail / W, o === "portrait" ? 640 / H : 1);
    box.style.width = W * k + "px"; box.style.height = H * k + "px";
    box.innerHTML = certHTML(data(), o);
    box.firstElementChild.style.transform = `scale(${k})`;
  }
  ["#cName", "#cStudent"].forEach((s) => $(s).addEventListener("input", preview));
  ["#cRole", "#cGrade"].forEach((s) => $(s).addEventListener("change", preview));
  dlg.querySelectorAll('input[name="cOri"]').forEach((r) => r.addEventListener("change", preview));
  addEventListener("resize", () => { if (!dlg.hidden) preview(); });

  function close() { dlg.hidden = true; document.body.style.overflow = ""; }
  $(".cdlg-x").addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !dlg.hidden) close(); });

  async function render() {
    if (!window.html2canvas) throw new Error("لم تُحمَّل أداة الشهادة، تأكّدوا من الإنترنت");
    const o = orient();
    const host = document.createElement("div");
    host.className = "c-host";
    host.innerHTML = certHTML(data(), o);
    document.body.appendChild(host);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await Promise.all([...host.querySelectorAll("img")].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
      return { canvas: await window.html2canvas(host.firstElementChild, { scale: 2.5, backgroundColor: "#fbf7ee", useCORS: true, logging: false }), o };
    } finally { host.remove(); }
  }
  const fileBase = () => "Certificate-" + (data().name || "Watan").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
  function busy(b, on, label) { b.disabled = on; if (label) b.textContent = label; }

  $("#cPdf").addEventListener("click", async (e) => {
    const b = e.currentTarget, t = b.textContent;
    if (!data().name) { $("#cName").focus(); return; }
    busy(b, true, "جارٍ التجهيز…");
    try {
      const { canvas, o } = await render();
      const pdf = new window.jspdf.jsPDF({ orientation: o, unit: "mm", format: "a4", compress: true });
      const [pw, ph] = o === "landscape" ? [297, 210] : [210, 297];
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pw, ph);
      pdf.setProperties({ title: "شهادة شكر وتقدير" });
      pdf.save(fileBase().replace(/[^\x20-\x7e]/g, "") + "-" + o + ".pdf");
    } catch (ex) { alert(ex.message); }
    busy(b, false, t);
  });
  $("#cPng").addEventListener("click", async (e) => {
    const b = e.currentTarget, t = b.textContent;
    if (!data().name) { $("#cName").focus(); return; }
    busy(b, true, "جارٍ التجهيز…");
    try {
      const { canvas, o } = await render();
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Certificate-" + o + ".png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (ex) { alert(ex.message); }
    busy(b, false, t);
  });
  $("#cPrint").addEventListener("click", () => {
    if (!data().name) { $("#cName").focus(); return; }
    const o = orient();
    let ps = document.getElementById("certPage");
    if (!ps) { ps = document.createElement("style"); ps.id = "certPage"; document.head.appendChild(ps); }
    ps.textContent = `@page{size:A4 ${o};margin:0}`;
    printBox.innerHTML = certHTML(data(), o);
    document.body.classList.add("cert-printing");
    addEventListener("afterprint", () => document.body.classList.remove("cert-printing"), { once: true });
    const imgs = [...printBox.querySelectorAll("img")];
    Promise.all(imgs.map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r))))).then(() => setTimeout(() => window.print(), 150));
  });

  // الواجهة العامة
  window.DIFAA_CERT = {
    open(o) {
      o = o || {};
      $("#cName").value = o.name || "";
      $("#cRole").value = D.ROLES.includes(o.role) ? o.role : "";
      $("#cStudent").value = o.student || "";
      $("#cGrade").value = D.GRADES.includes(o.grade) ? o.grade : "";
      dlg.querySelector(`input[name="cOri"][value="${o.orient === "portrait" ? "portrait" : "landscape"}"]`).checked = true;
      dlg.hidden = false; document.body.style.overflow = "hidden";
      dlg.scrollTop = 0;
      requestAnimationFrame(preview);
      if (!o.name) setTimeout(() => $("#cName").focus(), 100);
    },
    html: certHTML,
  };
})();
