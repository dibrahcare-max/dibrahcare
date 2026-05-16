'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHomePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/supporters/admin/donors')
  }, [router])
  return (
    <div style={{ padding: 20, color: '#2D4A1E' }}>جاري التحويل...</div>
  )
}
