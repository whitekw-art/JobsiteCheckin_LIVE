import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    console.log('MIDDLEWARE HIT:', {
      url: req.url,
      pathname: req.nextUrl.pathname,
      hasToken: !!req.nextauth.token,
    })
    const token = req.nextauth.token
    const rawPathname = req.nextUrl.pathname
    const pathname = rawPathname.replace(/\/$/, '')

    // Redirect to signin if not authenticated
    const publicPaths = [
      '/',
      '/auth/signin',
      '/auth/register',
      '/auth/invite',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/payments/checkout',
    ]
    const isPublicAssetPath = pathname.startsWith('/temp-photos/')

    // Always allow auth routes
if (pathname.startsWith('/auth/')) {
  return NextResponse.next()
}

if (
  !token &&
  !pathname.startsWith('/jobs/') &&
  !pathname.startsWith('/portfolio/') &&
  !pathname.startsWith('/sitemap') &&
  pathname !== '/robots.txt' &&
  !isPublicAssetPath
) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}

    // Role-based access control
    if (token) {
      const userRole = token.role

      // USER role can only access check-in
      if (userRole === 'USER' && (pathname.startsWith('/dashboard') || pathname.startsWith('/team'))) {
        return NextResponse.redirect(new URL('/check-in', req.url))
      }

      // ADMIN and OWNER can access dashboard and team
      if ((userRole === 'ADMIN' || userRole === 'OWNER') && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
  authorized: () => true,
},

  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
