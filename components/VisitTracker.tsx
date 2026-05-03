'use client'
import { useEffect } from 'react'

// يسجّل زيارة الصفحة مرة واحدة (عند التحميل)
export default function VisitTracker({ page }: { page: string }) {
  useEffect(() => {
    // منع التسجيل المتكرر في نفس الجلسة للصفحة نفسها
    const key = `dibrah_visit_${page}_${new Date().toDateString()}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page }),
    }).catch(() => {})
  }, [page])

  return null
}
