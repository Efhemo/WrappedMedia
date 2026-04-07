import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth protection is handled client-side by AuthProvider (Supabase JS v2
// stores sessions in localStorage, not cookies, so middleware can't read them).
// This proxy only handles the root redirect.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
