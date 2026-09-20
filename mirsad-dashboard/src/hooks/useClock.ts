import { useEffect, useState } from 'react'

/** ساعة حيّة تتحدّث كل ثانية دون إعادة تحميل الصفحة. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}
