import { useMemo, useState } from "react";
import { useAllQuestions, useQuestionSets } from "./useTeacherData";
import { useAuth } from "./AuthContext";
import { importStarterQuestions } from "@/lib/repo";
import { SKILL_LABELS } from "@/lib/constants";
import type { SkillKey } from "@/types/models";

export function DashboardHome() {
  const { questions, loading } = useAllQuestions();
  const sets = useQuestionSets();
  const { appUser } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<"imported" | "already-imported" | null>(null);

  const stats = useMemo(() => {
    const published = questions.filter((q) => q.published).length;
    const bySkill = new Map<string, number>();
    for (const q of questions) {
      bySkill.set(q.skill, (bySkill.get(q.skill) || 0) + 1);
    }
    return {
      total: questions.length,
      published,
      unpublished: questions.length - published,
      bySkill: [...bySkill.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [questions]);

  const handleImport = async () => {
    if (!appUser) return;
    setImporting(true);
    try {
      const result = await importStarterQuestions(appUser.uid);
      setImportResult(result);
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div>جارٍ التحميل...</div>;

  return (
    <div className="dashboard-home">
      <h1>لوحة التحكم</h1>

      {stats.total === 0 && (
        <div className="import-banner">
          <p>لا توجد أسئلة بعد. تستطيعين البدء بمجموعة جاهزة من 16 سؤالًا (من كراسة أستعد لأنافس) بضغطة واحدة:</p>
          <button className="primary-btn" onClick={handleImport} disabled={importing}>
            {importing ? "جارٍ الاستيراد..." : "استيراد الأسئلة النموذجية"}
          </button>
          {importResult === "imported" && <p className="save-confirm">تم الاستيراد ✓</p>}
          {importResult === "already-imported" && <p>هذه المجموعة مستوردة مسبقًا.</p>}
        </div>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card__value">{stats.total}</div>
          <div className="stat-card__label">إجمالي الأسئلة</div>
        </div>
        <div className="stat-card stat-card--good">
          <div className="stat-card__value">{stats.published}</div>
          <div className="stat-card__label">منشورة</div>
        </div>
        <div className="stat-card stat-card--warn">
          <div className="stat-card__value">{stats.unpublished}</div>
          <div className="stat-card__label">غير منشورة</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{sets.length}</div>
          <div className="stat-card__label">مجموعات الأسئلة</div>
        </div>
      </div>

      <h2>عدد الأسئلة لكل مهارة</h2>
      <ul className="skill-stats">
        {stats.bySkill.map(([skill, count]) => (
          <li key={skill}>
            <span>{SKILL_LABELS[skill as SkillKey] || skill}</span>
            <strong>{count}</strong>
          </li>
        ))}
        {stats.bySkill.length === 0 && <li>لا توجد بيانات بعد.</li>}
      </ul>
    </div>
  );
}
