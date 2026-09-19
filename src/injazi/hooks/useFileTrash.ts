/*
  حذف الملفات المؤجَّل — لا تُمحى صورة قبل أن يُحفظ المستند الذي تركها.
  ==================================================================
  كانت كل نوافذ التحرير تحذف الصورة من قاعدة البيانات فور الضغط على
  سلة المهملات، قبل الحفظ. النتيجة عطل يفقد بيانات حقيقية بلا رجعة:

    • تحذف الطالبة الصورة ثم تضغط «إلغاء» (أو يُغلق النموذج، أو يفشل
      الحفظ) ⇒ ملف الصورة ذهب، والمشروع ما زال يشير إليه. النتيجة
      صورة مكسورة دائمة لا سبيل لإصلاحها: الأصل مُحي.
    • ترفع صورة بديلة ثم تتراجع ⇒ الصورة القديمة مُحيت عند الاستبدال،
      والجديدة لم تُحفظ. فلا قديمة ولا جديدة.
    • ترفع صورة ثم تُغلق دون حفظ ⇒ نسخة base64 كاملة تبقى في قاعدة
      البيانات بلا أي مرجع إليها.

  القاعدة التي تحسم الثلاثة: الملف يُمحى فقط حين يصير بلا مرجع فعلًا،
  أي بعد أن تنجح كتابة المستند. فحتى ذلك الحين يُسجَّل القصد لا يُنفَّذ:

    drop(path)   ملف أُزيل من النموذج — يُمحى بعد نجاح الحفظ.
    track(path)  ملف رُفع في هذه الجلسة — يُمحى إن أُغلق النموذج بلا حفظ.
    commit()     بعد تأكيد الكتابة: نفّذ ما أُزيل.
    rollback()   عند الإلغاء: أبقِ القديم، وامحُ ما رُفع ولم يُحفظ.

  والحذف نفسه بأفضل جهد: فشله لا يُفشل الحفظ ولا الإغلاق.
*/
import { useMemo, useRef } from "react";
import { deleteFile } from "@/injazi/services/storage";

export type FileTrash = {
  drop: (path: string | null | undefined) => void;
  track: (path: string | null | undefined) => void;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  reset: () => void;
};

export function useFileTrash(): FileTrash {
  const dropped = useRef<string[]>([]);
  const added = useRef<string[]>([]);

  return useMemo<FileTrash>(() => {
    const erase = async (paths: string[]) => {
      for (const path of paths) {
        try {
          await deleteFile(path);
        } catch {
          /* أفضل جهد: بقاء ملف لا يبرّر إسقاط عملية نجحت */
        }
      }
    };
    const take = (box: { current: string[] }) => {
      const paths = box.current;
      box.current = [];
      return paths;
    };
    return {
      drop: (path) => {
        if (path) dropped.current.push(path);
      },
      track: (path) => {
        if (path) added.current.push(path);
      },
      async commit() {
        // ما رُفع صار محفوظًا ومرجوعًا إليه، فيخرج من قائمة المؤقّت.
        added.current = [];
        await erase(take(dropped));
      },
      async rollback() {
        // ما أُزيل من النموذج لم يُزَل من المستند: يبقى كما هو.
        dropped.current = [];
        await erase(take(added));
      },
      reset() {
        dropped.current = [];
        added.current = [];
      },
    };
  }, []);
}
