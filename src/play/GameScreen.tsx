import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PhaserGameCanvas } from "@/game/PhaserGameCanvas";
import { gameBus } from "@/game/eventBus";
import { getAudioManager } from "@/game/audio/AudioManager";
import { GAME_MODE_LABELS } from "@/game/modes/registry";
import { QuestionOverlay } from "./QuestionOverlay";
import { AudioControls } from "./AudioControls";
import { useAudioSettings, useGameSettings, usePublishedQuestions } from "./useGameData";
import { useQuestionFlow } from "./useQuestionFlow";
import type { GameMode } from "@/types/models";

const VALID_MODES: GameMode[] = ["rocket_mission", "squishy_treasure", "magic_gate"];

export function GameScreen() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const isValidMode = mode && (VALID_MODES as string[]).includes(mode);
  const gameMode = isValidMode ? (mode as GameMode) : undefined;

  const gameSettings = useGameSettings();
  const audioSettings = useAudioSettings();
  const questions = usePublishedQuestions(gameMode);
  const flow = useQuestionFlow(questions ?? [], gameSettings?.questionsPerRound ?? 6);

  const audioDefaultsApplied = useRef(false);
  useEffect(() => {
    if (audioSettings && !audioDefaultsApplied.current) {
      const manager = getAudioManager();
      manager.setDuckingAmount(1 - (audioSettings.duckingAmount ?? 0.35));
      audioDefaultsApplied.current = true;
    }
  }, [audioSettings]);

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
      manager.playWrongVariant();
    } else if (flow.status === "complete") {
      gameBus.emit("ROUND_COMPLETE", {});
      manager.playEvent(flow.wrongCount === 0 ? "CREATIVE" : "HERO");
    }
  }, [flow.status, flow.progress, flow.wrongCount]);

  if (!gameMode) {
    return (
      <div className="game-screen__empty">
        <p>هذه اللعبة غير متاحة.</p>
        <button onClick={() => navigate("/play")}>الرجوع للاختيار</button>
      </div>
    );
  }

  if (questions === null) {
    return <div className="game-screen__empty">جارٍ تحميل الأسئلة...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="game-screen__empty">
        <p>لا توجد أسئلة منشورة لهذه اللعبة حاليًا. اسألي معلمتك 💛</p>
        <button onClick={() => navigate("/play")}>الرجوع للاختيار</button>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-screen__canvas">
        <PhaserGameCanvas mode={gameMode} reducedMotion={getAudioManager().getPrefs().reducedMotion} />
      </div>

      <div className="game-screen__topbar">
        <button className="back-btn" onClick={() => navigate("/play")}>
          ⟵ الألعاب
        </button>
        <span className="game-screen__mode-label">{GAME_MODE_LABELS[gameMode]}</span>
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
          <h2>أحسنتِ! أنهيتِ الجولة 🎉</h2>
          <p>
            إجاباتك الصحيحة: {flow.correctCount} من {flow.total}
          </p>
          <div className="round-complete__actions">
            <button
              onClick={() => {
                flow.reset();
                gameBus.emit("ROUND_RESET", {});
              }}
            >
              العب مرة أخرى
            </button>
            <button onClick={() => navigate("/play")}>لعبة أخرى</button>
          </div>
        </div>
      )}
    </div>
  );
}
