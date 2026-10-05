import { useViewOnly } from '../state/viewOnly'

/**
 * زرّ وضع العرض — القفل الذي يُضغط فتصير اللوحة كلُّها للقراءة.
 *
 * وهو في الترويسة لا في الإعدادات: من يُسلّم جوّاله أو يفتح شاشةً
 * أمام لجنة يريده تحت إبهامه، لا في صفحةٍ يبحث عنها.
 */
export function ViewOnlyToggle() {
  const [viewOnly, set] = useViewOnly()

  return (
    <button
      type="button"
      className={viewOnly ? 'button button--ghost is-locked' : 'button button--ghost'}
      onClick={() => set(!viewOnly)}
      aria-pressed={viewOnly}
      title={viewOnly
        ? 'اللوحة على القراءة فقط — اضغطي لتعود الكتابة'
        : 'اقفلي اللوحة على القراءة: كل شيء يُقرأ ولا شيء يُعدَّل'}
    >
      {viewOnly ? '🔓 أعيدي الكتابة' : '🔒 اقفلي على القراءة'}
    </button>
  )
}
