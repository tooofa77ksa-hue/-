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
      student: a.studentNameSnapshot,
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
        student: a.studentNameSnapshot,
        date: formatDate(a.completedAt),
        question: ans.questionTextSnapshot,
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
        text: ans.questionTextSnapshot,
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
