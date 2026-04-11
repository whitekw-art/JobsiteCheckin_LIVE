import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
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

    // Registration gating — redirect /auth/register to homepage when registration is closed.
    // Invite links (/auth/invite/...) always bypass this gate.
    // Toggle via REGISTRATION_OPEN env var in Vercel (set to 'true' to open registration).
    if (
      pathname === '/auth/register' &&
      process.env.REGISTRATION_OPEN !== 'true'
    ) {
      return NextResponse.redirect(new URL('/auth/register-closed', req.url))
    }

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
  pathname !== '/pricing' &&
  pathname !== '/privacy' &&
  pathname !== '/terms' &&
  pathname !== '/' &&
  pathname !== '' &&
  !pathname.startsWith('/api/waitlist') &&
  !isPublicAssetPath
) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}

    // Plan selection gate — OWNER who signed in without ever choosing a plan
    // gets sent to /pricing regardless of how they arrived (e.g. direct sign-in)
    if (
      token &&
      !token.planTier &&
      token.onboardingComplete === false &&
      token.role === 'OWNER' &&
      !pathname.startsWith('/pricing') &&
      !pathname.startsWith('/payments') &&
      !pathname.startsWith('/auth/') &&
      pathname !== '/' &&
      pathname !== ''
    ) {
      return NextResponse.redirect(new URL('/pricing', req.url))
    }

    // Onboarding gate — if the owner/admin hasn't completed onboarding,
    // keep them on /dashboard (where the modal lives). Allow API calls through
    // so the onboarding PATCH can complete.
    if (
      token &&
      token.onboardingComplete === false &&
      token.role !== 'SUPER_ADMIN' &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/pricing') &&
      !pathname.startsWith('/payments') &&

      !pathname.startsWith('/auth/') &&
      pathname !== '/' &&
      pathname !== ''
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based access control
    if (token) {
      const userRole = token.role

      // SUPER_ADMIN routes — only SUPER_ADMIN can access /admin
      if (pathname.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

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
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
