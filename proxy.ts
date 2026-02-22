import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isAuthPage = nextUrl.pathname.startsWith('/login')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuth) return NextResponse.next()

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/reports', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Role-based access control
  // /master/users is manager-only; redirect sales to /reports
  if (nextUrl.pathname.startsWith('/master/users') && session.user.role === 'sales') {
    return NextResponse.redirect(new URL('/reports', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
