---
name: roblox-luau-architect
description: معمارية كود Luau للعبة Roblox — فصل Server/Client/Shared، Luau strict، أنماط الوحدات، حدود الـ Remotes، ومراجعة أي كود جديد معماريًا. استخدمها قبل إنشاء أي ModuleScript أو Service أو تعديل بنية المجلدات.
---

# roblox-luau-architect — مهندس معمارية Luau

## متى تعمل هذه المهارة
- عند إنشاء أي `ModuleScript` أو `Script` أو `LocalScript` جديد.
- عند إضافة `RemoteEvent` / `RemoteFunction` جديد.
- عند نقل منطق بين الخادم والعميل، أو عند ظهور تكرار في الكود.
- عند مراجعة Pull Request يمس بنية `src/`.

## الملفات التي يمكنها قراءتها
- `roblox/src/**`, `roblox/default.project.json`, `roblox/wally.toml`, `roblox/CLAUDE.md`, `roblox/docs/04-architecture-rojo.md`.

## الملفات التي يمكنها تعديلها
- `roblox/src/server/**`, `roblox/src/client/**`, `roblox/src/shared/**`
- `roblox/docs/04-architecture-rojo.md`
- **ممنوع** تعديل ملفات النشر أو أسرار CI أو `.github/workflows/**` من هذه المهارة.

## خطوات العمل
1. تأكد أن كل ملف يبدأ بـ `--!strict` (بلا استثناء).
2. ضع المنطق في `ModuleScript` داخل `shared/` إن كان نقيًا (بلا Services)، وإلا فاختر `server/` أو `client/`.
3. قاعدة الاتجاه: **الخادم يملك الحقيقة**؛ العميل يرسل *نية* فقط (`RequestJump`) لا *نتيجة* (`GiveMeCoins`).
4. كل Remote يمر عبر طبقة واحدة موحّدة: `shared/Net` (تعريف الأسماء + أنواع الحمولة) ثم `server/Net/Guards` (تحقق + Rate limit).
5. عرّف أنواعًا (`export type`) لكل حمولة Remote وكل بنية بيانات محفوظة.
6. ممنوع الحالة العامة (`_G`, `shared`)؛ استخدم حقن التبعيات عبر معاملات الوحدة.
7. كل وحدة تُصدّر جدولًا واحدًا وتُنهي بـ `return`, ولا تنفذ أثرًا جانبيًا وقت الاستيراد (لا `while true do` في جذر الوحدة).
8. دورة الحياة: `Init()` ثم `Start()` — لا وصول لوحدة أخرى داخل `Init`.

## معايير القبول
- `selene` و `stylua --check` يمران بلا أخطاء.
- لا تحذيرات نوع في Luau strict (`--!strict` في كل ملف).
- لا يوجد `RemoteEvent` يُنشأ أو يُستمع إليه خارج طبقة `Net`.
- لا عملة/جائزة/مخزون يُحسب على العميل.
- لا وحدة تتجاوز ~300 سطر بلا سبب موثّق.
- لا استيراد دائري بين الوحدات.

## اختبارات التحقق
- بحث نصي: `grep -rn "while true do" src/*/init` يجب ألا يظهر في جذور الوحدات.
- بحث نصي: `grep -rln "^--!strict" src` يساوي عدد ملفات `.luau`.
- مراجعة: لكل Remote جديد اسأل «ماذا يحدث لو أرسل مهاجم هذه الحمولة 1000 مرة/ثانية بقيم قصوى؟» والإجابة مكتوبة في تعليق فوق الحارس.
- اختبار وحدة لكل وحدة منطق نقي في `shared/`.

## المحظورات الأمنية
- ممنوع `loadstring` أو `require` برقم Asset ID من الإنترنت.
- ممنوع `HttpService` إلى نطاقات غير موثّقة ومعتمدة مني كتابةً.
- ممنوع وضع أي مفتاح/توكن/كوكي في الكود أو في `Configuration` داخل اللعبة.
- ممنوع الثقة بأي قيمة قادمة من العميل بلا تحقق من النوع والمدى والسياق والمعدل.

## المصادر الرسمية
- Luau: https://create.roblox.com/docs/luau
- أنواع Luau (strict): https://create.roblox.com/docs/luau/type-checking
- Client/Server runtime: https://create.roblox.com/docs/projects/client-server
- RemoteEvents وRemoteFunctions: https://create.roblox.com/docs/scripting/events/remote
