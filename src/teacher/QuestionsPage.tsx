import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllQuestions, useQuestionSets } from "./useTeacherData";
import { useAuth } from "./AuthContext";
import { deleteQuestion, duplicateQuestion, setPublished, updateQuestion } from "@/lib/repo";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS_AR, SKILL_LABELS } from "@/lib/constants";
import type { Difficulty, GameMode, Question, SkillKey } from "@/types/models";

export function QuestionsPage() {
  const { questions, loading } = useAllQuestions();
  const sets = useQuestionSets();
  const { appUser } = useAuth();

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<SkillKey | "all">("all");
  const [modeFilter, setModeFilter] = useState<GameMode | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "unpublished">("all");

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (skillFilter !== "all" && q.skill !== skillFilter) return false;
      if (modeFilter !== "all" && q.gameMode !== modeFilter) return false;
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      if (setFilter !== "all" && q.questionSetId !== setFilter) return false;
      if (publishFilter === "published" && !q.published) return false;
      if (publishFilter === "unpublished" && q.published) return false;
      if (search.trim() && !q.question.includes(search.trim())) return false;
      return true;
    });
  }, [questions, skillFilter, modeFilter, difficultyFilter, setFilter, publishFilter, search]);

  const setTitle = (id: string) => sets.find((s) => s.id === id)?.title || "—";

  const move = async (q: Question, dir: -1 | 1) => {
    const siblings = questions
      .filter((x) => x.questionSetId === q.questionSetId)
      .sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((x) => x.id === q.id);
    const target = siblings[idx + dir];
    if (!target) return;
    await Promise.all([
      updateQuestion(q.id, { order: target.order }),
      updateQuestion(target.id, { order: q.order }),
    ]);
  };

  if (loading) return <div>جارٍ التحميل...</div>;

  return (
    <div className="questions-page">
      <div className="page-header">
        <h1>الأسئلة ({filtered.length})</h1>
        <Link className="primary-btn" to="/teacher/questions/new">
          + إضافة سؤال
        </Link>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="ابحثي عن نص السؤال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as any)}>
          <option value="all">كل المهارات</option>
          {Object.entries(SKILL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as any)}>
          <option value="all">كل الألعاب</option>
          {Object.entries(GAME_MODE_LABELS_AR).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as any)}>
          <option value="all">كل المستويات</option>
          {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)}>
          <option value="all">كل المجموعات</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select value={publishFilter} onChange={(e) => setPublishFilter(e.target.value as any)}>
          <option value="all">الكل</option>
          <option value="published">منشور</option>
          <option value="unpublished">غير منشور</option>
        </select>
      </div>

      <div className="questions-table">
        {filtered.map((q) => (
          <div key={q.id} className="question-row">
            <div className="question-row__order">
              <button onClick={() => move(q, -1)} aria-label="تحريك لأعلى">▲</button>
              <button onClick={() => move(q, 1)} aria-label="تحريك لأسفل">▼</button>
            </div>
            <div className="question-row__main">
              <div className="question-row__text">{q.question}</div>
              <div className="question-row__meta">
                <span>{SKILL_LABELS[q.skill]}</span>
                <span>{GAME_MODE_LABELS_AR[q.gameMode]}</span>
                <span>{DIFFICULTY_LABELS[q.difficulty]}</span>
                <span>{setTitle(q.questionSetId)}</span>
              </div>
            </div>
            <div className="question-row__badges">
              <button
                className={`badge-toggle ${q.published ? "on" : ""}`}
                onClick={() => setPublished(q.id, !q.published)}
              >
                {q.published ? "ظاهر للطالبات" : "مسوَّدة"}
              </button>
            </div>
            <div className="question-row__actions">
              <Link to={`/teacher/questions/${q.id}/edit`}>تعديل</Link>
              <button onClick={() => appUser && duplicateQuestion(q, appUser.uid)}>نسخ</button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm("هل تريدين حذف هذا السؤال نهائيًا؟")) deleteQuestion(q.id);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p>لا توجد أسئلة مطابقة.</p>}
      </div>
    </div>
  );
}
