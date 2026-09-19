import { useCallback, useMemo, useState } from 'react'

import { ConfirmDialog } from './components/ConfirmDialog'
import { EmptyState } from './components/EmptyState'
import { EntryForm } from './components/EntryForm'
import { EntryTable } from './components/EntryTable'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { StatCards } from './components/StatCards'
import { ToastStack } from './components/ToastStack'
import { Toolbar } from './components/Toolbar'
import { useEntries } from './hooks/useEntries'
import { useTheme } from './hooks/useTheme'
import { useToasts } from './hooks/useToasts'
import { collectCategories, DEFAULT_QUERY, queryEntries, type QueryOptions } from './lib/filter'
import { formatCount } from './lib/format'
import { computeStats } from './lib/stats'
import type { Entry, EntryDraft } from './types'

type Dialog =
  | { kind: 'none' }
  | { kind: 'form'; entry: Entry | null }
  | { kind: 'delete'; entry: Entry }

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
}

export default function App() {
  const { entries, mode, loading, error, refresh, create, update, remove } = useEntries()
  const { theme, toggle } = useTheme()
  const { toasts, push, dismiss } = useToasts()

  const [query, setQuery] = useState<QueryOptions>(DEFAULT_QUERY)
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => computeStats(entries), [entries])
  const categories = useMemo(() => collectCategories(entries), [entries])
  const visible = useMemo(() => queryEntries(entries, query), [entries, query])

  const patchQuery = useCallback((patch: Partial<QueryOptions>) => {
    setQuery((prev) => ({ ...prev, ...patch }))
  }, [])

  const closeDialog = useCallback(() => setDialog({ kind: 'none' }), [])

  const handleSubmit = useCallback(
    async (draft: EntryDraft) => {
      if (dialog.kind !== 'form') return
      const editing = dialog.entry
      setSaving(true)
      try {
        if (editing) {
          await update(editing.id, draft)
          push('success', 'تم حفظ التعديلات')
        } else {
          await create(draft)
          push('success', 'تمت إضافة السجل')
        }
        setDialog({ kind: 'none' })
      } catch (cause) {
        push('error', `تعذّر الحفظ: ${messageOf(cause)}`)
      } finally {
        setSaving(false)
      }
    },
    [dialog, create, update, push],
  )

  const handleDelete = useCallback(async () => {
    if (dialog.kind !== 'delete') return
    const target = dialog.entry
    setBusyId(target.id)
    try {
      await remove(target.id)
      push('success', `تم حذف «${target.title}»`)
      setDialog({ kind: 'none' })
    } catch (cause) {
      push('error', `تعذّر الحذف: ${messageOf(cause)}`)
    } finally {
      setBusyId(null)
    }
  }, [dialog, remove, push])

  const hasEntries = entries.length > 0

  return (
    <div className="app">
      <Header
        mode={mode}
        theme={theme}
        onToggleTheme={toggle}
        onCreate={() => setDialog({ kind: 'form', entry: null })}
      />

      <main className="main">
        {error && (
          <div className="alert alert--error" role="alert">
            <span>تعذّر تحميل البيانات: {error}</span>
            <button type="button" className="button button--small" onClick={() => void refresh()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        <StatCards stats={stats} />

        <section className="panel" aria-label="السجلات">
          <div className="panel__head">
            <h2 className="section-pill">السجــلات</h2>
          </div>

          <Toolbar
            query={query}
            categories={categories}
            resultCount={visible.length}
            onChange={patchQuery}
            onReset={() => setQuery(DEFAULT_QUERY)}
          />

          {loading ? (
            <div className="empty">
              <p className="empty__title">جارٍ التحميل…</p>
            </div>
          ) : visible.length > 0 ? (
            <EntryTable
              entries={visible}
              busyId={busyId}
              onEdit={(entry) => setDialog({ kind: 'form', entry })}
              onDelete={(entry) => setDialog({ kind: 'delete', entry })}
            />
          ) : hasEntries ? (
            <EmptyState
              title="لا توجد نتائج مطابقة"
              description="جرّب تعديل كلمات البحث أو إزالة التصفية."
              actionLabel="إزالة التصفية"
              onAction={() => setQuery(DEFAULT_QUERY)}
            />
          ) : (
            <EmptyState
              title="اللوحة فارغة"
              description="ابدأ بإضافة أول سجل لتظهر الإحصاءات والجداول."
              actionLabel="إضافة سجل"
              onAction={() => setDialog({ kind: 'form', entry: null })}
            />
          )}
        </section>

        {stats.topCategory && (
          <p className="footnote">
            أكثر تصنيف تكرارًا: <strong>{stats.topCategory.name}</strong> (
            {formatCount(stats.topCategory.count)} سجل)
          </p>
        )}
      </main>

      {dialog.kind === 'form' && (
        <EntryForm
          entry={dialog.entry}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={closeDialog}
        />
      )}

      {dialog.kind === 'delete' && (
        <ConfirmDialog
          title="تأكيد الحذف"
          message={`سيُحذف السجل «${dialog.entry.title}» نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف نهائيًا"
          busy={busyId === dialog.entry.id}
          onConfirm={handleDelete}
          onCancel={closeDialog}
        />
      )}

      <Footer />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
