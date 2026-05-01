import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// المسارات المحمية - تحتاج تسجيل دخول
const PROTECTED_PATHS = ['/book', '/quick-pay', '/dashboard', '/my-bookings']

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get('dibrah_session')?.value
  if (!session) {
    // لا توجد جلسة - حوّل لـ /auth مع حفظ الوجهة
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/book/:path*', '/quick-pay/:path*', '/dashboard/:path*', '/my-bookings/:path*'],
}
