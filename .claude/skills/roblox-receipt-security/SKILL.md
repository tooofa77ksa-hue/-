---
name: roblox-receipt-security
description: أمان معالجة المشتريات عبر MarketplaceService.ProcessReceipt — تسليم idempotent، منع المنح المزدوج، سجل الإيصالات، والتعامل مع حالات الفشل. استخدمها لأي كود يمس ProcessReceipt أو تسليم منتج مدفوع.
---

# roblox-receipt-security — أمان الإيصالات

## متى تعمل هذه المهارة
- عند كتابة أو تعديل `ProcessReceipt`.
- عند إضافة أي `Developer Product` جديد.
- عند أي بلاغ "دفعت ولم أستلم" أو "استلمت مرتين".

## الملفات التي يمكنها قراءتها
- `roblox/src/server/Purchases/**`, `roblox/src/server/Data/**`, `roblox/src/shared/Config/Catalog.luau`, سجلات الإيصالات.

## الملفات التي يمكنها تعديلها
- `roblox/src/server/Purchases/**` (وحدها).
- `roblox/docs/06-threat-model.md` (قسم المشتريات).
- **ممنوع** أن تُعرّف أي وحدة أخرى `MarketplaceService.ProcessReceipt` — معالج واحد فقط في المشروع كله.

## خطوات العمل
1. عرّف `ProcessReceipt` **مرة واحدة** في وحدة خادمية واحدة، وسجّلها عند بدء الخادم.
2. المفتاح الفريد للإيصال: `PurchaseId` (وليس `ProductId` ولا اللاعب). خزّنه في ملف اللاعب: `purchaseHistory[purchaseId] = timestamp`.
3. التسلسل الإلزامي داخل `UpdateAsync` واحد وذرّي:
   - اقرأ الملف؛ إن كان `purchaseId` مسجّلًا مسبقًا ⇒ أعد `PurchaseGranted` فورًا (تسليم سابق ناجح، لا تمنح ثانيةً).
   - وإلا: طبّق أثر المنتج **و** سجّل `purchaseId` في **نفس** العملية الذرية.
4. أعد `Enum.ProductPurchaseDecision.PurchaseGranted` **فقط** بعد نجاح الكتابة المؤكد. في أي شك أو خطأ ⇒ `NotProcessedYet` (سيعيد Roblox المحاولة، والمنح idempotent فيحميك).
5. لا تعتمد أبدًا على `receiptInfo` لتحديد الكمية — الكمية من جدول `Catalog` على الخادم عبر `ProductId`.
6. `ProductId` غير معروف ⇒ سجّل تنبيهًا وأعد `NotProcessedYet` (لا تمنح شيئًا افتراضيًا).
7. اللاعب غير موجود في الخادم ⇒ `NotProcessedYet`.
8. اقطع نمو السجل: احتفظ بآخر 200 `purchaseId` مرتبة زمنيًا (وهي أكثر بكثير من نافذة إعادة محاولة Roblox).
9. سجّل كل إيصال: (userId, productId, purchaseId, currencySpent, نتيجة).

## معايير القبول
- معالج `ProcessReceipt` واحد فقط في المشروع كله.
- المنح وتسجيل `purchaseId` في عملية ذرّية واحدة — لا يمكن أن ينجح أحدهما دون الآخر.
- `PurchaseGranted` لا يُعاد إلا بعد تأكيد الحفظ.
- لا تُستخدم أي قيمة من العميل في تحديد المنتج أو الكمية أو السعر.
- كل حالة فشل تُعيد `NotProcessedYet` وليس `PurchaseGranted`.

## اختبارات التحقق
- **إعادة تسليم**: استدعِ المعالج بنفس `purchaseId` 5 مرات ⇒ المنح مرة واحدة، والنتيجة `PurchaseGranted` في كل مرة.
- **فشل الحفظ**: اجعل `UpdateAsync` يفشل ⇒ النتيجة `NotProcessedYet` ولا منح.
- **إعادة المحاولة بعد الفشل**: نفس الإيصال يُعاد لاحقًا ⇒ منح واحد فقط.
- **منتج مجهول**: `ProductId` غير موجود في `Catalog` ⇒ `NotProcessedYet` + تنبيه.
- **تعطل الخادم**: أوقف الخادم بين الخصم والمنح ⇒ اللاعب يستلم عند المحاولة التالية بلا ازدواج.
- **شراء متزامن**: إيصالان مختلفان في نفس اللحظة ⇒ كلاهما يُسلَّم مرة واحدة.

## المحظورات الأمنية
- ممنوع منح المنتج قبل تأكيد الحفظ.
- ممنوع استخدام `ProductId` وحده كمفتاح idempotency (اللاعب قد يشتري نفس المنتج مرات مشروعة).
- ممنوع إعادة `PurchaseGranted` عند أي استثناء أو مهلة.
- ممنوع تسليم منتج عبر `RemoteEvent` بناءً على إخبار العميل بأنه اشترى.
- ممنوع تسجيل أي بيانات دفع أو معرفات حساسة خارج السجل الخادمي.
- ممنوع تعويض لاعب يدويًا في الإنتاج بلا سجل مكتوب وموافقتي.

## المصادر الرسمية
- `ProcessReceipt`: https://create.roblox.com/docs/reference/engine/classes/MarketplaceService#ProcessReceipt
- Developer Products (التسليم والتحقق): https://create.roblox.com/docs/production/monetization/developer-products
- `ProductPurchaseDecision`: https://create.roblox.com/docs/reference/engine/enums/ProductPurchaseDecision
- Data Stores (للذرّية): https://create.roblox.com/docs/cloud-services/data-stores
