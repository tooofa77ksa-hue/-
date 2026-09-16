# نموذج البيانات والصلاحيات

> المصدر الفعلي للأنواع: `src/types/models.ts` · المصدر الفعلي للصلاحيات: `firestore.rules`.
> المستودع يستخدم **خلفيتين منفصلتين** لا تتشاركان أي بيانات.

---

# أولًا: Firebase / Firestore — منصة «شُعلة لغتي»

## المجموعات والصلاحيات

| المجموعة | القراءة | الكتابة |
|----------|---------|---------|
| `users` | صاحب الحساب فقط | **لا كتابة عامة إطلاقًا** (تُدار عبر Admin SDK) + استثناء bootstrap واحد |
| `skills` | عامة | المعلمة/الإدارة |
| `questionSets` | المعلمة، أو `active == true` للطالبات | المعلمة/الإدارة |
| `questions` | المعلمة، أو `published && active` | المعلمة/الإدارة + تحقق من الشكل |
| `gameSettings` | عامة | المعلمة/الإدارة |
| `audioSettings` | عامة | المعلمة/الإدارة |
| `students` | المعلمة/الإدارة حصرًا | المعلمة/الإدارة حصرًا |
| `groups` | المعلمة/الإدارة حصرًا | المعلمة/الإدارة حصرًا |
| `testSessions` | `get` عامة (رابط الاختبار) · `list` للمعلمة فقط | المعلمة/الإدارة |
| `attempts` | المعلمة فقط | `create` عامة بتحقق صارم · `update`/`delete` للمعلمة |
| أي مسار آخر | مرفوض | مرفوض |

`isStaff()` = مستخدم مسجَّل + له مستند في `users` + دوره `teacher` أو `admin`.

## الكيانات الأساسية

```
QuestionSet ──< Question
                  │ skill: SkillKey (14 مهارة لغوية)
                  │ choices: [4] · correctAnswer: 0..3
                  │ gameMode: rocket_mission | squishy_treasure | magic_gate
                  │ published · active

Group ──< Student
            │
            └──> TestSession (participants + participantIds + questionIds)
                    │
                    └──> Attempt  (معرّف حتمي: "{sessionId}_{studentId}")
                           └─ answers: AttemptAnswer[]  ← لقطات كاملة
```

### قيود مفروضة في قواعد الأمان (لا في المتصفح فقط)

على `questions` — `validQuestionShape()`:
- `correctAnswer` عدد صحيح ضمن `0..3`
- `choices.size() == 4`
- يُفرض على `create` **و** `update` معًا (لا يُترك السؤال في حالة غير صالحة بعد تعديل جزئي)

على `attempts` — `validAttemptShape()`:
- معرّف المستند = `"{sessionId}_{studentId}"` حتمًا → المحاولة الثانية تصبح `update` فتُرفض تلقائيًا
- الجلسة موجودة و`active == true`، و`studentId in session.participantIds`
- `gameMode` يطابق الجلسة · `totalQuestions <= session.questionIds.size()`
- `correctCount + incorrectCount == totalQuestions` و`answers.size() == totalQuestions`
- `scorePercentage == math.round(correctCount * 100.0 / totalQuestions)` — لا يمكن تلفيق نسبة منفصلة عن العدّ
- `keys().hasOnly([...])` — لا حقول إضافية غير معروفة

### لماذا اللقطات (Snapshots)

`Attempt.answers[]` يحفظ `questionTextSnapshot` و`choicesSnapshot` و`correctAnswerSnapshot`،
و`TestSession.participants` يحفظ الأسماء وقت الإنشاء. السبب: تعديل المعلمة لسؤال أو اسم لاحقًا
يجب ألا يغيّر السجل التاريخي.

### المعرّفات

`Student` و`Group` و`Question` تُربط بـ `id` ثابت، والاسم المعروض لقطة منفصلة.
**لا تربط أي سجل بالاسم المعروض** — الاسم يتغيّر، المعرّف لا.

## خطر متبقٍ موثَّق

لغة قواعد Firestore لا تدعم مطابقة «قيمة Map ضمن قائمة Maps» بشكل موثوق (جُرِّب وسبّب
`Null value error` حتى في الحالة الصحيحة). لذلك تعذّر فرض تطابق `studentNameSnapshot` مع
`participants` الفعلية. الأثر الأقصى: عرض اسم خاطئ على المحاولة الواحدة المسموحة،
**لا** انتحال محاولة طالبة أخرى (`studentId` والمعرّف الحتمي يبقيان مقيَّدين).

**يحتاج تنفيذًا**: Cloud Function للتحقق من كل إجابة فردية داخل `answers` مقابل الأسئلة الحقيقية.

---

# ثانيًا: Supabase — خطة تحسين النهروان

`public/nahrawan-plan.html` تطبيق مستقل بملف واحد، لا يستخدم Firestore إطلاقًا.

- **المصادقة**: Supabase Auth بحسابات حقيقية. شاشة الدخول تطلب اسم مستخدم بسيط
  (`bader`, `ahmad`) ويُربط داخليًا ببريد `*@nahrawan-plan.local`.
- **الوضع**: `?mode=admin` للتعديل، وبدونه لوحة عرض فقط. **الوضع في الرابط لا يمنح صلاحية** —
  هو تبديل واجهة فقط، والصلاحية الفعلية من جلسة Supabase.

## الكيانات (مستنتجة من `state` في كود العميل — غير متحقَّق منها مقابل مخطط Supabase الفعلي)

| الكيان | المحتوى |
|--------|---------|
| `meta` | بيانات المدرسة ونتائج التقويم |
| `team` | فريق العمل |
| `priorities` | الأولويات |
| `actions` | الإجراءات المرتبطة بالأولويات |
| `programs` | البرامج |
| `domainAnalysis` | تحليل المجالات |
| `domainNotes` | ملاحظات المجالات |
| `planImprovements` | تحسينات الخطة |

المجالات المعتمدة (7 بعد التطبيع): التدريس · نواتج التعلم · الأنشطة المدرسية · التوجيه الطلابي ·
التطوير المهني المستمر · الإدارة المدرسية · البيئة المدرسية.
(`normDomain()` يطبّع «النشاط الطلابي» ← «الأنشطة المدرسية»، و«المبنى المدرسي» ← «البيئة المدرسية».)

الحذف يمر عبر `state.trash` (سلة استرجاع) لكل نوع، لا حذفًا نهائيًا مباشرًا.

## ⚠️ فجوة تحقق مهمة

`SUPABASE_ANON_KEY` مضمَّن في كود المتصفح. **هذا طبيعي ومقصود في Supabase** (المفتاح مُعلَن
بطبيعته)، لكنه يعني أن الحماية الفعلية تعتمد **كليًا** على سياسات Row Level Security داخل مشروع
Supabase نفسه.

**هذه السياسات لا توجد في هذا المستودع ولم تُفحص ولا يمكن فحصها من هنا.**
قبل أي اعتماد على هذه الصفحة في تشغيل فعلي، يجب التحقق مباشرة في لوحة Supabase من أن:
- RLS مفعَّلة على كل جدول (لا جدول مكشوف للمفتاح المُعلَن).
- القراءة العامة مقصورة على ما يُفترض أنه عام.
- الكتابة مقصورة على الحسابات المصرَّح لها فقط.
