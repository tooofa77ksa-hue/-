import { useEffect, useState } from "react";
import {
  subscribeAllQuestions,
  subscribeAttempts,
  subscribeGroups,
  subscribeQuestionSets,
  subscribeSkills,
  subscribeStudents,
  subscribeTestSessions,
} from "@/lib/repo";
import type { Attempt, Group, Question, QuestionSet, Skill, Student, TestSession } from "@/types/models";

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

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeStudents((s) => {
      setStudents(s);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { students, loading };
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => subscribeGroups(setGroups), []);
  return groups;
}

export function useTestSessions() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  useEffect(() => subscribeTestSessions(setSessions), []);
  return sessions;
}

export function useAttempts() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeAttempts((a) => {
      setAttempts(a);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { attempts, loading };
}
