import { useEffect, useState } from "react";
import { subscribeAllQuestions, subscribeQuestionSets, subscribeSkills } from "@/lib/repo";
import type { Question, QuestionSet, Skill } from "@/types/models";

export function useAllQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeAllQuestions((q) => {
      setQuestions(q);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { questions, loading };
}

export function useQuestionSets() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  useEffect(() => subscribeQuestionSets(setSets), []);
  return sets;
}

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  useEffect(() => subscribeSkills(setSkills), []);
  return skills;
}
