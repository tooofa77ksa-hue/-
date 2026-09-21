import { useSystem } from '../state/useSystem'

/**
 * شريط يقول للإدارة أين تُحفظ بياناتها فعلًا الآن.
 *
 * لا يُخفى شيء هنا: إن كان الحفظ في متصفّح واحد قيل ذلك صراحةً، وإن
 * أخفق الحفظ ظهر نصّ الخطأ كما هو. الأسوأ من خطأ ظاهر خطأٌ صامت
 * يوهم الإدارة أن عملها حُفظ وهو لم يصل.
 */
export function SyncBanner() {
  const { mode, status, saving, syncError, reload } = useSystem()

  if (mode === 'local') {
    return (
      <div className="sync sync--local" role="status">
        <span className="sync__dot" aria-hidden="true" />
        <span>
          <strong>وضع محلي:</strong> البيانات محفوظة في هذا المتصفّح وحده — لا تُشارَك مع جهاز
          آخر ولا تُحفظ خارجه. احفظي نسخة احتياطية من «الإعدادات» بانتظام.
        </span>
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="sync sync--error" role="alert">
        <span className="sync__dot" aria-hidden="true" />
        <span><strong>تعذّر الحفظ في قاعدة البيانات:</strong> {syncError}</span>
        <button type="button" className="button button--ghost button--small" onClick={() => void reload()}>
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="sync sync--warn" role="status">
        <span className="sync__dot" aria-hidden="true" />
        <span>
          قاعدة البيانات متصلة لكنها <strong>فارغة</strong>. ما تشاهدينه الآن بيانات المصدر
          المستوردة، ولم يُكتب منها شيء بعد. ارفعيها من «الإعدادات ← رفع البيانات».
        </span>
      </div>
    )
  }

  if (saving > 0) {
    return (
      <div className="sync sync--busy" role="status">
        <span className="sync__dot" aria-hidden="true" />
        <span>جارٍ الحفظ في قاعدة البيانات… لا تُغلقي الصفحة.</span>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div className="sync sync--ok" role="status">
        <span className="sync__dot" aria-hidden="true" />
        <span>محفوظ في قاعدة البيانات.</span>
      </div>
    )
  }

  return (
    <div className="sync sync--busy" role="status">
      <span className="sync__dot" aria-hidden="true" />
      <span>جارٍ قراءة البيانات…</span>
    </div>
  )
}
