import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Hostnames the app itself is served on. Anything else is a customer's
// CNAME'd subdomain (Website Integration Phase 2) and gets the hosted
// tenant site — fully public, never auth-gated.
function isAppHost(host: string): boolean {
  return (
    host === 'projectcheckin.com' ||
    host === 'www.projectcheckin.com' ||
    host.endsWith('.vercel.app') ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1'
  )
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const rawPathname = req.nextUrl.pathname
    const pathname = rawPathname.replace(/\/$/, '')

    // ── Customer subdomain hosting (CNAME) ──
    const host = (req.headers.get('host') || '').toLowerCase().split(':')[0]
    if (host && !isAppHost(host)) {
      const url = req.nextUrl.clone()
      if (pathname === '/robots.txt') {
        url.pathname = '/api/tenant/robots'
        url.search = `?host=${host}`
      } else if (pathname === '/sitemap.xml') {
        url.pathname = '/api/tenant/sitemap'
        url.search = `?host=${host}`
      } else if (pathname === '' || pathname === '/') {
        url.pathname = `/tenant-site/${host}`
        url.search = ''
      } else {
        // Single-page site — send any other path back to its root
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.rewrite(url)
    }

    // Never serve the tenant route on the app's own domain (duplicate content)
    if (pathname.startsWith('/tenant-site')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect to signin if not authenticated
    const publicPaths = [
      '/',
      '/auth/signin',
      '/auth/register',
      '/auth/invite',
      '/auth/forgot-password',
      '/auth/reset-password',
      // Confirmation links are opened from an inbox, often on a device that is
      // not signed in. The token is the proof of ownership, so gating this on a
      // session would block the ordinary case.
      '/auth/verify-email',
      '/payments/checkout',
    ]
    const isPublicAssetPath = pathname.startsWith('/temp-photos/') ||
      pathname.startsWith('/widget.') || // embed widget script — loaded by customer websites
      /\.(png|jpg|jpeg|svg|ico|webp|gif)$/i.test(pathname)

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
  !pathname.startsWith('/features/') &&
  !pathname.startsWith('/blog') &&
  !pathname.startsWith('/mockups/') &&
  !pathname.startsWith('/sitemap') &&
  pathname !== '/robots.txt' &&
  pathname !== '/llms.txt' &&
  pathname !== '/pricing' &&
  pathname !== '/privacy' &&
  pathname !== '/terms' &&
  pathname !== '/' &&
  pathname !== '' &&
  !pathname.startsWith('/api/waitlist') &&
  !pathname.startsWith('/payments') &&
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
      !pathname.startsWith('/subscribe') &&
      !pathname.startsWith('/pricing') &&
      !pathname.startsWith('/payments') &&
      !pathname.startsWith('/auth/') &&
      pathname !== '/' &&
      pathname !== ''
    ) {
      return NextResponse.redirect(new URL('/subscribe', req.url))
    }

    // Onboarding gate — if the owner/admin hasn't completed onboarding,
    // keep them on /dashboard (where the modal lives). Allow API calls through
    // so the onboarding PATCH can complete.
    // One exception: the website-integration step's "Set this up in Account →
    // Connections" link (OnbSetupLink) opens /account?tab=connections in a new
    // tab. Without this exemption the gate bounced that tab back to /dashboard,
    // so the customer saw a second copy of the onboarding modal instead of the
    // connect form. Scoped to the Connections tab only, so every other page
    // stays gated until onboarding is done.
    const isOnboardingConnectionsLink =
      pathname === '/account' && req.nextUrl.searchParams.get('tab') === 'connections'
    // Help guides are read-only and are linked from onboarding steps (opened
    // in a new tab), so they stay reachable while Account Setup is unfinished.
    const isHelpGuide = pathname.startsWith('/help/guides/')
    if (
      token &&
      token.onboardingComplete === false &&
      token.role !== 'SUPER_ADMIN' &&
      !isOnboardingConnectionsLink &&
      !isHelpGuide &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/subscribe') &&
      !pathname.startsWith('/pricing') &&
      !pathname.startsWith('/payments') &&
      !pathname.startsWith('/auth/') &&
      pathname !== '/' &&
      pathname !== ''
    ) {
      // The Google Business Profile connect step in onboarding sends the
      // customer to Google, whose callback returns to /account?gbp=<outcome>.
      // That outcome is carried over to /dashboard, where the onboarding modal
      // reads it, so a cancelled or failed connection still gets explained.
      const dest = new URL('/dashboard', req.url)
      const gbpOutcome = pathname === '/account' ? req.nextUrl.searchParams.get('gbp') : null
      if (gbpOutcome) dest.searchParams.set('gbp', gbpOutcome)
      return NextResponse.redirect(dest)
    }

    // Role-based access control
    if (token) {
      const userRole = token.role

      // SUPER_ADMIN routes — return 404 so the route's existence isn't revealed
      if (pathname.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
        return new NextResponse(null, { status: 404 })
      }

      // USER role can only access check-in and my-jobs
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
