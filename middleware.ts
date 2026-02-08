import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

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

    if (
      !token &&
      !publicPaths.some(p => pathname.startsWith(p)) &&
      !pathname.startsWith('/jobs/') &&
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
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to signin page, home page, and public routes
        if (
          [
            '/auth/signin',
            '/',
            '/auth/register',
            '/auth/invite',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/payments/checkout',
          ].includes(pathname) ||
          pathname.startsWith('/jobs/') ||
          pathname.startsWith('/temp-photos/')
        ) {
          return true
        }
        
        // Require authentication for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
