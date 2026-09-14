import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, type User } from "firebase/auth";
import { auth, isFirebaseUsable } from "@/lib/firebase";
import { usernameToInternalEmail } from "@/lib/usernameAuth";
import { getAppUser } from "@/lib/repo";
import type { AppUser } from "@/types/models";

interface AuthState {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "auth/invalid-email": "اسم المستخدم غير صحيح.",
  "auth/too-many-requests": "محاولات كثيرة، حاولي بعد قليل.",
  "auth/user-disabled": "هذا الحساب معطّل.",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseUsable) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          setAppUser(await getAppUser(user.uid));
        } catch {
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (username: string, password: string) => {
    setError(null);
    if (!isFirebaseUsable) {
      setError("لم يتم إعداد Firebase بعد على هذا الموقع.");
      throw new Error("Firebase not configured");
    }
    try {
      await signInWithEmailAndPassword(auth, usernameToInternalEmail(username), password);
    } catch (err: any) {
      setError(ERROR_MESSAGES[err?.code] || "تعذّر تسجيل الدخول. تأكدي من اسم المستخدم وكلمة السر.");
      throw err;
    }
  };

  const signOut = async () => {
    if (!isFirebaseUsable) return;
    await fbSignOut(auth);
  };

  return (
    <AuthCtx.Provider value={{ firebaseUser, appUser, loading, error, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
