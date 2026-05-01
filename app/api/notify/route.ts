import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      subscriber_name, subscriber_phone, subscriber_email,
      subscriber_id, subscriber_nationality, subscriber_address,
      beneficiary_name, beneficiary_age, beneficiary_relation,
      emergency_phone, start_date, start_time,
      package: pkg, trackId,
    } = body

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; direction: rtl; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; }
  .header { background: #5f6157; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 1.4rem; }
  .header p { margin: 4px 0 0; opacity: .7; font-size: .85rem; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: .75rem; font-weight: bold; letter-spacing: .1em; text-transform: uppercase; color: #777C6D; margin-bottom: 10px; border-bottom: 1.5px solid #e8e8e0; padding-bottom: 6px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: .9rem; }
  .label { color: #888; }
  .value { font-weight: bold; color: #333; }
  .track { background: #f0f4ec; border-radius: 8px; padding: 12px 16px; text-align: center; margin-top: 20px; font-size: .85rem; color: #5f6157; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <h1>🌿 طلب حجز جديد — دِبرة</h1>
    <p>تم استلام طلب حجز جديد بنجاح</p>
  </div>

  <div class="section">
    <div class="section-title">معلومات المشترك</div>
    <div class="row"><span class="label">الاسم</span><span class="value">${subscriber_name || '—'}</span></div>
    <div class="row"><span class="label">رقم الهوية</span><span class="value">${subscriber_id || '—'}</span></div>
    <div class="row"><span class="label">الجنسية</span><span class="value">${subscriber_nationality || '—'}</span></div>
    <div class="row"><span class="label">الجوال</span><span class="value">${subscriber_phone || '—'}</span></div>
    <div class="row"><span class="label">البريد</span><span class="value">${subscriber_email || '—'}</span></div>
    <div class="row"><span class="label">العنوان</span><span class="value">${subscriber_address || '—'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">معلومات المستفيد</div>
    <div class="row"><span class="label">الاسم</span><span class="value">${beneficiary_name || '—'}</span></div>
    <div class="row"><span class="label">العمر</span><span class="value">${beneficiary_age || '—'}</span></div>
    <div class="row"><span class="label">صلة القرابة</span><span class="value">${beneficiary_relation || '—'}</span></div>
    <div class="row"><span class="label">رقم الطوارئ</span><span class="value">${emergency_phone || '—'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">تفاصيل الباقة</div>
    <div class="row"><span class="label">الباقة</span><span class="value">${pkg || '—'}</span></div>
    <div class="row"><span class="label">تاريخ البدء</span><span class="value">${start_date || '—'}</span></div>
    <div class="row"><span class="label">ساعة البدء</span><span class="value">${start_time || '—'}</span></div>
  </div>

  ${trackId ? `<div class="track">رقم العملية: <strong>${trackId}</strong></div>` : ''}
</div>
</body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'دِبرة <noreply@dibrahcare.com>',
        to: ['debrhalaelh@gmail.com'],
        subject: `📋 طلب حجز جديد — ${subscriber_name}`,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(data))

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Email error:', e?.message || e)
    return NextResponse.json({ success: false, message: e?.message }, { status: 500 })
  }
}
