import type { Question } from "@/types/models";
import type { FlowStatus } from "./useQuestionFlow";
import { Celebration } from "./Celebration";

interface Props {
  question: Question;
  status: FlowStatus;
  selected: number | null;
  onAnswer: (choiceIndex: number) => void;
  onNext: () => void;
  index: number;
  total: number;
}

export function QuestionOverlay({ question, status, selected, onAnswer, onNext, index, total }: Props) {
  return (
    <div className="question-overlay">
      {status === "correct" && <Celebration variant="sparkle" />}

      <div className="question-overlay__progress">
        السؤال {index + 1} من {total}
      </div>

      {question.passage && <p className="question-overlay__passage">{question.passage}</p>}

      <h2 className="question-overlay__prompt">{question.question}</h2>

      <div className="question-overlay__choices">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrectChoice = i === question.correctAnswer;
          let variant = "";
          if (status !== "answering") {
            if (isCorrectChoice) variant = "correct";
            else if (isSelected) variant = "wrong";
          }
          return (
            <button
              key={i}
              className={`choice-btn ${variant}`}
              disabled={status !== "answering"}
              onClick={() => onAnswer(i)}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {status !== "answering" && (
        <div className={`question-overlay__feedback ${status === "correct" ? "is-correct" : "is-wrong"}`}>
          <span>
            {status === "correct"
              ? question.feedback?.correct || "ممتازة! إجابة صحيحة"
              : question.feedback?.incorrect || "حاولي مرة أخرى"}
          </span>
          <button className="next-btn" onClick={onNext}>
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
