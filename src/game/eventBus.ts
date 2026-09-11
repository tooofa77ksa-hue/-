// ناقل أحداث بسيط ومكتوب الأنواع، يربط منطق اللعبة في React (تدفّق الأسئلة)
// بمشاهد Phaser (العرض المرئي)، بدون أن تعرف أي طبقة تفاصيل الأخرى.
type Handler<T> = (payload: T) => void;

export interface GameBusEvents {
  ANSWER_CORRECT: { progress: number }; // 0..1 داخل الجولة الحالية
  ANSWER_WRONG: Record<string, never>;
  ROUND_COMPLETE: { hadMistakes: boolean };
  ROUND_RESET: Record<string, never>;
}

class TypedEmitter<Events extends Record<string, any>> {
  private handlers = new Map<keyof Events, Set<Handler<any>>>();

  on<K extends keyof Events>(event: K, fn: Handler<Events[K]>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Handler<Events[K]>) {
    this.handlers.get(event)?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
  }
}

export const gameBus = new TypedEmitter<GameBusEvents>();
