/*
  دفتر الإنجازات
  ------------------------------------------------------------------
  يعيش في متصفح الطالبة (localStorage) ولا يُرسَل إلى أي خادم: القسم
  مستقل تمامًا عن Firebase وعن لوحة المعلمة، فلا يضيف أي طلب شبكة إلى
  مسار التحميل الأول ولا يجمع بيانات عن قاصر.

  القراءة تمر عبر useAchievements حتى تتحدث كل الشاشات المفتوحة معًا
  عند الحفظ (نمط useSyncExternalStore بمتجر صغير).
*/
import { useCallback, useSyncExternalStore } from "react";
import { SUBJECTS } from "@/injazi/lib/subjects";

const STORAGE_KEY = "injazi:journal:v1";

export type Achievement = {
  id: string;
  subjectId: string;
  title: string;
  story: string;
  /** ISO — يُعرض بتاريخ هجري/ميلادي حسب لغة المتصفح في الشاشة. */
  createdAt: string;
};

let cache: Achievement[] | null = null;
let listeners: (() => void)[] = [];

function load(): Achievement[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? (parsed as Achievement[]) : [];
  } catch {
    // تخزين محجوب أو بيانات تالفة: نبدأ بدفتر فارغ بدل تعطيل الشاشة.
    cache = [];
  }
  return cache;
}

function persist(next: Achievement[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* الدفتر يبقى في الذاكرة حتى نهاية الجلسة على الأقل */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

/** كل الإنجازات، الأحدث أولًا. */
export function useAchievements(): Achievement[] {
  return useSyncExternalStore(subscribe, load, () => []);
}

export type SaveResult = {
  achievement: Achievement;
  /** عدد نجوم المادة بعد الحفظ. */
  starsInSubject: number;
  /** true إذا كان هذا الحفظ هو الذي أكمل نجوم المادة (لحظة التاج). */
  crowned: boolean;
};

export function useSaveAchievement() {
  return useCallback((subjectId: string, title: string, story: string): SaveResult => {
    const subject = SUBJECTS.find((entry) => entry.id === subjectId);
    const goal = subject?.starGoal ?? 5;
    const current = load();

    const achievement: Achievement = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      subjectId,
      title: title.trim(),
      story: story.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [achievement, ...current];
    persist(next);

    const before = countForSubject(current, subjectId);
    const after = before + 1;

    return {
      achievement,
      starsInSubject: Math.min(after, goal),
      // التاج يُمنح مرة واحدة: فقط عند العبور من (الهدف - 1) إلى الهدف.
      crowned: before < goal && after >= goal,
    };
  }, []);
}

export function useRemoveAchievement() {
  return useCallback((id: string) => {
    persist(load().filter((achievement) => achievement.id !== id));
  }, []);
}

function countForSubject(achievements: Achievement[], subjectId: string): number {
  return achievements.filter((achievement) => achievement.subjectId === subjectId).length;
}

/** نجوم كل مادة، محدودة بهدفها. */
export function starsBySubject(achievements: Achievement[]): Record<string, number> {
  const stars: Record<string, number> = {};
  SUBJECTS.forEach((subject) => {
    stars[subject.id] = Math.min(countForSubject(achievements, subject.id), subject.starGoal);
  });
  return stars;
}

/** ملخّص يُستخدم في ترويسة الصفحة الرئيسية. */
export function journalSummary(achievements: Achievement[]) {
  const stars = starsBySubject(achievements);
  const totalStars = Object.values(stars).reduce((sum, value) => sum + value, 0);
  const crowns = SUBJECTS.filter((subject) => stars[subject.id] >= subject.starGoal).length;
  return { stars, totalStars, crowns, stories: achievements.length };
}
