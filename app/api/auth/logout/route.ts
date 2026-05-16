import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('dibrah_session')
  return NextResponse.json({ success: true })
}
