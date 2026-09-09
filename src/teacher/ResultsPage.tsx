import { useMemo, useState } from "react";
import { useAttempts, useGroups, useStudents, useTestSessions } from "./useTeacherData";
import { GAME_MODE_LABELS_AR, SKILL_LABELS } from "@/lib/constants";
import type { GameMode, SkillKey } from "@/types/models";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function ResultsPage() {
  const { attempts, loading } = useAttempts();
  const { students } = useStudents();
  const groups = useGroups();
  const sessions = useTestSessions();

  const [studentSearch, setStudentSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState<GameMode | "all">("all");
  const [skillFilter, setSkillFilter] = useState<SkillKey | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      if (studentSearch.trim() && !a.studentNameSnapshot.includes(studentSearch.trim())) return false;
      if (groupFilter !== "all" && a.groupId !== groupFilter) return false;
      if (gameFilter !== "all" && a.gameMode !== gameFilter) return false;
      if (skillFilter !== "all" && a.skill !== skillFilter) return false;
      return true;
    });
  }, [attempts, studentSearch, groupFilter, gameFilter, skillFilter]);

  const stats = useMemo(() => {
    const scores = filtered.map((a) => a.scorePercentage);
    const average = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    return {
      count: filtered.length,
      average: Math.round(average * 10) / 10,
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
    };
  }, [filtered]);

  const groupAverages = useMemo(() => {
    return groups
      .map((g) => {
        const groupAttempts = filtered.filter((a) => a.groupId === g.id);
        const scores = groupAttempts.map((a) => a.scorePercentage);
        const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
        return { group: g, count: groupAttempts.length, avg };
      })
      .filter((x) => x.count > 0);
  }, [groups, filtered]);

  const mostMissed = useMemo(() => {
    const map = new Map<string, { text: string; wrong: number; total: number }>();
    for (const a of filtered) {
      for (const ans of a.answers) {
        const entry = map.get(ans.questionId) || { text: ans.questionTextSnapshot, wrong: 0, total: 0 };
        entry.total += 1;
        if (!ans.isCorrect) entry.wrong += 1;
        map.set(ans.questionId, entry);
      }
    }
    return [...map.values()]
      .filter((e) => e.wrong > 0)
      .sort((a, b) => b.wrong / b.total - a.wrong / a.total)
      .slice(0, 5);
  }, [filtered]);

  const skillsNeedingReview = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of filtered) {
      if (!a.skill) continue;
      const entry = map.get(a.skill) || { correct: 0, total: 0 };
      entry.correct += a.correctCount;
      entry.total += a.totalQuestions;
      map.set(a.skill, entry);
    }
    return [...map.entries()]
      .map(([skill, v]) => ({ skill: skill as SkillKey, rate: v.total ? (v.correct / v.total) * 100 : 0 }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5);
  }, [filtered]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportResultsToExcel } = await import("./exportExcel");
      await exportResultsToExcel(filtered, students, groups);
    } finally {
      setExporting(false);
    }
  };

  const sessionLabel = (sessionId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return "—";
    return s.type === "individual" ? "اختبار فردي" : `اختبار جماعي: ${s.groupNameSnapshot || ""}`;
  };

  if (loading) return <div>جارٍ التحميل...</div>;

  return (
    <div className="results-page">
      <div className="page-header">
        <h1>النتائج ({filtered.length})</h1>
        <button className="primary-btn" onClick={handleExport} disabled={exporting || filtered.length === 0}>
          {exporting ? "جارٍ التصدير..." : "تصدير Excel"}
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="ابحثي باسم الطالبة..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
        />
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="all">كل المجموعات</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value as GameMode | "all")}>
          <option value="all">كل الألعاب</option>
          {Object.entries(GAME_MODE_LABELS_AR).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as SkillKey | "all")}>
          <option value="all">كل المهارات</option>
          {Object.entries(SKILL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card__value">{stats.count}</div>
          <div className="stat-card__label">عدد المحاولات</div>
        </div>
        <div className="stat-card stat-card--good">
          <div className="stat-card__value">{stats.average}%</div>
          <div className="stat-card__label">المتوسط</div>
        </div>
        <div className="stat-card stat-card--good">
          <div className="stat-card__value">{stats.highest}%</div>
          <div className="stat-card__label">أعلى نتيجة</div>
        </div>
        <div className="stat-card stat-card--warn">
          <div className="stat-card__value">{stats.lowest}%</div>
          <div className="stat-card__label">أدنى نتيجة</div>
        </div>
      </div>

      {groupAverages.length > 0 && (
        <>
          <h2>متوسط كل مجموعة</h2>
          <ul className="skill-stats">
            {groupAverages.map(({ group, count, avg }) => (
              <li key={group.id}>
                <span>
                  {group.name} ({count} محاولة)
                </span>
                <strong>{avg !== null ? `${Math.round(avg * 10) / 10}%` : "—"}</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {skillsNeedingReview.length > 0 && (
        <>
          <h2>مهارات تحتاج مراجعة</h2>
          <ul className="skill-stats">
            {skillsNeedingReview.map(({ skill, rate }) => (
              <li key={skill}>
                <span>{SKILL_LABELS[skill]}</span>
                <strong>{Math.round(rate * 10) / 10}%</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {mostMissed.length > 0 && (
        <>
          <h2>الأسئلة الأكثر خطأً</h2>
          <ul className="skill-stats">
            {mostMissed.map((q, i) => (
              <li key={i}>
                <span>{q.text}</span>
                <strong>
                  {q.wrong}/{q.total}
                </strong>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>سجل المحاولات</h2>
      <div className="questions-table">
        {filtered.map((a) => (
          <div key={a.id} className="attempt-row">
            <div className="question-row" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
              <div className="question-row__main">
                <div className="question-row__text">{a.studentNameSnapshot}</div>
                <div className="question-row__meta">
                  <span>{a.groupNameSnapshot || "بلا مجموعة"}</span>
                  <span>{GAME_MODE_LABELS_AR[a.gameMode]}</span>
                  <span>{a.skill ? SKILL_LABELS[a.skill] : "متنوّع"}</span>
                  <span>{formatDate(a.completedAt)}</span>
                  <span>{sessionLabel(a.sessionId)}</span>
                </div>
              </div>
              <div className="question-row__badges">
                <span className="badge-toggle on">
                  {a.correctCount}/{a.totalQuestions} ({Math.round(a.scorePercentage)}%)
                </span>
              </div>
            </div>
            {expandedId === a.id && (
              <div className="attempt-details">
                {a.answers.map((ans, i) => (
                  <div key={i} className={`attempt-detail-row ${ans.isCorrect ? "is-correct" : "is-wrong"}`}>
                    <span>{ans.questionTextSnapshot}</span>
                    <span>
                      إجابتها: {ans.choicesSnapshot[ans.studentAnswer]} · الصحيحة:{" "}
                      {ans.choicesSnapshot[ans.correctAnswerSnapshot]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p>لا توجد نتائج مطابقة بعد.</p>}
      </div>
    </div>
  );
}
