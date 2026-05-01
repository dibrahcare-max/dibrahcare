'use client'
import { useState } from 'react'

export default function PayTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const test = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: 'test_1',
          service: 'اختبار دفع 1 ريال',
          subscriber_phone: '0555555555',
          subscriber_name: 'Test User',
        }),
      })
      const data = await res.json()
      setResult({ httpStatus: res.status, ...data })
      if (data.success && data.url) {
        if (confirm(`نجح ✓\n\nالرابط:\n${data.url}\n\nاضغط OK للتوجه لصفحة الدفع`)) {
          window.location.href = data.url
        }
      }
    } catch (e: any) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ direction: 'rtl', maxWidth: 700, margin: '40px auto', padding: 20, fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>🔧 Neoleap Payment Test</h1>
      <button onClick={test} disabled={loading} style={{
        padding: '14px 40px', background: '#5f6157', color: 'white', border: 'none',
        borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 700,
      }}>
        {loading ? 'جاري الاختبار...' : 'اختبار الدفع (1 ريال فقط)'}
      </button>

      {result && (
        <pre style={{
          marginTop: 24, background: '#1a1a1a', color: '#0f0', padding: 20,
          borderRadius: 10, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          lineHeight: 1.7, overflowX: 'auto',
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      <div style={{ marginTop: 20, fontSize: 13, color: '#666' }}>
        هذه صفحة تشخيص — تعرض كل تفاصيل الاتصال بالبوابة.
      </div>
    </div>
  )
}
