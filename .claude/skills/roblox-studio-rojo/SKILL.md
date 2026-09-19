---
name: roblox-studio-rojo
description: إعداد وصيانة سير العمل بين الملفات وRoblox Studio عبر Rojo وWally وRokit/Aftman وStyLua وSelene. استخدمها عند تهيئة المشروع، تعديل default.project.json، إضافة حزمة، أو حل مشاكل المزامنة مع Studio.
---

# roblox-studio-rojo — سير عمل Studio ↔ Git

## متى تعمل هذه المهارة
- عند التهيئة الأولى للمشروع.
- عند تعديل `default.project.json` أو إضافة مجلد جديد إلى الشجرة.
- عند إضافة/ترقية حزمة في `wally.toml`.
- عند فشل مزامنة Rojo أو اختلاف ما في Studio عن ما في Git.

## الملفات التي يمكنها قراءتها
- كل ملفات المشروع داخل `roblox/`.

## الملفات التي يمكنها تعديلها
- `roblox/default.project.json`, `roblox/test.project.json`
- `roblox/wally.toml`, `roblox/rokit.toml` (أو `aftman.toml`)
- `roblox/selene.toml`, `roblox/stylua.toml`, `roblox/.gitignore`
- **ممنوع** تعديل `wally.lock` يدويًا — يُولَّد بالأداة فقط.

## خطوات العمل
1. ثبّت مدير الأدوات أولًا (**Rokit** مفضّل، وAftman بديل مقبول) وثبّت النسخ في ملف المانيفست حتى تتطابق بيئتي مع بيئة CI.
2. عرّف شجرة `default.project.json` بحيث:
   - `src/server` → `ServerScriptService/Game`
   - `src/shared` → `ReplicatedStorage/Shared`
   - `src/client` → `StarterPlayer/StarterPlayerScripts/Game`
   - `src/assets` (نماذج `.rbxmx` مفحوصة) → `ServerStorage/Assets`
3. اجعل `test.project.json` مكانًا منفصلًا للاختبار لا ينشر إلى المكان العام.
4. `wally install` ثم أضف `Packages/` إلى `.gitignore` واحتفظ بـ `wally.lock` في Git.
5. شغّل `rojo serve` واربط Studio عبر Plugin رسمي من Rojo فقط.
6. قبل كل commit: `stylua .` ثم `selene src`.
7. اتجاه واحد للحقيقة: **الملفات هي المصدر**. ما يُكتب داخل Studio يدويًا يُفقد — أي تعديل في Studio يُنقل إلى الملفات قبل أي `commit`.

## معايير القبول
- `rojo build default.project.json -o build.rbxl` ينجح بلا أخطاء.
- `wally install` ينجح و`wally.lock` مثبّت في Git.
- `stylua --check .` و`selene src` يمران.
- لا يوجد `.rbxl` أو `.rbxlx` في المستودع (عدا مخرجات build المستثناة في `.gitignore`).
- كل Plugin مستخدم مذكور في `roblox/docs/04-architecture-rojo.md` مع مصدره الرسمي.

## اختبارات التحقق
- بناء نظيف من مستودع مستنسخ حديثًا: `rokit install && wally install && rojo build` ينجح.
- اختبار مزامنة: عدّل سطرًا في `shared/`، تحقق من انعكاسه في Studio خلال ثوانٍ.
- اختبار العزل: `rojo build test.project.json` ينتج مكانًا منفصلًا.

## المحظورات الأمنية
- ممنوع تثبيت أي Plugin أو أداة من مصدر غير رسمي/غير موثّق قبل عرض المصدر والصلاحيات وأخذ موافقتي.
- ممنوع تشغيل سكربت تثبيت من الإنترنت (`curl | sh`) بلا قراءة محتواه وعرضه لي أولًا.
- ممنوع إضافة حزمة Wally غير مفتوحة المصدر أو بلا مستودع عام قابل للفحص.
- ممنوع وضع أي توكن نشر (`ROBLOSECURITY`, Open Cloud API key) في ملف داخل المستودع — تُستخدم أسرار CI فقط.

## المصادر الرسمية
- Rojo (رسمي للأداة): https://rojo.space/docs
- Wally: https://wally.run
- Rokit: https://github.com/rojo-rbx/rokit — Aftman: https://github.com/LPGhatguy/aftman
- StyLua: https://github.com/JohnnyMorganz/StyLua — Selene: https://kampfkarren.github.io/selene
- استوديو وسير العمل الخارجي: https://create.roblox.com/docs/studio
