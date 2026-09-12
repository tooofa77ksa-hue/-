// تصدير النتائج إلى ملف Excel احترافي حقيقي (.xlsx عبر مكتبة exceljs).
// يُستورَد بشكل كسول (Dynamic import) من ResultsPage فقط، حتى لا تُحمَّل
// هذه المكتبة إطلاقًا داخل /play (طالبات فقط تحتجن الأسئلة والألعاب).
import type { Attempt, Group, Student } from "@/types/models";
import { GAME_MODE_LABELS_AR, SKILL_LABELS } from "@/lib/constants";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** يمنع حقن الصيغ (Formula Injection) عند فتح الملف ببرامج جداول بيانات
 * تُنفّذ أي خلية نصية تبدأ بـ =/+/-/@ كصيغة حسابية: نص المصدر هنا
 * (studentNameSnapshot/questionTextSnapshot) قادم بالكامل من بيانات
 * لقطة (Snapshot) محفوظة وقت المحاولة، وقواعد الأمان تسمح بإنشاء محاولة
 * بلا تسجيل دخول - فهو نص لا يُفترَض به الثقة الكاملة. exceljs الإصدار
 * الحالي يكتب الخلايا كنص مشترك (Shared String) لا يُنفَّذ فعليًا في
 * Excel، فهذا تحصين إضافي احترازي (Defense in Depth) لا إصلاح لثغرة
 * مؤكَّدة - يبقى مهمًا لأنه يحمي أيضًا حال إعادة تصدير البيانات لاحقًا
 * كـ CSV (الذي لا يملك نفس الحماية). */
function safeExcelText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export async function exportResultsToExcel(
  attempts: Attempt[],
  students: Student[],
  groups: Group[]
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "شُعلة لغتي";
  workbook.created = new Date();

  const rtlFrozenView = { state: "frozen" as const, ySplit: 1, rightToLeft: true };

  function styleHeaderRow(ws: import("exceljs").Worksheet) {
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF07A869" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
    ws.views = [rtlFrozenView];
  }

  // ---------------- ملخص النتائج ----------------
  const summarySheet = workbook.addWorksheet("ملخص النتائج");
  summarySheet.columns = [
    { header: "اسم الطالبة", key: "student", width: 22 },
    { header: "المجموعة", key: "group", width: 18 },
    { header: "اللعبة", key: "game", width: 18 },
    { header: "المهارة", key: "skill", width: 18 },
    { header: "التاريخ", key: "date", width: 14 },
    { header: "عدد الأسئلة", key: "total", width: 12 },
    { header: "إجابات صحيحة", key: "correct", width: 12 },
    { header: "إجابات خاطئة", key: "incorrect", width: 12 },
    { header: "النسبة المئوية", key: "score", width: 14 },
  ];
  for (const a of attempts) {
    summarySheet.addRow({
      student: safeExcelText(a.studentNameSnapshot),
      group: a.groupNameSnapshot || "—",
      game: GAME_MODE_LABELS_AR[a.gameMode] || a.gameMode,
      skill: a.skill ? SKILL_LABELS[a.skill] || a.skill : "متنوّع",
      date: formatDate(a.completedAt),
      total: a.totalQuestions,
      correct: a.correctCount,
      incorrect: a.incorrectCount,
      score: `${round1(a.scorePercentage)}%`,
    });
  }
  styleHeaderRow(summarySheet);

  // ---------------- تفاصيل الإجابات ----------------
  const detailsSheet = workbook.addWorksheet("تفاصيل الإجابات");
  detailsSheet.columns = [
    { header: "اسم الطالبة", key: "student", width: 20 },
    { header: "التاريخ", key: "date", width: 14 },
    { header: "نص السؤال", key: "question", width: 40 },
    { header: "إجابة الطالبة", key: "given", width: 24 },
    { header: "الإجابة الصحيحة", key: "correct", width: 24 },
    { header: "النتيجة", key: "result", width: 10 },
    { header: "الوقت المستغرق (ثانية)", key: "time", width: 16 },
  ];
  for (const a of attempts) {
    for (const ans of a.answers) {
      detailsSheet.addRow({
        student: safeExcelText(a.studentNameSnapshot),
        date: formatDate(a.completedAt),
        question: safeExcelText(ans.questionTextSnapshot),
        given: ans.choicesSnapshot[ans.studentAnswer],
        correct: ans.choicesSnapshot[ans.correctAnswerSnapshot],
        result: ans.isCorrect ? "صحيحة" : "خاطئة",
        time: ans.timeSpentMs ? round1(ans.timeSpentMs / 1000) : "—",
      });
    }
  }
  styleHeaderRow(detailsSheet);

  // ---------------- نتائج المجموعات ----------------
  const groupsSheet = workbook.addWorksheet("نتائج المجموعات");
  groupsSheet.columns = [
    { header: "اسم المجموعة", key: "group", width: 20 },
    { header: "عدد الطالبات", key: "studentCount", width: 14 },
    { header: "عدد المحاولات", key: "attemptCount", width: 14 },
    { header: "متوسط النسبة", key: "avg", width: 14 },
    { header: "أعلى نتيجة", key: "max", width: 14 },
    { header: "أدنى نتيجة", key: "min", width: 14 },
  ];
  for (const g of groups) {
    const groupAttempts = attempts.filter((a) => a.groupId === g.id);
    const studentCount = students.filter((s) => s.groupId === g.id).length;
    const scores = groupAttempts.map((a) => a.scorePercentage);
    groupsSheet.addRow({
      group: g.name,
      studentCount,
      attemptCount: groupAttempts.length,
      avg: scores.length ? `${round1(scores.reduce((s, v) => s + v, 0) / scores.length)}%` : "—",
      max: scores.length ? `${round1(Math.max(...scores))}%` : "—",
      min: scores.length ? `${round1(Math.min(...scores))}%` : "—",
    });
  }
  styleHeaderRow(groupsSheet);

  // ---------------- تحليل الأسئلة ----------------
  const questionStats = new Map<
    string,
    { text: string; skill?: string; appearances: number; correct: number }
  >();
  for (const a of attempts) {
    for (const ans of a.answers) {
      const entry = questionStats.get(ans.questionId) || {
        text: safeExcelText(ans.questionTextSnapshot),
        skill: a.skill ? SKILL_LABELS[a.skill] || a.skill : undefined,
        appearances: 0,
        correct: 0,
      };
      entry.appearances += 1;
      if (ans.isCorrect) entry.correct += 1;
      questionStats.set(ans.questionId, entry);
    }
  }
  const questionsSheet = workbook.addWorksheet("تحليل الأسئلة");
  questionsSheet.columns = [
    { header: "نص السؤال", key: "question", width: 44 },
    { header: "المهارة", key: "skill", width: 18 },
    { header: "عدد مرات الظهور", key: "appearances", width: 14 },
    { header: "إجابات صحيحة", key: "correct", width: 14 },
    { header: "نسبة النجاح", key: "successRate", width: 14 },
  ];
  const sortedQuestionStats = [...questionStats.values()].sort(
    (a, b) => a.correct / a.appearances - b.correct / b.appearances
  );
  for (const q of sortedQuestionStats) {
    questionsSheet.addRow({
      question: q.text,
      skill: q.skill || "—",
      appearances: q.appearances,
      correct: q.correct,
      successRate: `${round1((q.correct / q.appearances) * 100)}%`,
    });
  }
  styleHeaderRow(questionsSheet);

  // ---------------- الطالبات والمجموعات ----------------
  const rosterSheet = workbook.addWorksheet("الطالبات والمجموعات");
  rosterSheet.columns = [
    { header: "اسم الطالبة", key: "name", width: 22 },
    { header: "المجموعة", key: "group", width: 18 },
    { header: "عدد المحاولات", key: "attemptCount", width: 14 },
    { header: "متوسط النتائج", key: "avg", width: 14 },
  ];
  for (const s of students) {
    const studentAttempts = attempts.filter((a) => a.studentId === s.id);
    const scores = studentAttempts.map((a) => a.scorePercentage);
    rosterSheet.addRow({
      name: s.name,
      group: groups.find((g) => g.id === s.groupId)?.name || "—",
      attemptCount: studentAttempts.length,
      avg: scores.length ? `${round1(scores.reduce((sum, v) => sum + v, 0) / scores.length)}%` : "—",
    });
  }
  styleHeaderRow(rosterSheet);

  // ---------------- تطور الأداء ----------------
  // تسلسل زمني لكل طالبة (محاولاتها مرتّبة بتاريخ الإكمال) مع الفارق عن
  // محاولتها السابقة مباشرة ومؤشر اتجاه ملوَّن - بلا أي حقل جديد في
  // Firestore، فقط قراءة وترتيب لحقول Attempt الموجودة أصلًا.
  const progressSheet = workbook.addWorksheet("تطور الأداء");
  progressSheet.columns = [
    { header: "اسم الطالبة", key: "student", width: 22 },
    { header: "المجموعة", key: "group", width: 18 },
    { header: "التاريخ", key: "date", width: 14 },
    { header: "اللعبة", key: "game", width: 18 },
    { header: "النسبة المئوية", key: "score", width: 14 },
    { header: "التغيّر عن المحاولة السابقة", key: "delta", width: 22 },
    { header: "الاتجاه", key: "trend", width: 16 },
  ];

  const attemptsByStudent = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = attemptsByStudent.get(a.studentId) || [];
    list.push(a);
    attemptsByStudent.set(a.studentId, list);
  }
  const orderedStudentIds = [...attemptsByStudent.keys()].sort((idA, idB) =>
    attemptsByStudent.get(idA)![0].studentNameSnapshot.localeCompare(
      attemptsByStudent.get(idB)![0].studentNameSnapshot,
      "ar"
    )
  );

  const IMPROVED_ARGB = "FF0B8A3D";
  const DECLINED_ARGB = "FFC0392B";

  for (const studentId of orderedStudentIds) {
    const chronological = [...attemptsByStudent.get(studentId)!].sort((a, b) => a.completedAt - b.completedAt);
    let previousScore: number | null = null;
    for (const a of chronological) {
      const delta = previousScore === null ? null : round1(a.scorePercentage - previousScore);
      const row = progressSheet.addRow({
        student: safeExcelText(a.studentNameSnapshot),
        group: a.groupNameSnapshot || "—",
        date: formatDate(a.completedAt),
        game: GAME_MODE_LABELS_AR[a.gameMode] || a.gameMode,
        score: `${round1(a.scorePercentage)}%`,
        delta: delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`,
        trend: delta === null ? "أول محاولة" : delta > 0 ? "تحسّن ↑" : delta < 0 ? "تراجع ↓" : "بدون تغيير",
      });
      if (delta !== null && delta !== 0) {
        const argb = delta > 0 ? IMPROVED_ARGB : DECLINED_ARGB;
        row.getCell("delta").font = { color: { argb }, bold: true };
        row.getCell("trend").font = { color: { argb }, bold: true };
      }
      previousScore = a.scorePercentage;
    }
  }
  styleHeaderRow(progressSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const today = new Date().toISOString().slice(0, 10);
  const filename = `نتائج_لغتي_165_${today}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
