# دليل النشر — قياس اتجاه المتعلمين ١٤٤٨هـ

الابتدائية الخامسة والستون بعد المائة — الإدارة العامة للتعليم بمحافظة جدة

هذا الدليل يُنفَّذ **مرة واحدة** لتجهيز النظام، ثم يُعاد منه القسم ٧ وحده عند كل تحديث.
كل خطوة فيه تحتاج حسابك أنتِ: لا يملك أحد غيركِ إنشاء المشروع ولا مفاتيحه.

> **قاعدة قاطعة:** لا تُنشر نسخة قبل نجاح `npm run build:deploy`.
> هذا الأمر يرفض النشر إن وجد اسم طالبة واحدة داخل ملفات المتصفّح.

---

## ١) إنشاء مشروع Firebase مستقل

1. افتحي <https://console.firebase.google.com> ثم **Add project**.
2. الاسم المقترح: `qiyas-165-1448`. اكتبي المعرّف الذي يمنحكِ إياه Firebase — سنسميه
   هنا `<PROJECT_ID>`.
3. أوقفي Google Analytics (غير لازم ويجمع بيانات زوّار بلا داعٍ).

> **مهم:** هذا مشروع جديد تمامًا. لا تختاري مشروعًا قائمًا لتطبيق آخر: الشرط أن تكون
> قاعدة البيانات والاستضافة غير مشتركة مع أي نظام سابق.

## ٢) تفعيل الخدمات الثلاث

داخل المشروع:

| الخدمة | المسار | الإعداد |
|---|---|---|
| Firestore | Build ← Firestore Database ← Create database | **Production mode**، الموقع `eur3` أو `nam5` |
| Authentication | Build ← Authentication ← Get started | فعّلي **Email/Password** و **Anonymous** |
| Hosting | Build ← Hosting ← Get started | اتركي الإعداد الافتراضي |

- **Email/Password**: لدخول الإدارة.
- **Anonymous**: يمنح الطالبة هوية مؤقتة تكفي لإرسال إجابتها فقط — لا تسجّل دخولًا ولا
  تكتب شيئًا، ولا تستطيع بهذه الهوية قراءة اسم طالبة واحدة.

## ٣) مفاتيح الويب

Project settings ← General ← Your apps ← **Web app** (`</>`) ← سمّيه `qiyas-web`.

انسخي القيم إلى ملف `.env` في هذا المجلد (انسخيه من `.env.example`):

```
VITE_MIRSAD_FIREBASE_API_KEY=…
VITE_MIRSAD_FIREBASE_AUTH_DOMAIN=<PROJECT_ID>.firebaseapp.com
VITE_MIRSAD_FIREBASE_PROJECT_ID=<PROJECT_ID>
VITE_MIRSAD_FIREBASE_STORAGE_BUCKET=<PROJECT_ID>.appspot.com
VITE_MIRSAD_FIREBASE_MESSAGING_SENDER_ID=…
VITE_MIRSAD_FIREBASE_APP_ID=…
```

> **`.env` مستثنى من المستودع** ولا يُرفع إلى GitHub. هذه المفاتيح ليست سرًّا بطبيعتها
> (تظهر في كل تطبيق ويب)، والحماية الحقيقية هي قواعد Firestore لا إخفاؤها.

اضبطي كذلك `VITE_MIRSAD_FIREBASE_PROJECT_ID` في ملف `.firebaserc`:

```json
{ "projects": { "default": "<PROJECT_ID>" } }
```

## ٤) مفتاح الخدمة (لجهازك وحده)

Project settings ← **Service accounts** ← Generate new private key ← يُنزَّل ملف JSON.

احفظيه باسم `service-account.json` **خارج هذا المجلد** (مثلًا في مجلد المستندات).

> **هذا الملف سرّ فعلي.** من يملكه يملك قاعدة البيانات كاملة. لا يُرسل في بريد ولا
> واتساب، ولا يوضع في المستودع، ولا يُرفع إلى أي خدمة.

## ٥) منح صلاحية الإدارة

```bash
cd mirsad-dashboard
npm install

GOOGLE_APPLICATION_CREDENTIALS=~/Documents/service-account.json \
  node scripts/firestore/grant-admin.mjs \
    --project <PROJECT_ID> \
    --email <بريد الإدارة> \
    --password '<كلمة مرور قوية>'
```

ينشئ الحساب إن لم يكن موجودًا، ويمنحه الادّعاء `admin=true`. هذا الادّعاء هو ما تفحصه
قواعد Firestore — لا يُمنح من الواجهة ولا من المتصفّح.

لسحب الصلاحية لاحقًا: الأمر نفسه مع `--revoke` بدل `--password`.

## ٦) رفع القواعد ثم البيانات

**القواعد أولًا، قبل أي بيانات.** لو رُفعت البيانات قبل القواعد بقيت لحظات بلا حماية.

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project <PROJECT_ID>
```

ثم البيانات:

```bash
# عرض ما سيُكتب دون كتابة
node scripts/firestore/seed.mjs --project <PROJECT_ID> --dry-run

# الرفع الفعلي
GOOGLE_APPLICATION_CREDENTIALS=~/Documents/service-account.json \
  node scripts/firestore/seed.mjs --project <PROJECT_ID>
```

السكربت يرفض الكتابة فوق قاعدة بيانات تحمل استجابات، ويتحقق من الأعداد بعد الكتابة
ويفشل إن نقص مستند واحد.

## ٧) البناء والنشر

```bash
npm run verify:all     # فحص + أنواع + ١٦٦ اختبار وحدة + ٣٦ اختبار قواعد + بناء
npm run build:deploy   # بناء + حارس يرفض تسرّب أي اسم
npx firebase deploy --only hosting --project <PROJECT_ID>
```

الرابط: `https://<PROJECT_ID>.web.app`

| المسار | لمن |
|---|---|
| `https://<PROJECT_ID>.web.app/#/survey` | القياس — للطالبات |
| `https://<PROJECT_ID>.web.app/#/admin` | لوحة الإدارة — تطلب بريدًا وكلمة مرور |

## ٨) التحقق بعد النشر

نفّذي هذه الخطوات بنفسك قبل توزيع الرابط:

- [ ] افتحي رابط القياس في نافذة تصفّح خفي — يجب ألّا يظهر اسم طالبة واحدة.
- [ ] في النافذة نفسها اضغطي `Ctrl+U` (مصدر الصفحة) وابحثي عن اسم طالبة — يجب ألّا يوجد.
- [ ] جرّبي فتح `/#/admin` بلا دخول — يجب أن تظهر شاشة الدخول لا البيانات.
- [ ] أرسلي استجابة تجريبية باسم «اختبار» — يجب أن تصل وتظهر في «مراجعة المطابقة».
- [ ] ادخلي بحساب الإدارة — يجب أن تظهر الأعداد: ٢٩٤ طالبة و٢٧٤ استجابة.
- [ ] نزّلي نسخة احتياطية من «الإعدادات» واحفظيها خارج الجهاز.

## ٩) النسخ الاحتياطي

- **من النظام:** الإعدادات ← تنزيل نسخة احتياطية. ملف واحد يحمل كل شيء وبصمة محتوى
  تُفحص عند الاستعادة. احفظيه أسبوعيًا خلال فترة القياس.
- **من Firebase:** Firestore ← Import/Export ← تصدير مجدول (يحتاج تفعيل الفوترة).

## ١٠) ماذا يمنع ماذا

| الخطر | ما يمنعه |
|---|---|
| زائر يقرأ أسماء الطالبات | القواعد: `students` للإدارة وحدها + استبعاد البيانات من ملفات المتصفّح عند البناء |
| زائر يقرأ استجابات غيره | القواعد: `responses` تُكتب ولا تُقرأ إلا بصلاحية إدارة |
| استجابة تنسب نفسها لطالبة | القواعد ترفض استجابة تحمل `studentId` أو تدّعي `MATCHED` |
| استجابة بعد إغلاق القياس | القواعد تتحقق أن الدورة `status == 'open'` |
| حذف طالبة أو استجابة | القواعد: `allow delete: if false` — حتى للإدارة |
| تغيير إجابة وصلت | القواعد ترفض أي تعديل يمسّ `answers` أو `rawName` |
| نشر نسخة كاشفة | `npm run build:deploy` يفشل قبل النشر |
| ضياع البيانات بمسح المتصفّح | البيانات في قاعدة بيانات لا في المتصفّح |

## ١١) تجربة كل هذا بلا مفاتيح

لتجربة القواعد والرفع على جهازك قبل أي إعداد حقيقي:

```bash
npm run test:rules   # ٣٦ اختبارًا على محاكي Firestore

npx firebase emulators:exec --only firestore --project demo-qiyas \
  "FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 node scripts/firestore/seed.mjs --project demo-qiyas"
```

لا يحتاج أي منهما حسابًا ولا مفتاحًا ولا اتصالًا بمشروع حقيقي.
