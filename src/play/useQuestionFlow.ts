import { useCallback, useEffect, useRef, useState } from "react";
import type { AttemptAnswer, Question } from "@/types/models";

export type FlowStatus = "answering" | "correct" | "incorrect" | "complete";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param preserveOrder صحيح لجلسات الاختبار الرسمية (ترتيب الأسئلة كما
 * اختارته المعلمة بالضبط)، خطأ (الافتراضي) للعب العام (ترتيب عشوائي في كل
 * جولة).
 */
export function useQuestionFlow(questions: Question[], roundSize: number, preserveOrder = false) {
  const buildRound = useCallback(
    (qs: Question[]) => {
      const pool = preserveOrder ? qs : shuffle(qs);
      return pool.slice(0, Math.max(1, Math.min(roundSize, pool.length)));
    },
    [roundSize, preserveOrder]
  );

  // "questions" يصل من مستمع Firestore حي (onSnapshot) قد يُصدر لقطة جديدة
  // في أي لحظة (تعديل سؤال آخر من المعلمة مثلًا). تجميد الجولة الحالية عند
  // أول تكوين لها (بدل إعادة حسابها في كل مرة يتغيّر فيها "questions") يمنع
  // تغيّر عدد/ترتيب الأسئلة تحت قدمي الطالبة منتصف الجولة - وهو ما كان يسبب
  // خللاً حقيقيًا: correctCount يتجاوز total (مثل "6 من 5") حين تُعاد لقطة
  // بعدد أسئلة أقل بعد أن أجابت الطالبة على أكثر من ذلك العدد بالفعل.
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const [round, setRound] = useState<Question[]>(() => buildRound(questions));
  const lockedRef = useRef(round.length > 0);

  useEffect(() => {
    if (lockedRef.current || questionsRef.current.length === 0) return;
    setRound(buildRound(questionsRef.current));
    lockedRef.current = true;
  }, [questions, buildRound]);

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<FlowStatus>("answering");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<AttemptAnswer[]>([]);
  const questionShownAt = useRef(Date.now());

  const current = round[index];
  const total = round.length;
  const progress = total === 0 ? 0 : correctCount / total;

  const answer = useCallback(
    (choiceIndex: number) => {
      if (!current || status !== "answering") return null;
      const isCorrect = choiceIndex === current.correctAnswer;
      setSelected(choiceIndex);
      setStatus(isCorrect ? "correct" : "incorrect");
      if (isCorrect) setCorrectCount((c) => c + 1);
      else setWrongCount((c) => c + 1);
      setHistory((h) => [
        ...h,
        {
          questionId: current.id,
          questionTextSnapshot: current.question,
          choicesSnapshot: current.choices,
          studentAnswer: choiceIndex as 0 | 1 | 2 | 3,
          correctAnswerSnapshot: current.correctAnswer,
          isCorrect,
          answeredAt: Date.now(),
          timeSpentMs: Date.now() - questionShownAt.current,
        },
      ]);
      return isCorrect;
    },
    [current, status]
  );

  const next = useCallback(() => {
    setSelected(null);
    questionShownAt.current = Date.now();
    if (index + 1 >= total) {
      setStatus("complete");
    } else {
      setIndex((i) => i + 1);
      setStatus("answering");
    }
  }, [index, total]);

  const reset = useCallback(() => {
    if (questionsRef.current.length > 0) {
      setRound(buildRound(questionsRef.current));
    }
    setIndex(0);
    setStatus("answering");
    setCorrectCount(0);
    setWrongCount(0);
    setSelected(null);
    setHistory([]);
    questionShownAt.current = Date.now();
  }, [buildRound]);

  return {
    round,
    current,
    index,
    total,
    status,
    selected,
    correctCount,
    wrongCount,
    progress,
    history,
    answer,
    next,
    reset,
  };
}
