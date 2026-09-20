import { useEffect, useRef, useState } from 'react'

/** مسار ملف السلام الملكي داخل المشروع. */
const ANTHEM_SRC = '/audio/national-anthem.mp3'

type Status = 'checking' | 'missing' | 'ready'

/**
 * مشغّل السلام الملكي — نسخة صوتية واحدة فقط، فلا يحدث تشغيل مزدوج.
 * إن لم يكن الملف موجودًا في المشروع يُعرَض ذلك صراحةً بدل تشغيل بديل.
 */
export function AnthemPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<Status>('checking')
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [blocked, setBlocked] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(ANTHEM_SRC, { method: 'HEAD' })
      .then((res) => {
        // خادم الصفحة الواحدة يعيد index.html بحالة ٢٠٠ لأي مسار غير موجود،
        // فلا يكفي نجاح الطلب — نتأكد أن المحتوى ملف صوت فعلًا.
        const type = res.headers.get('content-type') ?? ''
        const ok = res.ok && type.startsWith('audio')
        if (alive) setStatus(ok ? 'ready' : 'missing')
      })
      .catch(() => alive && setStatus('missing'))
    return () => {
      alive = false
    }
  }, [])

  // نسخة Audio واحدة تُنشأ مرة واحدة ويُتخلَّص منها عند الخروج
  useEffect(() => {
    if (status !== 'ready') return undefined
    const audio = new Audio(ANTHEM_SRC)
    audio.preload = 'none'
    audioRef.current = audio

    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audioRef.current = null
    }
  }, [status])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = muted
    }
  }, [volume, muted])

  if (status === 'checking') return null

  if (status === 'missing') {
    return (
      <span className="anthem anthem--missing no-print" title="لم يُرفع ملف السلام الملكي بعد">
        السلام الملكي: الملف غير مرفوع
      </span>
    )
  }

  async function play() {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setPlaying(true)
      setBlocked(false)
    } catch {
      // المتصفح منع التشغيل التلقائي — نطلب تفاعلًا صريحًا بدل الالتفاف عليه
      setBlocked(true)
      setPlaying(false)
    }
  }

  function pause() {
    audioRef.current?.pause()
    setPlaying(false)
  }

  function stop() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
  }

  return (
    <div className={open ? 'anthem is-open no-print' : 'anthem no-print'}>
      <button
        type="button"
        className="button button--ghost button--icon"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="مشغّل السلام الملكي"
        title="السلام الملكي"
      >
        ♪
      </button>

      {open && (
        <div className="anthem__panel" role="group" aria-label="التحكم بالسلام الملكي">
          <span className="anthem__label">السلام الملكي</span>
          <div className="anthem__controls">
            <button type="button" className="button button--small" onClick={playing ? pause : play}>
              {playing ? 'إيقاف مؤقت' : 'تشغيل'}
            </button>
            <button type="button" className="button button--small" onClick={stop}>
              إيقاف
            </button>
            <button
              type="button"
              className="button button--small"
              onClick={() => setMuted((v) => !v)}
              aria-pressed={muted}
            >
              {muted ? 'إلغاء الكتم' : 'كتم'}
            </button>
          </div>
          <label className="anthem__volume">
            مستوى الصوت
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
          {blocked && (
            <p className="anthem__blocked">
              منع المتصفح التشغيل التلقائي. اضغطي «تشغيل» لبدء السلام الملكي.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
