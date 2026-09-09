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

## البدء السريع

```bash
npm install
cp .env.example .env   # ثم عبّئي بيانات مشروع Firebase الخاص بك
npm run dev
```

### إعداد Firebase

1. أنشئي مشروع Firebase جديد، وفعّلي: Authentication (Email/Password)، Cloud Firestore، Hosting.
2. عبّئي `.env` بقيم SDK من Firebase Console.
3. عبّئي `.firebaserc` بمعرّف مشروعك الحقيقي بدل `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`.
4. انشري القواعد والفهارس:
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
5. نزّلي مفتاح حساب خدمة (Service Account) من Project Settings > Service Accounts واحفظيه باسم `serviceAccountKey.json` في جذر المشروع (مُستبعد من git).
6. أنشئي حساب المعلمة الأول (لا يوجد تسجيل عام):
   ```bash
   npm run create-teacher -- --email=teacher@example.com --password=Str0ngPass! --name="اسم المعلمة" --role=teacher
   ```
7. أدخلي البيانات الأولية:
   ```bash
   npm run seed
   ```
8. ابني وانشري:
   ```bash
   npm run build
   npx firebase-tools deploy --only hosting
   ```

## الأوامر

| أمر | الوصف |
|---|---|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء الإنتاج (typecheck + vite build) |
| `npm run lint` | فحص ESLint |
| `npm run typecheck` | فحص TypeScript فقط |
| `npm run seed` | إدخال بيانات أولية إلى Firestore |
| `npm run create-teacher` | إنشاء/تحديث حساب معلمة أو إدارة |

## بنية قاعدة البيانات (Firestore)

`users`, `questionSets`, `questions`, `skills`, `gameSettings`, `audioSettings` - التفاصيل في `src/types/models.ts`. القواعد الأمنية في `firestore.rules`: لا كتابة عامة إطلاقًا، الطالبات يقرأن فقط الأسئلة المنشورة والمفعّلة، لا تُجمع أي بيانات شخصية عن الطالبات.

## إضافة نمط لعبة جديد

الألعاب Modular: أنشئي فئة ترث `BaseGameScene` (في `src/game/modes/`) وتنفّذ نفس عقد أحداث `gameBus`، ثم سجّليها في `src/game/modes/registry.ts` مع تسمية عربية وقيمة جديدة في نوع `GameMode` بـ `src/types/models.ts`. لا حاجة لتغيير Firestore أو Security Rules أو لوحة المعلمة.

## الصوت البشري

راجعي `public/audio/voice/README.md` لأسماء ملفات الصوت الثمانية المطلوبة. الكود يعمل بدونها (يكتفي بالمؤثر الصوتي المولَّف)، ويلتقطها تلقائيًا فور إضافتها بدون أي تعديل على الكود.

## الأمان

- Firestore Security Rules حقيقية (`firestore.rules`) - انظر التعليقات بداخلها.
- لا Secrets في الواجهة الأمامية - فقط مفاتيح Firebase العامة عبر `.env` (آمنة للعميل، الحماية الفعلية بالـSecurity Rules).
- `dependabot.yml` لتحديثات الاعتماديات، `codeql.yml` لفحص CodeQL (JavaScript/TypeScript)، و`ci.yml` يشغّل `npm audit`.
- لا تُجمع أي بيانات شخصية عن الطالبات (لا حساب، لا اسم، لا هوية).

## الفوتر

نص الفوتر ثابت حسب المتطلبات في `src/components/BrandFooter.tsx` ولا يجوز إضافة أي نص بعد سطر "تصميم المعلمة".
