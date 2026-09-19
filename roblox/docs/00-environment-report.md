# 00 — تقرير فحص البيئة

**التاريخ:** 2026-09-19 · **الفرع:** `claude/roblox-pro-strategy-security-p993l6` · **المسار:** `/home/user/-`

> الفحص كان للقراءة فقط. **لم يُعدّل أو يُحذف أي ملف قائم.** كل ما أُضيف ملفات جديدة في `roblox/` و`.claude/skills/roblox-*`.

## 1) ما هو موجود في المستودع

المستودع الحالي **ليس مشروع Roblox**. هو تطبيق ويب:

| العنصر | القيمة |
|---|---|
| الاسم | `shualat-lughati` — شُعلة لغتي (منصة تعليمية عربية) |
| التقنية | React 18 + TypeScript + Vite 8 + Firebase + Phaser 3 |
| البنية | `src/{app,components,game,lib,play,teacher,types}`, `tests/`, `scripts/`, `public/` |
| القواعد | `firestore.rules` (12KB)، `firebase.json`، ESLint، Vitest |
| المهارات القائمة | `.claude/skills/` (2)، `.agents/skills/` (~50 مهارة تسويق) |
| CLAUDE.md في الجذر | **غير موجود** |

**القرار المعماري:** لأن الجذر يخص مشروعًا آخر تمامًا، وُضع مشروع Roblox في مجلد معزول `roblox/` وله `roblox/CLAUDE.md` خاص به. لم يُنشأ `CLAUDE.md` في الجذر حتى لا تُفرض قواعد Luau على مشروع الويب القائم.

## 2) الأدوات — ما هو متوفر وما هو ناقص

| الأداة | الحالة | ملاحظة |
|---|---|---|
| Git | ✅ 2.43.0 | جاهز |
| Node | ✅ v22.22.2 | جاهز |
| npm | ✅ 10.9.7 | جاهز |
| Python | ✅ 3.11.15 | مساعد |
| curl | ✅ 8.5.0 | عبر بروكسي |
| **Roblox Studio** | ❌ | **لا يعمل على Linux** — يحتاج جهازك (Windows/macOS) |
| **Rojo** | ❌ | مطلوب |
| **Wally** | ❌ | مطلوب (عند الحاجة لحزم) |
| **StyLua** | ❌ | مطلوب |
| **Selene** | ❌ | مطلوب |
| **Aftman / Rokit** | ❌ | مطلوب (مدير الأدوات) |
| Lune / Luau CLI | ❌ | اختياري |

**البيئة:** Linux x86_64 (حاوية سحابية مؤقتة)، قرص متاح ~30GB، شبكة خارجية عبر بروكسي.

## 3) الحد الأدنى المقترح من الأدوات

### أ) على **جهازك** (الأساسي — Windows أو macOS)

| # | الأداة | لماذا | كيف |
|---|---|---|---|
| 1 | **Roblox Studio** | لا بديل — التشغيل والاختبار والنشر | من create.roblox.com الرسمي |
| 2 | **Rokit** | مدير أدوات يثبّت النسخ من مانيفست فيتطابق جهازك مع CI | github.com/rojo-rbx/rokit |
| 3 | **Rojo** (عبر Rokit) | مزامنة الملفات ↔ Studio | `rokit add rojo-rbx/rojo` |
| 4 | **Rojo Studio Plugin** | الطرف الآخر للمزامنة — **من Rojo الرسمي فقط** | من صفحة Rojo الرسمية |
| 5 | **StyLua** (عبر Rokit) | تنسيق موحّد | `rokit add JohnnyMorganz/StyLua` |
| 6 | **Selene** (عبر Rokit) | كشف أخطاء Luau قبل التشغيل | `rokit add Kampfkarren/selene` |

### ب) في هذه البيئة السحابية (Linux)

`rokit` + `rojo` + `stylua` + `selene` — للبناء والفحص والتحقق فقط (بلا Studio).

### ج) مؤجَّل حتى الحاجة

- **Wally** — لا نضيفه قبل أن نحتاج حزمة فعلًا. كل حزمة تمر بمهارة `roblox-asset-ip-checker`.
- **Lune / TestEZ runner** — عند بناء طبقة الاختبار الآلي.
- **Aftman** — بديل مقبول لـ Rokit إن فضّلته، لكن لا نستخدم الاثنين معًا.

### ❗ ما لن أفعله بلا موافقتك

- لن أثبّت أي أداة أو Plugin — الأوامر أعلاه **للعرض فقط** حتى توافق.
- لن أشغّل `curl | sh` أو أي سكربت من الإنترنت قبل قراءة محتواه وعرضه عليك.
- لن أضيف أي حزمة Wally أو Free Model قبل فحصها وعرض مصدرها وترخيصها.

## 4) ما أُنشئ في هذه الجلسة

```
roblox/
  CLAUDE.md                     ← الدستور الحاكم
  docs/00-environment-report.md … 09-roadmap.md

.claude/skills/
  roblox-product-strategist/         roblox-monetization/
  roblox-luau-architect/             roblox-receipt-security/
  roblox-studio-rojo/                roblox-ui-ux-mobile/
  roblox-gameplay-systems/           roblox-performance/
  roblox-security-auditor/           roblox-analytics-liveops/
  roblox-data-persistence/           roblox-localization-accessibility/
  roblox-testing-qa/                 roblox-content-safety/
  roblox-release-manager/            roblox-asset-ip-checker/
```

**16 مهارة**، لكل منها `SKILL.md` يحدد: متى تعمل · ملفات القراءة · ملفات التعديل · خطوات العمل · معايير القبول · اختبارات التحقق · المحظورات الأمنية · المصادر الرسمية.

**لا سطر كود Luau واحد كُتب.** لا Rojo، لا مكان، لا نشر — بانتظار اختيارك.

## 5) مخاطر بيئية يجب معرفتها الآن

1. **الحاوية مؤقتة** — ما لا يُدفع إلى Git يُفقد عند انتهاء الجلسة.
2. **لا Studio على Linux** — الاختبار الفعلي والنشر يحتاجان جهازك. هذه البيئة تكتب وتفحص الكود فقط.
3. **المستودع مشترك مع مشروع آخر** — لو أردت لاحقًا، الأنظف فصل لعبة Roblox في مستودع مستقل؛ قابل للنقل بلا ألم ما دمنا معزولين في `roblox/`.
