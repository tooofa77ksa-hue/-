// طبقة البيانات المشتركة بين الموقع العام ولوحة المديرة.
// تتصل بـ Google Apps Script، أو تعمل محليًا في وضع المعاينة.
(function () {
  const CFG = window.DIFAA_CONFIG || {};
  const API = (CFG.API_URL || "").trim();
  const DEMO = !API;
  const LS = "difaa_demo_v1";

  const ROLES = ["ولي أمر", "ولية أمر", "طالبة", "معلمة", "منسوبة المدرسة", "زائر"];
  const GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
  const STATUS = { pending: "بانتظار المراجعة", approved: "معتمدة", rejected: "مرفوضة" };

  // ---------- وضع المعاينة ----------
  function seed() {
    const now = Date.now();
    const h = 3600e3;
    const s = (o, i) => Object.assign({ id: "d" + i, grade: "", video_id: "", video_url: "", source: "زائر", updated: "" }, o);
    return [
      s({ created: new Date(now - 50 * h).toISOString(), name: "أم ريم", role: "ولية أمر", grade: "الرابع", text: "وطني يا عزّي وفخري، نربّي بناتنا على حبك والدعاء لك، ونقول لجنودنا البواسل: أنتم في قلوبنا، حفظكم الله ونصركم.", status: "approved" }, 1),
      s({ created: new Date(now - 40 * h).toISOString(), name: "لمى", role: "طالبة", grade: "السادس", text: "أتحقق قبل أن أنشر، لأن الكلمة أمانة، ووطني يستحق مني الوعي والوفاء.", status: "approved" }, 2),
      s({ created: new Date(now - 30 * h).toISOString(), name: "أ. نورة", role: "معلمة", text: "الوطن ليس أرضًا نسكنها فقط، بل أمانة نحملها في عقولنا وسلوكنا. شكرًا لحماة الحدود.", status: "approved" }, 3),
      s({ created: new Date(now - 20 * h).toISOString(), name: "أبو سارة", role: "ولي أمر", grade: "الثاني", text: "اللهم احفظ بلادنا وقيادتنا وجنودنا، وأدم علينا نعمة الأمن والأمان.", status: "approved" }, 4),
      s({ created: new Date(now - 10 * h).toISOString(), name: "جود", role: "طالبة", grade: "الخامس", text: "سأكون قدوة في احترام الأنظمة والمحافظة على ممتلكات وطني.", status: "approved" }, 5),
      s({ created: new Date(now - 6 * h).toISOString(), name: "ولي أمر", role: "ولي أمر", text: "قبيلتنا أفضل من غيرها وهي أولى بالمناصب.", status: "pending" }, 6),
      s({ created: new Date(now - 4 * h).toISOString(), name: "هيا", role: "طالبة", grade: "الثالث", text: "أحب وطني، وأشكر كل جندي يسهر لنحيا بأمان.", status: "pending" }, 7),
      s({ created: new Date(now - 2 * h).toISOString(), name: "زائر", role: "زائر", text: "تابعوا حسابي للمزيد www.example.com", status: "rejected" }, 8),
    ];
  }
  function dload() {
    try {
      const v = JSON.parse(localStorage.getItem(LS));
      if (Array.isArray(v)) return v;
    } catch (e) {}
    const v = seed();
    dsave(v);
    return v;
  }
  function dsave(v) {
    try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {}
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const DEMO_PW = "1234";

  async function demo(action, p) {
    await wait(350);
    let all = dload();
    const pub = (m) => ({ id: m.id, created: m.created, name: m.name, role: m.role, grade: m.grade, text: m.text, video_url: m.video_url });
    const needPw = () => { if (p.pw !== DEMO_PW) throw new Error("كلمة السر غير صحيحة"); };
    switch (action) {
      case "public": {
        const ok = all.filter((m) => m.status === "approved").sort((a, b) => b.created.localeCompare(a.created));
        return { ok: true, items: ok.map(pub), stats: { approved: ok.length, videos: ok.filter((m) => m.video_url).length } };
      }
      case "submit": {
        const m = { id: "d" + Date.now(), created: new Date().toISOString(), name: p.name || "", role: p.role || "", grade: p.grade || "", text: p.text || "", video_id: "", video_url: p.video_preview || "", status: "pending", source: "زائر", updated: "" };
        all.push(m); dsave(all);
        return { ok: true, id: m.id };
      }
      case "admin_login": needPw(); return { ok: true };
      case "admin_list": needPw(); return { ok: true, items: all };
      case "admin_add": {
        needPw();
        const m = Object.assign({ id: "d" + Date.now(), created: new Date().toISOString(), video_id: "", video_url: "", source: "المديرة", updated: "" }, p.item);
        all.push(m); dsave(all); return { ok: true, item: m };
      }
      case "admin_update": {
        needPw();
        all = all.map((m) => (p.ids.includes(m.id) ? Object.assign({}, m, p.patch, { updated: new Date().toISOString() }) : m));
        dsave(all); return { ok: true };
      }
      case "admin_delete": {
        needPw();
        all = all.filter((m) => !p.ids.includes(m.id)); dsave(all); return { ok: true };
      }
    }
    throw new Error("طلب غير معروف");
  }

  // ---------- الاتصال الحقيقي ----------
  function post(action, payload, onProgress) {
    if (DEMO) return demo(action, payload || {});
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", API);
      xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
      xhr.timeout = 180000;
      if (onProgress && xhr.upload) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        let j;
        try { j = JSON.parse(xhr.responseText); } catch (e) { return reject(new Error("تعذّر قراءة الرد من الخادم")); }
        if (!j.ok) return reject(new Error(j.error || "حدث خطأ"));
        resolve(j);
      };
      xhr.onerror = () => reject(new Error("تعذّر الاتصال، تأكّدي من الإنترنت وحاولي مرة أخرى"));
      xhr.ontimeout = () => reject(new Error("انتهت مهلة الإرسال، جرّبي مقطعًا أقصر"));
      xhr.send(JSON.stringify(Object.assign({ action }, payload || {})));
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(new Error("تعذّر قراءة الملف"));
      r.readAsDataURL(file);
    });
  }

  // ---------- التنبيه التلقائي على المحتوى الحساس ----------
  // لا يرفض شيئًا بنفسه؛ فقط يلفت نظر المديرة.
  const LEX = [
    { cat: "قبلية أو عنصرية", words: ["قبيلة", "قبيلتي", "قبيلتنا", "قبيلتهم", "قبائل", "القبيلة", "القبائل", "قبلي", "القبلية", "خضيري", "خضيرية", "طرش", "عنصري", "عنصرية", "نعرة", "نعرات", "أصلي وفصلي", "ابن قبيلة", "بنت قبيلة", "حضري", "بدوي", "مو أصيل", "غير أصيل", "دخيل", "أجانب"] },
    { cat: "طائفية أو تكفير", words: ["رافضي", "روافض", "رافضة", "نواصب", "ناصبي", "مجوس", "صفوي", "صفويين", "كافر", "كفار", "الكفار", "تكفير", "مرتد", "زنديق"] },
    { cat: "إساءة أو ألفاظ", words: ["خائن", "خونة", "يلعن", "لعنة", "ملعون", "حقير", "حقيرة", "تافه", "كلب", "كلاب", "حمار", "غبي", "زبالة", "وسخ", "يسقط", "الموت ل", "اقتلوا", "ذبح"] },
    { cat: "جماعات أو تحريض", words: ["داعش", "القاعدة", "الإخوان", "اخوان", "حوثي", "الحوثي", "حزب الله", "خلافة", "جهاد", "مظاهرة", "مظاهرات", "ثورة", "اعتصام"] },
  ];
  const AR_NORM = (s) => String(s || "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي");
  const LEX_N = LEX.map((g) => ({ cat: g.cat, words: g.words.map(AR_NORM) }));
  const LINK_RE = /(https?:\/\/|www\.|\.com\b|\.net\b|\.sa\b|t\.me|wa\.me|snapchat|instagram|tiktok|@[a-z0-9_]{3,})/i;
  const PHONE_RE = /(\d[\d\s-]{7,}\d)/;

  function flags(text) {
    const raw = String(text || "");
    const n = " " + AR_NORM(raw).replace(/[.,،؛:!؟?"'«»()\[\]\n\r]/g, " ") + " ";
    const found = [];
    LEX_N.forEach((g) => {
      g.words.forEach((w) => {
        // يطابق الكلمة مع «ال» أو حروف الجر والعطف في أولها
        const re = new RegExp("[\\s](?:و|ف|ب|ل|ك)?(?:ال)?" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:ه|ها|هم|ي|نا|ين|ون|ات)?(?=[\\s])");
        if (re.test(n)) found.push({ cat: g.cat, word: w });
      });
    });
    if (LINK_RE.test(raw)) found.push({ cat: "روابط أو حسابات", word: "رابط" });
    if (PHONE_RE.test(raw)) found.push({ cat: "أرقام تواصل", word: "رقم" });
    return found;
  }
  function flagCats(text) {
    return [...new Set(flags(text).map((f) => f.cat))];
  }
  // يُرجع HTML آمنًا مع تظليل الكلمات المنبّه عليها
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function highlight(text) {
    const f = flags(text);
    if (!f.length) return esc(text);
    const words = f.filter((x) => x.word !== "رابط" && x.word !== "رقم").map((x) => x.word);
    // نطابق على النص الأصلي بعد تطبيع مكافئ حرفًا بحرف
    const raw = String(text);
    const norm = AR_NORM(raw);
    if (norm.length !== raw.length) return esc(text);
    const marks = new Array(raw.length).fill(false);
    words.forEach((w) => {
      let i = norm.indexOf(w);
      while (i !== -1) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = norm.indexOf(w, i + 1); }
    });
    let out = "", open = false;
    for (let i = 0; i < raw.length; i++) {
      if (marks[i] && !open) { out += '<mark class="flag">'; open = true; }
      if (!marks[i] && open) { out += "</mark>"; open = false; }
      out += esc(raw[i]);
    }
    if (open) out += "</mark>";
    return out.replace(/(https?:\/\/\S+|www\.\S+)/gi, '<mark class="flag">$1</mark>');
  }

  function fmtDate(iso, withTime) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const opt = { year: "numeric", month: "long", day: "numeric" };
    if (withTime) Object.assign(opt, { hour: "numeric", minute: "2-digit" });
    try { return d.toLocaleDateString("ar-SA-u-nu-latn", opt); } catch (e) { return d.toLocaleDateString(); }
  }

  window.DIFAA = { DEMO, ROLES, GRADES, STATUS, CFG, post, fileToBase64, flags, flagCats, highlight, esc, fmtDate };
})();
