import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const users = usersData?.users || []

    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_id')

    const bookedIds = new Set((bookings || []).map((b: any) => b.customer_id).filter(Boolean))

    const notBooked = users.filter((u: any) => {
      if (!u.email) return false
      if (bookedIds.has(u.id)) return false
      const diff = Date.now() - new Date(u.created_at).getTime()
      return diff > 24 * 60 * 60 * 1000
    })

    let sent = 0
    for (const user of notBooked) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'دِبرة <noreply@dibrahcare.com>',
          to: [user.email!],
          subject: 'أكمل حجزك مع دِبرة 🌿',
          html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #B7B89F; margin: 0; padding: 24px; direction: rtl; }
  .card { background: white; border-radius: 16px; padding: 48px 40px; max-width: 480px; margin: 0 auto; text-align: center; border: 1px solid rgba(95,97,87,.15); }
  .brand { font-size: 2.2rem; font-weight: 900; color: #777C6D; display: block; margin-bottom: 24px; }
  .title { font-size: 1.3rem; font-weight: 900; color: #5f6157; margin-bottom: 20px; }
  .body { font-size: .95rem; color: #8a8e80; line-height: 2; margin-bottom: 28px; text-align: right; }
  .btn { display: inline-block; padding: 14px 40px; background: #5f6157; color: #F6F0D7; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1rem; margin-bottom: 12px; }
  .link { display: block; font-size: .82rem; color: #8a8e80; text-decoration: none; margin-top: 4px; }
  .footer { margin-top: 28px; font-size: .75rem; color: rgba(95,97,87,.4); border-top: 1px solid rgba(95,97,87,.1); padding-top: 16px; }
</style></head>
<body>
<div class="card">
  <span class="brand">دِبرة تدبرك 🌿</span>
  <h1 class="title">عميلنا العزيز</h1>
  <p class="body">
    لاحظنا أنك دخلت ولم تكمل حجزك بعد — عسى المانع خير!<br/><br/>
    نحن هنا متى احتجتنا، بأيدٍ سعودية موثوقة تهتم بمن تحب.<br/><br/>
    خذ وقتك، ومتى كنت جاهزاً نحن هنا لك. 🤍
  </p>
  <a href="https://dibrahcare.com/book" class="btn">احجز الآن</a>
  <a href="https://dibrahcare.com/book" class="link">https://dibrahcare.com/book</a>
  <div class="footer">إذا كنت لا ترغب في استلام هذه الرسائل يمكنك تجاهلها.</div>
</div>
</body></html>`,
        }),
      })
      if (res.ok) sent++
    }

    return NextResponse.json({ success: true, sent, total: notBooked.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
