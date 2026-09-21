import type { Auth, User } from 'firebase/auth'

import { getFirebaseApp } from './config'
import { readEnv } from './env'

/**
 * هوية المستخدم أمام قاعدة البيانات.
 *
 * «الإدارة» ليست زرًّا مخفيًا في الواجهة: هي ادّعاء مخصّص admin=true
 * موقّع من Firebase على رمز الدخول، وقواعد firestore.rules هي التي
 * تفحصه. من لا يحمله لا يقرأ اسم طالبة واحدة مهما عبث بالواجهة.
 */
export type Role = 'admin' | 'respondent' | 'none'

export interface Identity {
  uid: string | null
  role: Role
  email: string | null
}

export const ANONYMOUS: Identity = { uid: null, role: 'none', email: null }

let cachedAuth: Auth | null = null

async function getAuthInstance(): Promise<Auth | null> {
  if (cachedAuth) return cachedAuth
  const app = getFirebaseApp()
  if (!app) return null
  const { getAuth } = await import('firebase/auth')
  cachedAuth = getAuth(app)
  if (readEnv('VITE_MIRSAD_USE_EMULATOR') === 'true') {
    const { connectAuthEmulator } = await import('firebase/auth')
    connectAuthEmulator(cachedAuth, 'http://127.0.0.1:9199', { disableWarnings: true })
  }
  return cachedAuth
}

async function identify(user: User | null): Promise<Identity> {
  if (!user) return ANONYMOUS
  // force=true: الصلاحية قد تُمنح بعد إنشاء الحساب، فنقرأ رمزًا محدّثًا
  const token = await user.getIdTokenResult(true)
  const isAdmin = token.claims.admin === true
  return { uid: user.uid, role: isAdmin ? 'admin' : 'respondent', email: user.email }
}

/** يراقب حالة الدخول ويبلّغ بالدور الفعلي. يُعيد دالة إلغاء المراقبة. */
export async function watchIdentity(onChange: (identity: Identity) => void): Promise<() => void> {
  const auth = await getAuthInstance()
  if (!auth) {
    onChange(ANONYMOUS)
    return () => {}
  }
  const { onAuthStateChanged } = await import('firebase/auth')
  return onAuthStateChanged(auth, (user) => {
    identify(user).then(onChange).catch(() => onChange(ANONYMOUS))
  })
}

/** دخول الإدارة ببريد وكلمة مرور. يرفض من لا يحمل صلاحية admin. */
export async function signInAdmin(email: string, password: string): Promise<Identity> {
  const auth = await getAuthInstance()
  if (!auth) throw new Error('قاعدة البيانات غير مضبوطة')
  const { signInWithEmailAndPassword, signOut } = await import('firebase/auth')
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
  const identity = await identify(credential.user)
  if (identity.role !== 'admin') {
    // حساب صحيح بلا صلاحية إدارة: نُخرجه فورًا بدل تركه بهوية جزئية
    await signOut(auth)
    throw new Error('هذا الحساب لا يملك صلاحية الإدارة')
  }
  return identity
}

export async function signOutCurrent(): Promise<void> {
  const auth = await getAuthInstance()
  if (!auth) return
  const { signOut } = await import('firebase/auth')
  await signOut(auth)
}

/**
 * هوية مجهولة للقياس العام: تكفي لكتابة استجابة، ولا تكفي لقراءة
 * اسم طالبة واحدة. الطالبة لا تُسجّل دخولًا ولا تعرف أن هذا يحدث.
 */
export async function ensureRespondent(): Promise<Identity> {
  const auth = await getAuthInstance()
  if (!auth) throw new Error('قاعدة البيانات غير مضبوطة')
  if (auth.currentUser) return identify(auth.currentUser)
  const { signInAnonymously } = await import('firebase/auth')
  const credential = await signInAnonymously(auth)
  return identify(credential.user)
}
