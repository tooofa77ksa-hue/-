/**
 * اختبارات قواعد الأمان الفعلية لـ Firestore.
 *
 * تُشغَّل على محاكي Firestore الحقيقي، فالنتيجة هنا هي سلوك القواعد
 * نفسه لا محاكاة له:
 *     npm run test:rules
 *
 * كل ممنوع في المتطلبات له اختبار يثبت أنه ممنوع فعلًا في طبقة
 * البيانات، لا بإخفاء زر في الواجهة.
 */
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc,
} from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8181').split(':')

const env = await initializeTestEnvironment({
  projectId: 'demo-qiyas-rules',
  firestore: {
    host,
    port: Number(port),
    rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8'),
  },
})

// الإدارة تُعرَّف بمعرّفها في القواعد، لا بادّعاء مخصّص
const ADMIN_UID = 'ADMIN_UID_PLACEHOLDER'
const admin = env.authenticatedContext(ADMIN_UID).firestore()
const claimAdmin = env.authenticatedContext('legacy-claim-uid', { admin: true }).firestore()
const signedIn = env.authenticatedContext('anon-uid').firestore()
const guest = env.unauthenticatedContext().firestore()

/** استجابة سليمة من القياس العام: تكتب الاسم ولا تربط نفسها بطالبة. */
function publicResponse(overrides = {}) {
  return {
    cycleId: 'cycle-1448',
    rawName: 'اسم اختباري للقياس',
    declaredGradeId: 'grade-4',
    classId: null,
    matchStatus: 'NEW',
    studentId: null,
    candidateStudentIds: [],
    duplicateFlag: false,
    source: 'web',
    submittedAt: '2026-09-21T10:00:00.000Z',
    reviewedAt: null,
    reviewedBy: null,
    answers: [{ questionId: 'q1', optionId: 'opt-3', rawValue: 'أوافق تمامًا', score: 3 }],
    ...overrides,
  }
}

// ───────── تجهيز بيانات موجودة مسبقًا، بتجاوز القواعد ─────────
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'cycles/cycle-1448'), { name: 'قياس ١٤٤٨', status: 'open' })
  await setDoc(doc(db, 'cycles/cycle-1447'), { name: 'قياس ١٤٤٧', status: 'closed' })
  await setDoc(doc(db, 'grades/grade-4'), { no: 4, name: 'الرابع' })
  await setDoc(doc(db, 'classes/class-4-1'), { gradeId: 'grade-4', name: '٤/١' })
  await setDoc(doc(db, 'questions/q1'), { order: 1, text: 'سؤال', active: true })
  await setDoc(doc(db, 'students/student-1'), { name: 'طالبة', gradeId: 'grade-4', status: 'active' })
  await setDoc(doc(db, 'responses/response-1'), publicResponse())
  await setDoc(doc(db, 'suggestions/sug-1'), { responseId: 'response-1', text: 'اقتراح' })
  await setDoc(doc(db, 'auditLogs/log-1'), { operation: 'import', actor: 'admin' })
})

// ───────────────────────── الاختبارات ─────────────────────────
const cases = []
const test = (name, fn) => cases.push({ name, fn })

// ١) أسماء الطالبات: بيانات قاصرات
test('الإدارة تُعرَّف بمعرّفها فتقرأ الطالبات', () =>
  assertSucceeds(getDocs(collection(admin, 'students'))))

test('حساب مصادَق بمعرّف آخر لا يُعدّ إدارة', () =>
  assertFails(getDocs(collection(env.authenticatedContext('some-other-uid').firestore(), 'students'))))

test('الادّعاء المخصّص ما زال مقبولًا للتوافق', () =>
  assertSucceeds(getDocs(collection(claimAdmin, 'students'))))

test('الزائر غير المصادَق لا يقرأ أي طالبة', () =>
  assertFails(getDoc(doc(guest, 'students/student-1'))))

test('المستخدم المصادَق (غير إداري) لا يقرأ طالبة واحدة', () =>
  assertFails(getDoc(doc(signedIn, 'students/student-1'))))

test('المستخدم المصادَق (غير إداري) لا يسرد قائمة الطالبات', () =>
  assertFails(getDocs(collection(signedIn, 'students'))))

test('الإدارة تقرأ قائمة الطالبات', () =>
  assertSucceeds(getDocs(collection(admin, 'students'))))

test('غير الإداري لا يضيف طالبة', () =>
  assertFails(setDoc(doc(signedIn, 'students/hacked'), { name: 'x', status: 'active' })))

test('الإدارة تضيف طالبة', () =>
  assertSucceeds(setDoc(doc(admin, 'students/student-2'), { name: 'ط', gradeId: 'grade-4', status: 'active' })))

test('حتى الإدارة لا تحذف طالبة نهائيًا — الأرشفة فقط', () =>
  assertFails(deleteDoc(doc(admin, 'students/student-1'))))

test('الإدارة تؤرشف الطالبة بتعديل الحالة', () =>
  assertSucceeds(updateDoc(doc(admin, 'students/student-1'), { status: 'archived' })))

// ٢) الاستجابات: تُكتب ولا تُقرأ ولا تُحذف
test('غير الإداري لا يقرأ استجابة', () =>
  assertFails(getDoc(doc(signedIn, 'responses/response-1'))))

test('غير الإداري لا يسرد الاستجابات', () =>
  assertFails(getDocs(collection(signedIn, 'responses'))))

test('الإدارة تقرأ الاستجابات', () =>
  assertSucceeds(getDocs(collection(admin, 'responses'))))

test('القياس العام يرسل استجابته في دورة مفتوحة', () =>
  assertSucceeds(addDoc(collection(signedIn, 'responses'), publicResponse())))

test('الزائر غير المصادَق لا يرسل استجابة', () =>
  assertFails(addDoc(collection(guest, 'responses'), publicResponse())))

test('استجابة في دورة مغلقة تُرفض', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ cycleId: 'cycle-1447' }))))

test('استجابة لدورة غير موجودة تُرفض', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ cycleId: 'cycle-9999' }))))

test('القياس العام لا يربط استجابته بطالبة بعينها', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ studentId: 'student-1' }))))

test('القياس العام لا يدّعي مطابقة مؤكّدة', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ matchStatus: 'MATCHED' }))))

test('القياس العام لا يضع علامة «تمت المراجعة» على نفسه', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ reviewedAt: '2026-09-21', reviewedBy: 'admin' }))))

test('استجابة بلا اسم تُرفض', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ rawName: '' }))))

test('استجابة بلا إجابات تُرفض', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ answers: [] }))))

test('استجابة بحقل دخيل تُرفض', () =>
  assertFails(addDoc(collection(signedIn, 'responses'), publicResponse({ isAdmin: true }))))

test('غير الإداري لا يعدّل استجابة قائمة', () =>
  assertFails(updateDoc(doc(signedIn, 'responses/response-1'), { rawName: 'تلاعب' })))

test('حتى الإدارة لا تغيّر نص الإجابات', () =>
  assertFails(updateDoc(doc(admin, 'responses/response-1'), { answers: [] })))

test('حتى الإدارة لا تغيّر الاسم المُرسَل أصلًا', () =>
  assertFails(updateDoc(doc(admin, 'responses/response-1'), { rawName: 'اسم آخر' })))

test('الإدارة تؤكّد المطابقة دون المساس بالإجابات', () =>
  assertSucceeds(updateDoc(doc(admin, 'responses/response-1'), { studentId: 'student-1', matchStatus: 'MATCHED' })))

test('لا تُحذف استجابة إطلاقًا — ولا من الإدارة', () =>
  assertFails(deleteDoc(doc(admin, 'responses/response-1'))))

// ٣) البيانات الإدارية البحتة
test('غير الإداري لا يقرأ الاقتراحات', () =>
  assertFails(getDocs(collection(signedIn, 'suggestions'))))

test('لا تُحذف الاقتراحات', () =>
  assertFails(deleteDoc(doc(admin, 'suggestions/sug-1'))))

test('غير الإداري لا يقرأ خطة التحسين', () =>
  assertFails(getDocs(collection(signedIn, 'improvementActions'))))

test('غير الإداري لا يقرأ إقرارات المراجعة', () =>
  assertFails(getDocs(collection(signedIn, 'reviewAcks'))))

test('سجل العمليات لا يُعدَّل ولا يُحذف حتى من الإدارة', async () => {
  await assertFails(updateDoc(doc(admin, 'auditLogs/log-1'), { actor: 'آخر' }))
  await assertFails(deleteDoc(doc(admin, 'auditLogs/log-1')))
})

test('غير الإداري لا يقرأ سجل العمليات', () =>
  assertFails(getDoc(doc(signedIn, 'auditLogs/log-1'))))

// ٤) المرجعيات غير الشخصية متاحة للقياس بعد المصادقة فقط
test('القياس العام يقرأ الأسئلة والصفوف والفصول', async () => {
  await assertSucceeds(getDocs(collection(signedIn, 'questions')))
  await assertSucceeds(getDocs(collection(signedIn, 'grades')))
  await assertSucceeds(getDocs(collection(signedIn, 'classes')))
})

test('الزائر غير المصادَق لا يقرأ حتى الأسئلة', () =>
  assertFails(getDocs(collection(guest, 'questions'))))

test('غير الإداري لا يعدّل الأسئلة', () =>
  assertFails(setDoc(doc(signedIn, 'questions/q1'), { text: 'سؤال مزوّر' })))

// ٥) المجموعات غير المعرَّفة مرفوضة افتراضيًا
test('أي مجموعة غير معرَّفة مرفوضة حتى على الإدارة', async () => {
  await assertFails(getDoc(doc(admin, 'secrets/anything')))
  await assertFails(setDoc(doc(admin, 'secrets/anything'), { a: 1 }))
})

// ───────────────────────── التشغيل ─────────────────────────
let passed = 0
const failures = []
for (const { name, fn } of cases) {
  try {
    await fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failures.push({ name, error })
    console.log(`  ✗ ${name}`)
  }
}

await env.cleanup()

console.log(`\nقواعد Firestore: ${passed}/${cases.length} اختبارًا ناجحًا`)
if (failures.length > 0) {
  for (const { name, error } of failures) console.error(`\n✗ ${name}\n  ${error?.message ?? error}`)
  process.exit(1)
}
