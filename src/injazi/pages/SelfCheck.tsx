/*
  صفحة الفحص الذاتي — #/check
  ==================================================================
  لماذا توجد هذه الصفحة؟
  ------------------------------------------------------------------
  «لا يحفظ» جملة لا تُصلَح. Firestore يرفض الكتابة برمز دقيق
  (permission-denied, failed-precondition, unavailable, unauthenticated…)
  وكل رمز منها عطل مختلف تمامًا وعلاج مختلف تمامًا. وحين لا يصل الرمز
  إلى من يستطيع قراءته، يصير التشخيص تخمينًا، والتخمين يكلّف أيامًا.

  فهذه الصفحة تنفّذ العمليات الحقيقية نفسها التي تنفّذها الطالبة —
  على قاعدة البيانات الحقيقية، من جهازها هي، بجلستها هي — وتطبع نتيجة
  كل خطوة برمزها. ثم تحذف كل ما أنشأته.

  قاعدتان لا تُكسران:
    • لا تلمس أي بيانات قائمة: تكتب سجلًّا واحدًا باسم ظاهر، وتحذفه.
    • لا تعرض سرًّا: رمز الرابط يظهر مقطوعًا، وكلمات المرور لا تُقرأ.
*/
import { useState } from "react";
import { Copy, Play, ShieldCheck } from "lucide-react";
import { doc, getDoc, getDocs, query, where, collection } from "firebase/firestore";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Notice } from "@/injazi/ui/primitives";
import { db, isFirebaseUsable } from "@/injazi/firebase/client";
import { auth } from "@/lib/firebase";
import { useSession } from "@/injazi/hooks/useLive";
import {
  COL,
  archiveProject,
  createProject,
  deleteProject,
  updateProject,
} from "@/injazi/services/repo";
import { saveMedia, deleteMedia } from "@/injazi/services/media";
import { showToast } from "@/injazi/lib/toast";

type Row = { label: string; state: "ok" | "fail" | "skip"; detail: string };

const TEST_TITLE = "فحص تلقائي — يُحذف فورًا";

/** رمز الخطأ هو المعلومة، لا نصّه الإنجليزي. */
function codeOf(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code ? `${code} — ${message.slice(0, 120)}` : message.slice(0, 160);
}

/** السرّ يُعرَض مقطوعًا: الصفحة قد تُصوَّر وتُرسَل. */
const mask = (value?: string | null) =>
  value ? `${value.slice(0, 4)}…${value.slice(-2)} (${value.length} حرفًا)` : "—";

export function SelfCheck() {
  const { uid, profile, loading } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const add = (row: Row) => setRows((current) => [...current, row]);

  async function step(label: string, run: () => Promise<string>) {
    try {
      add({ label, state: "ok", detail: await run() });
      return true;
    } catch (error) {
      add({ label, state: "fail", detail: codeOf(error) });
      return false;
    }
  }

  async function runChecks() {
    setRows([]);
    setDone(false);
    setRunning(true);

    add({
      label: "إعدادات Firebase",
      state: isFirebaseUsable ? "ok" : "fail",
      detail: isFirebaseUsable ? "مضبوطة" : "غير مضبوطة — لا يعمل شيء",
    });
    add({
      label: "الجلسة",
      state: uid ? "ok" : "fail",
      detail: uid ? `uid=${mask(uid)} · ${auth.currentUser?.isAnonymous ? "مجهولة" : "بحساب"}` : "لا جلسة",
    });
    add({
      label: "ملف الصلاحيات",
      state: profile ? "ok" : "fail",
      detail: profile
        ? `الدور=${profile.role} · فعّال=${profile.active ? "نعم" : "لا"} · طالبات=${
            profile.studentIds?.length ?? 0
          } · مواد=${profile.subjectIds?.length ?? 0}`
        : "غير موجود — لم تُقيَّد الصلاحية بعد",
    });

    const linkCode = profile?.linkCode;
    const inviteCode = profile?.inviteCode;
    if (linkCode || inviteCode) {
      await step("الرابط الذي منح الصلاحية ما زال حيًّا", async () => {
        const path = linkCode ? COL.studentLinks : COL.invites;
        const snapshot = await getDoc(doc(db, path, (linkCode ?? inviteCode) as string));
        if (!snapshot.exists()) throw new Error("مستند الرابط غير موجود — أُلغي أو أُعيد إنشاؤه");
        if (snapshot.data().active === false) throw new Error("الرابط موجود لكنه معطَّل");
        return `${mask(linkCode ?? inviteCode)} · فعّال`;
      });
    } else {
      add({ label: "الرابط", state: "skip", detail: "الجلسة ليست عبر رابط" });
    }

    const studentId = profile?.studentIds?.[0] ?? null;

    await step("قراءة الطالبات", async () => {
      const snapshot = await getDocs(collection(db, COL.students));
      return `${snapshot.size} طالبة`;
    });

    /*
      هذه الخطوة بالذات هي مقتل «إضافة مشروع»: الإنشاء يقرأ أولًا
      مشاريع الطالبة ليحسب الترتيب. فلو رُفض هذا الاستعلام أو احتاج
      فهرسًا، لا يحدث الحفظ إطلاقًا — والسبب لا يظهر في أي مكان آخر.
    */
    if (studentId) {
      await step("قراءة مشاريع الطالبة (يسبق كل حفظ)", async () => {
        const snapshot = await getDocs(
          query(collection(db, COL.projects), where("studentId", "==", studentId)),
        );
        return `${snapshot.size} مشروعًا`;
      });
      await step("قراءة إنجازات الطالبة", async () => {
        const snapshot = await getDocs(
          query(collection(db, COL.achievements), where("studentId", "==", studentId)),
        );
        return `${snapshot.size} إنجازًا`;
      });
    }

    await step("رفع صورة تجريبية", async () => {
      const blob = await (await fetch(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==",
      )).blob();
      const saved = await saveMedia(blob, { name: "selfcheck.png", studentId });
      /* deleteMedia يبتلع أخطاءه، فلا يكفي استدعاؤه لادّعاء التنظيف:
         نتحقّق من اختفاء المستند فعلًا، وإلا قلنا إنه بقي. */
      await deleteMedia(saved.ref);
      const left = await getDoc(doc(db, COL.media, saved.ref.replace("iz-media://", "")));
      if (left.exists()) throw new Error("رُفعت لكن تعذّر حذفها — بقيت نسخة في قاعدة البيانات");
      return "رُفعت وحُذفت";
    });

    // ---------------- دورة حياة مشروع كاملة على بيانات حقيقية
    if (!studentId) {
      add({
        label: "حفظ مشروع / أرشفة / حذف",
        state: "skip",
        detail: "افتحي هذه الصفحة من رابط الطالبة كي تُفحَص الكتابة",
      });
    } else {
      let subjectId = "";
      const subjectsRead = await step("قراءة المواد", async () => {
        const snapshot = await getDocs(collection(db, COL.subjects));
        subjectId = snapshot.docs[0]?.id ?? "";
        if (!subjectId) throw new Error("لا توجد مواد — لا يمكن حفظ مشروع بلا مادة");
        return `${snapshot.size} مادة`;
      });

      let projectId = "";
      /* بلا هذا الشرط كان فشل قراءة المواد يترك subjectId فارغًا
         والإنشاء يمضي، فيُكتب مشروع بلا مادة في ملف طالبة حقيقي. */
      const created =
        subjectsRead &&
        (await step("حفظ مشروع تجريبي", async () => {
        projectId = await createProject({
          studentId,
          subjectId,
          title: TEST_TITLE,
          description: "سجل فحص — يُحذف تلقائيًا",
        });
        return `كُتب المستند ${mask(projectId)}`;
        }));

      if (!subjectsRead) {
        add({
          label: "حفظ مشروع تجريبي",
          state: "skip",
          detail: "أُوقف: لم تُقرأ المواد، والحفظ بلا مادة يترك سجلًّا ناقصًا",
        });
      }

      if (created) {
        await step("تعديل المشروع", async () => {
          await updateProject(projectId, { description: "تعديل فحص" });
          return "تم";
        });
        await step("أرشفة المشروع", async () => {
          await archiveProject(projectId, true);
          return "تم";
        });
        await step("إلغاء الأرشفة", async () => {
          await archiveProject(projectId, false);
          return "تم";
        });
        await step("حذف المشروع التجريبي", async () => {
          await deleteProject(projectId);
          /*
            التحقّق باستعلام القائمة لا بقراءة المستند المحذوف.
            قواعد الحماية تبني إذن القراءة على حقول المستند نفسه، فقراءة
            مستند غير موجود ترتدّ permission-denied لا «غير موجود» —
            وكانت هذه الخطوة تقرأ الرفض على أنه فشل حذف، فتتّهم عملية
            ناجحة. وصفحة تشخيص تكذب أسوأ من غياب التشخيص.
          */
          const rest = await getDocs(
            query(collection(db, COL.projects), where("studentId", "==", studentId)),
          );
          if (rest.docs.some((row) => row.id === projectId)) {
            throw new Error("المستند ما زال موجودًا بعد الحذف");
          }
          return "حُذف ولم يبقَ له أثر";
        });
      } else {
        add({
          label: "بقية خطوات المشروع",
          state: "skip",
          detail: "أُوقفت لأن الحفظ نفسه فشل",
        });
      }
    }

    setRunning(false);
    setDone(true);
  }

  const report = [
    "تقرير فحص «إنجازي يحكي»",
    new Date().toLocaleString("ar-SA"),
    location.origin,
    "",
    ...rows.map((r) => `${r.state === "ok" ? "✅" : r.state === "fail" ? "❌" : "⏭️"} ${r.label}: ${r.detail}`),
  ].join("\n");

  const failed = rows.filter((r) => r.state === "fail");

  return (
    <div className="iz-page" style={{ maxWidth: 760, marginInline: "auto" }}>
      <h1 className="iz-h1">
        <ShieldCheck size={26} strokeWidth={2.4} aria-hidden="true" /> فحص النظام
      </h1>
      <p className="iz-field__meter" style={{ marginBlockEnd: "var(--iz-s-4)" }}>
        يُجري هذا الفحص العمليات الحقيقية نفسها (حفظ، تعديل، أرشفة، حذف، رفع صورة) على هذه
        الجلسة بالذات، ثم يحذف كل ما أنشأه. افتحيه من <strong>رابط الطالبة</strong> ليكون
        الفحص كاملًا.
      </p>

      {loading && <Notice tone="info">جارٍ قراءة الجلسة…</Notice>}

      <ClayButton onClick={runChecks} loading={running} icon={<Play size={17} strokeWidth={2.6} />}>
        ابدئي الفحص
      </ClayButton>

      {rows.length > 0 && (
        <div className="iz-editor-block" style={{ marginBlockStart: "var(--iz-s-4)" }}>
          {rows.map((row, index) => (
            <p key={index} style={{ marginBlock: 6, lineHeight: 1.7 }}>
              <span aria-hidden="true">
                {row.state === "ok" ? "✅" : row.state === "fail" ? "❌" : "⏭️"}
              </span>{" "}
              <strong>{row.label}:</strong>{" "}
              <span style={{ opacity: 0.85, wordBreak: "break-word" }}>{row.detail}</span>
            </p>
          ))}
        </div>
      )}

      {done && (
        <>
          {failed.length === 0 ? (
            <Notice tone="info">
              كل العمليات نجحت على قاعدة البيانات الحقيقية من هذا الجهاز وهذه الجلسة.
            </Notice>
          ) : (
            <Notice tone="danger">
              فشلت {failed.length} خطوة. أرسلي التقرير كما هو — الرمز الموجود فيه يحسم السبب.
            </Notice>
          )}
          <ClayButton
            variant="soft"
            icon={<Copy size={16} strokeWidth={2.6} />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(report);
                showToast("نُسخ التقرير");
              } catch {
                showToast("انسخيه يدويًا من الأسفل", "info");
              }
            }}
          >
            نسخ التقرير
          </ClayButton>
          <pre
            style={{
              marginBlockStart: "var(--iz-s-3)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.78rem",
              opacity: 0.8,
              direction: "rtl",
            }}
          >
            {report}
          </pre>
        </>
      )}
    </div>
  );
}
