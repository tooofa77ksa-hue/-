/**
 * منح صلاحية الإدارة لحساب.
 *
 * الصلاحية ادّعاء admin=true يوقّعه Firebase على رمز دخول الحساب،
 * وقواعد firestore.rules هي التي تفحصه. لا تُمنح من الواجهة ولا من
 * المتصفّح — من هنا وحده، بمفتاح خدمة على جهاز المدرسة.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     node scripts/firestore/grant-admin.mjs --project <المشروع> --email <البريد>
 *
 *   # للسحب
 *   … --email <البريد> --revoke
 *
 * على المحاكي: FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9199
 */
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const projectId = option('project') ?? process.env.GCLOUD_PROJECT
const email = option('email')
const revoke = args.includes('--revoke')
const password = option('password')

if (!projectId || !email) {
  console.error('الاستعمال: node scripts/firestore/grant-admin.mjs --project <المشروع> --email <البريد>')
  process.exit(1)
}

const { cert, initializeApp } = await import('firebase-admin/app')
const { getAuth } = await import('firebase-admin/auth')

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
initializeApp({
  projectId,
  ...(keyFile && !process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? { credential: cert(JSON.parse(readFileSync(keyFile, 'utf8'))) }
    : {}),
})
const auth = getAuth()

let user
try {
  user = await auth.getUserByEmail(email)
} catch {
  if (!password) {
    console.error(`✗ لا يوجد حساب بالبريد ${email}.`)
    console.error('  أنشئيه من لوحة Firebase، أو أضيفي --password <كلمة المرور> لإنشائه الآن.')
    process.exit(1)
  }
  user = await auth.createUser({ email, password })
  console.log(`أُنشئ حساب جديد: ${user.uid}`)
}

await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true })
// إبطال الرموز القائمة كي تسري الصلاحية الجديدة فورًا لا بعد ساعة
await auth.revokeRefreshTokens(user.uid)

const after = await auth.getUser(user.uid)
const isAdmin = after.customClaims?.admin === true

console.log(`${isAdmin === !revoke ? '✓' : '✗'} ${email}: صلاحية الإدارة ${isAdmin ? 'ممنوحة' : 'مسحوبة'}`)
console.log('على الحساب تسجيل الخروج والدخول من جديد.')
process.exit(isAdmin === !revoke ? 0 : 1)
