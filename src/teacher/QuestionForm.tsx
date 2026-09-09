import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAllQuestions, useQuestionSets } from "./useTeacherData";
import { createQuestion, updateQuestion } from "@/lib/repo";
import { DIFFICULTY_KEYS, DIFFICULTY_LABELS, GAME_MODE_KEYS, GAME_MODE_LABELS_AR, SKILL_KEYS, SKILL_LABELS } from "@/lib/constants";
import type { Difficulty, GameMode, SkillKey } from "@/types/models";

const emptyChoices: [string, string, string, string] = ["", "", "", ""];

export function QuestionForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { questions } = useAllQuestions();
  const sets = useQuestionSets();
  const existing = isEdit ? questions.find((q) => q.id === id) : undefined;

  const [questionSetId, setQuestionSetId] = useState("");
  const [skill, setSkill] = useState<SkillKey>("comprehension");
  const [passage, setPassage] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<[string, string, string, string]>(emptyChoices);
  const [correctAnswer, setCorrectAnswer] = useState<0 | 1 | 2 | 3>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameMode, setGameMode] = useState<GameMode>("rocket_mission");
  const [feedbackCorrect, setFeedbackCorrect] = useState("ممتازة! إجابة صحيحة");
  const [feedbackIncorrect, setFeedbackIncorrect] = useState("حاولي مرة أخرى");
  const [published, setPublished] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setQuestionSetId(existing.questionSetId);
    setSkill(existing.skill);
    setPassage(existing.passage || "");
    setQuestion(existing.question);
    setChoices(existing.choices);
    setCorrectAnswer(existing.correctAnswer);
    setDifficulty(existing.difficulty);
    setGameMode(existing.gameMode);
    setFeedbackCorrect(existing.feedback?.correct || "ممتازة! إجابة صحيحة");
    setFeedbackIncorrect(existing.feedback?.incorrect || "حاولي مرة أخرى");
    setPublished(existing.published);
    setActive(existing.active);
  }, [existing]);

  useEffect(() => {
    if (!questionSetId && sets.length > 0) setQuestionSetId(sets[0].id);
  }, [sets, questionSetId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser || !questionSetId) return;
    if (choices.some((c) => !c.trim())) {
      alert("يجب تعبئة الاختيارات الأربعة.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        questionSetId,
        skill,
        passage: passage.trim() || undefined,
        question: question.trim(),
        choices,
        correctAnswer,
        difficulty,
        gameMode,
        feedback: { correct: feedbackCorrect, incorrect: feedbackIncorrect },
        published,
        active,
        order: existing?.order ?? questions.length + 1,
        createdBy: existing?.createdBy ?? appUser.uid,
      };
      if (isEdit && id) {
        await updateQuestion(id, payload);
      } else {
        await createQuestion(payload);
      }
      navigate("/teacher/questions");
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && !existing) {
    return <div>جارٍ التحميل...</div>;
  }

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <h1>{isEdit ? "تعديل سؤال" : "إضافة سؤال جديد"}</h1>

      <label>
        مجموعة الأسئلة
        <select value={questionSetId} onChange={(e) => setQuestionSetId(e.target.value)} required>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        المهارة
        <select value={skill} onChange={(e) => setSkill(e.target.value as SkillKey)}>
          {SKILL_KEYS.map((k) => (
            <option key={k} value={k}>
              {SKILL_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      <label>
        نص قرائي (اختياري)
        <textarea value={passage} onChange={(e) => setPassage(e.target.value)} rows={3} />
      </label>

      <label>
        نص السؤال
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} required />
      </label>

      <fieldset>
        <legend>الاختيارات (حدّدي الإجابة الصحيحة)</legend>
        {choices.map((c, i) => (
          <div className="choice-input" key={i}>
            <input
              type="radio"
              name="correct"
              checked={correctAnswer === i}
              onChange={() => setCorrectAnswer(i as 0 | 1 | 2 | 3)}
            />
            <input
              type="text"
              value={c}
              onChange={(e) => {
                const next = [...choices] as [string, string, string, string];
                next[i] = e.target.value;
                setChoices(next);
              }}
              placeholder={`الاختيار ${i + 1}`}
              required
            />
          </div>
        ))}
      </fieldset>

      <div className="form-row">
        <label>
          مستوى الصعوبة
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {DIFFICULTY_KEYS.map((k) => (
              <option key={k} value={k}>
                {DIFFICULTY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label>
          نمط اللعبة
          <select value={gameMode} onChange={(e) => setGameMode(e.target.value as GameMode)}>
            {GAME_MODE_KEYS.map((k) => (
              <option key={k} value={k}>
                {GAME_MODE_LABELS_AR[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          رسالة عند الإجابة الصحيحة
          <input value={feedbackCorrect} onChange={(e) => setFeedbackCorrect(e.target.value)} />
        </label>
        <label>
          رسالة عند الإجابة الخاطئة
          <input value={feedbackIncorrect} onChange={(e) => setFeedbackIncorrect(e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          مفعّل
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          منشور (يظهر في اللعبة فورًا)
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
        <button type="button" onClick={() => navigate("/teacher/questions")}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
