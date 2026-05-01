import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false })
  }

  const session = verifyAdminSessionToken(token)
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
  })
}
