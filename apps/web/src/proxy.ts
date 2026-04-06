import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('sb-access-token')?.value
    ?? request.cookies.get('supabase-auth-token')?.value

  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/drivers') || pathname.startsWith('/campaigns')
  const isLoginPage = pathname === '/login'

  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/drivers/:path*', '/campaigns/:path*', '/login'],
}
