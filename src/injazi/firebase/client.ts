/*
  عميل Firebase للقسم.
  يعيد استخدام نفس تطبيق Firebase المهيّأ في src/lib/firebase.ts (لا يمكن
  تهيئة التطبيق مرتين) ويضيف Storage فقط، بنفس حماية "الكائن البديل"
  حتى لا يسقط الموقع كله عند غياب إعدادات .env.
*/
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import { app, auth, db, isFirebaseUsable } from "@/lib/firebase";

let storageInstance: FirebaseStorage;
let storageError: unknown = null;

try {
  if (!isFirebaseUsable) throw new Error("Firebase غير مهيّأ");
  storageInstance = getStorage(app);
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
  }
} catch (err) {
  storageError = err;
  storageInstance = new Proxy({} as FirebaseStorage, {
    get() {
      throw err instanceof Error ? err : new Error(String(err));
    },
  });
}

export const storage = storageInstance;
export const isStorageUsable = !storageError;
export { app, auth, db, isFirebaseUsable };
