# شُعلة لغتي

منصة تعليمية عربية تفاعلية لمادة لغتي - الصف الثالث الابتدائي. تطبيق Full-Stack حقيقي:
- **/play** - لعبة تفاعلية للطالبات (بدون تسجيل دخول، قراءة فقط للمحتوى المنشور).
- **/teacher** - لوحة تحكم للمعلمة/الإدارة (تسجيل دخول إلزامي) لإدارة الأسئلة ونشرها.

أي تعديل تنشره المعلمة من `/teacher` ينعكس فورًا في `/play` عبر Firestore Real-time listeners، بدون أي تعديل على الكود.

## التقنيات

- **Frontend**: React + TypeScript + Vite، تقسيم حزم (Code splitting) بحيث لا يُحمَّل Phaser في `/teacher` ولا لوحة التحكم في `/play`.
- **اللعبة**: Phaser 3 (شخصية "دَمبل" وثلاث ألعاب: مهمة الصاروخ، كنز الدامبلنغ، البوابة السحرية).
- **Backend**: Firebase (Authentication, Cloud Firestore, Security Rules, Hosting). لا Cloud Functions لعدم وجود حاجة فعلية لعمليات خادمية أو أسرار.
- **الصوت**: AudioManager مركزي - صوت بشري عبر Slots جاهزة للاستبدال + مؤثرات صوتية مولَّفة عبر WebAudio (بدون ملفات خارجية).

## هوية بصرية

الألوان والشعار في Header/Footer مأخوذة حرفيًا من **دليل الهوية البصرية - وزارة التعليم (الإصدار 3، أكتوبر 2025)** المرفق، دون أي تعديل على ألوان الشعار أو نسبه أو إضافة تأثيرات (لا Glow ولا Shadow). ملف الشعار الرسمي: `public/assets/brand/ministry-logo.webp` (مُستخرج من الدليل نفسه). راجع `src/styles/theme.css` لبقية رموز الهوية (`--brand-*`).

خط الهوية الرسمي "Helvetica Neue W23 for SKY" مرخّص ولم يُضمَّن؛ تم استخدام "Tajawal" كبديل عربي مجاني مؤقتًا.

منطقة اللعبة نفسها (`--game-*` في theme.css) كرتونية زاهية منفصلة عن الهوية الرسمية، بانسجام لوني معها.

## بيانات الأسئلة (Seed)

الأسئلة الأولية في `scripts/seed.ts` مأخوذة من كراسة **"أستعد لأنافس - لغتي - ثالث ابتدائي"** المرفقة، وتغطي 11 من أصل 14 مهارة معتمدة (الملف المرفوع كان جزئيًا: 32 صفحة). المهارات الثلاث المتبقية (الرأي، التعبير الجمالي، نهاية مختلفة للنص) لم تُضَف لعدم ورودها في الملف - أضيفيها من لوحة المعلمة عند توفر بقية الكراسة.

## البدء السريع (محاكي محلي - بلا أي مشروع Firebase حقيقي وبلا أي Secret)

هذا هو المسار الموصى به للتطوير والاختبار؛ لا يحتاج تسجيل دخول ولا حساب Firebase حقيقي إطلاقًا:

```bash
npm install
cp .env.example .env
# افتحي .env وفعّلي قسم "الإمولاتور" المذكور بأعلى الملف (انسخي الأسطر المعلَّقة كما هي)

# نافذة 1: شغّلي المحاكيات (Firestore + Auth) وابقيها تعمل
npm run emulator

# نافذة 2: أدخلي بيانات أولية وأنشئي حساب معلمة تجريبي على المحاكي
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npm run create-teacher -- --email=teacher@example.com --password=Str0ngPass1! --name="معلمة تجريبية"

# نافذة 2 أيضًا: شغّلي التطبيق (متصل بالمحاكي تلقائيًا لأن VITE_USE_FIREBASE_EMULATORS=true)
npm run dev
```

الآن `/teacher` تعمل بحساب `teacher@example.com` / `Str0ngPass1!` و`/play` تعرض الأسئلة الـ16 المزروعة - كل ذلك محليًا بلا أي اتصال بـ Firebase الحقيقي. واجهة فحص المحاكي: `http://127.0.0.1:4000`.

### اختبار قواعد الأمان تلقائيًا (Firestore Security Rules)

```bash
npm run test:rules
```

يشغّل هذا الأمر محاكيَي Firestore وAuth، ثم 18 اختبارًا آليًا (`tests/rules/firestore.rules.test.ts` عبر `@firebase/rules-unit-testing` وVitest) يغطي جميع السيناريوهات التالية على القواعد الفعلية في `firestore.rules`، ثم يطفئ المحاكيات تلقائيًا:

- مستخدم غير مسجَّل: لا يكتب، لا يقرأ سؤالًا غير منشور، يقرأ فقط `published==true && active==true`، ولا ينفّذ استعلامًا غير مقيَّد يكشف الكل.
- معلمة (`role: teacher`): تضيف/تعدّل/تحذف سؤالًا صالحًا، وتُرفض محاولاتها لحفظ سؤال بعدد اختيارات ≠ 4 أو بـ`correctAnswer` خارج 0-3 (عند الإنشاء وعند التعديل معًا).
- مستخدم مسجَّل دخول بلا صلاحية `teacher/admin`: تُرفض كل كتابة (إضافة/تعديل/حذف)، ولا يستطيع منح نفسه صلاحية عبر الكتابة على `users`.

هذه الاختبارات تعمل أيضًا في CI تلقائيًا (`.github/workflows/ci.yml`، Job باسم `rules-test`) على كل Push/PR.

### الانتقال لاحقًا إلى مشروع Firebase حقيقي

عندما يتوفر مشروع Firebase فعلي، الخطوات المطلوبة منك فقط:

1. إنشاء المشروع في Firebase Console + تسجيل الدخول (`npx firebase login`).
2. تفعيل Authentication (Email/Password) وإنشاء قاعدة Cloud Firestore من الكونسول.
3. استبدال `demo-shualat-lughati` في `.firebaserc` بمعرّف مشروعك الحقيقي (أو `npx firebase use --add`).
4. تعبئة `.env` بقيم SDK الحقيقية من Project Settings، وتعيين `VITE_USE_FIREBASE_EMULATORS=false`.
5. نشر القواعد والفهارس: `npx firebase deploy --only firestore:rules,firestore:indexes`.
6. تشغيل `npm run seed` و`npm run create-teacher` (بدون متغيرات EMULATOR_HOST هذه المرة) - يتطلبان عندها `serviceAccountKey.json` حقيقيًا من Project Settings > Service Accounts (مُستبعد من git تلقائيًا، **لا تُنشئي ملفًا وهميًا بديلًا عنه**).
7. `npm run build && npx firebase deploy --only hosting`.

لم يُنشَر أي شيء إلى Production في هذا المستودع - هذا يتطلب حسابك.

## الأوامر

| أمر | الوصف |
|---|---|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء الإنتاج (typecheck + vite build) |
| `npm run lint` | فحص ESLint |
| `npm run typecheck` | فحص TypeScript فقط |
| `npm run emulator` | تشغيل Firebase Local Emulator Suite (Firestore + Auth) |
| `npm run test:rules` | اختبارات آلية لقواعد الأمان على المحاكي (18 سيناريو) |
| `npm run seed` | إدخال بيانات أولية (يعمل على المحاكي أو مشروع حقيقي، آمن لإعادة التشغيل) |
| `npm run create-teacher` | إنشاء/تحديث حساب معلمة أو إدارة (يعمل على المحاكي أو مشروع حقيقي) |

## بنية قاعدة البيانات (Firestore)

`users`, `questionSets`, `questions`, `skills`, `gameSettings`, `audioSettings` - التفاصيل في `src/types/models.ts`. القواعد الأمنية في `firestore.rules`: لا كتابة عامة إطلاقًا، الطالبات يقرأن فقط الأسئلة المنشورة والمفعّلة، لا تُجمع أي بيانات شخصية عن الطالبات.

## إضافة نمط لعبة جديد

الألعاب Modular: أنشئي فئة ترث `BaseGameScene` (في `src/game/modes/`) وتنفّذ نفس عقد أحداث `gameBus`، ثم سجّليها في `src/game/modes/registry.ts` مع تسمية عربية وقيمة جديدة في نوع `GameMode` بـ `src/types/models.ts`. لا حاجة لتغيير Firestore أو Security Rules أو لوحة المعلمة.

## الصوت البشري

راجعي `public/audio/voice/README.md` لأسماء ملفات الصوت الثمانية المطلوبة. الكود يعمل بدونها (يكتفي بالمؤثر الصوتي المولَّف)، ويلتقطها تلقائيًا فور إضافتها بدون أي تعديل على الكود.

## الأمان

- Firestore Security Rules حقيقية (`firestore.rules`) - انظر التعليقات بداخلها.
- Rules مُختبَرة آليًا على Firebase Local Emulator Suite عبر `npm run test:rules` (18 اختبار، تعمل أيضًا في CI) - وليست ادّعاءً بلا تحقق.
- لا Secrets في الواجهة الأمامية - فقط مفاتيح Firebase العامة عبر `.env` (آمنة للعميل، الحماية الفعلية بالـSecurity Rules).
- `dependabot.yml` لتحديثات الاعتماديات، `codeql.yml` لفحص CodeQL (JavaScript/TypeScript)، و`ci.yml` يشغّل `npm audit`.
- لا تُجمع أي بيانات شخصية عن الطالبات (لا حساب، لا اسم، لا هوية).

## الفوتر

نص الفوتر ثابت حسب المتطلبات في `src/components/BrandFooter.tsx` ولا يجوز إضافة أي نص بعد سطر "تصميم المعلمة".
