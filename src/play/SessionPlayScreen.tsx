import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PhaserGameCanvas } from "@/game/PhaserGameCanvas";
import { gameBus } from "@/game/eventBus";
import { getAudioManager } from "@/game/audio/AudioManager";
import { GAME_MODE_LABELS } from "@/game/modes/registry";
import { QuestionOverlay } from "./QuestionOverlay";
import { AudioControls } from "./AudioControls";
import { useQuestionFlow } from "./useQuestionFlow";
import { createAttempt, getQuestionsByIds, getTestSession } from "@/lib/repo";
import type { Question, TestSession } from "@/types/models";

type LoadState = "loading" | "not-found" | "inactive" | "ready";

/** شاشة اختبار رسمي مرتبطة بجلسة (فردية أو جماعية) - تختلف عن اللعب العام:
 * تتطلب اختيار اسم الطالبة (من مشاركي هذه الجلسة تحديدًا، لا كل الطالبات)،
 * وتحفظ محاولة كاملة (Attempt) بلقطة الأسئلة عند الانتهاء. */
export function SessionPlayScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [session, setSession] = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participant, setParticipant] = useState<{ studentId: string; name: string } | null>(null);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const attemptSaved = useRef(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoadState("not-found");
      return;
    }
    (async () => {
      const s = await getTestSession(sessionId);
      if (cancelled) return;
      if (!s) {
        setLoadState("not-found");
        return;
      }
      if (!s.active) {
        setLoadState("inactive");
        return;
      }
      const qs = await getQuestionsByIds(s.questionIds);
      if (cancelled) return;
      setSession(s);
      setQuestions(qs);
      if (s.type === "individual" && s.participants.length === 1) {
        setParticipant(s.participants[0]);
      }
      setLoadState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const flow = useQuestionFlow(questions, questions.length || 1, true);

  const prevStatus = useRef<string>("answering");
  useEffect(() => {
    if (flow.status === prevStatus.current) return;
    prevStatus.current = flow.status;
    const manager = getAudioManager();
    if (flow.status === "correct") {
      gameBus.emit("ANSWER_CORRECT", { progress: flow.progress });
      manager.playEvent("EXCELLENT");
    } else if (flow.status === "incorrect") {
      gameBus.emit("ANSWER_WRONG", {});
      manager.playEvent("WRONG");
    } else if (flow.status === "complete") {
      gameBus.emit("ROUND_COMPLETE", {});
      manager.playEvent(flow.wrongCount === 0 ? "CREATIVE" : "HERO");
    }
  }, [flow.status, flow.progress, flow.wrongCount]);

  useEffect(() => {
    if (flow.status !== "complete" || !session || !participant || attemptSaved.current) return;
    attemptSaved.current = true;
    setSaveState("saving");
    const completedAt = Date.now();
    createAttempt({
      sessionId: session.id,
      studentId: participant.studentId,
      studentNameSnapshot: participant.name,
      groupId: session.groupId,
      groupNameSnapshot: session.groupNameSnapshot,
      startedAt: startedAt ?? completedAt,
      completedAt,
      durationMs: completedAt - (startedAt ?? completedAt),
      gameMode: session.gameMode,
      skill: session.skill,
      totalQuestions: flow.total,
      correctCount: flow.correctCount,
      incorrectCount: flow.wrongCount,
      scorePercentage: flow.total > 0 ? Math.round((flow.correctCount / flow.total) * 100) : 0,
      answers: flow.history,
    })
      .then(() => setSaveState("saved"))
      .catch(() => setSaveState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.status]);

  if (loadState === "loading") {
    return <div className="game-screen__empty">جارٍ تحميل الاختبار...</div>;
  }

  if (loadState === "not-found") {
    return (
      <div className="game-screen__empty">
        <p>هذا الرابط غير صحيح، أو أنّ الاختبار لم يعد موجودًا. تأكدي من الرابط مع معلمتك.</p>
        <button onClick={() => navigate("/play")}>الرجوع للعب العام</button>
      </div>
    );
  }

  if (loadState === "inactive") {
    return (
      <div className="game-screen__empty">
        <p>هذا الاختبار غير نشط حاليًا. اسألي معلمتك عن رابط جديد.</p>
        <button onClick={() => navigate("/play")}>الرجوع للعب العام</button>
      </div>
    );
  }

  if (!session) return null;

  if (questions.length === 0) {
    return (
      <div className="game-screen__empty">
        <p>لا توجد أسئلة في هذا الاختبار حاليًا. اسألي معلمتك 💛</p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="session-roster">
        <h1>اختاري اسمك للبدء</h1>
        <div className="session-roster__list">
          {session.participants.map((p) => (
            <button key={p.studentId} className="session-roster__item" onClick={() => setParticipant(p)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="session-roster">
        <h1>أهلًا {participant.name} 👋</h1>
        <p>هذا اختبار رسمي من معلمتك بعنوان: {GAME_MODE_LABELS[session.gameMode]}</p>
        <p>عدد الأسئلة: {questions.length}</p>
        <button
          className="primary-btn"
          onClick={() => {
            setStartedAt(Date.now());
            setStarted(true);
          }}
        >
          ابدئي الاختبار
        </button>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-screen__canvas">
        <PhaserGameCanvas mode={session.gameMode} reducedMotion={getAudioManager().getPrefs().reducedMotion} />
      </div>

      <div className="game-screen__topbar">
        <span className="game-screen__mode-label">اختبار: {participant.name}</span>
        <AudioControls />
      </div>

      {flow.status !== "complete" && flow.current && (
        <QuestionOverlay
          question={flow.current}
          status={flow.status}
          selected={flow.selected}
          onAnswer={flow.answer}
          onNext={flow.next}
          index={flow.index}
          total={flow.total}
        />
      )}

      {flow.status === "complete" && (
        <div className="round-complete">
          <h2>أحسنتِ يا {participant.name}! أنهيتِ الاختبار 🎉</h2>
          <p>
            إجاباتك الصحيحة: {flow.correctCount} من {flow.total}
          </p>
          {saveState === "saving" && <p>جارٍ إرسال نتيجتك لمعلمتك...</p>}
          {saveState === "saved" && <p className="save-confirm">تم إرسال نتيجتك لمعلمتك ✓</p>}
          {saveState === "error" && <p>تعذّر إرسال النتيجة. تحققي من الاتصال بالإنترنت.</p>}
          <div className="round-complete__actions">
            <button onClick={() => navigate("/play")}>إنهاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
