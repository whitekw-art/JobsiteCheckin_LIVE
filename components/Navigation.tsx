'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!session) return null

  const userRole = session.user?.role
  const isOwner = userRole === 'OWNER'
  const isAdmin = userRole === 'ADMIN'
  const canAccessDashboard = isOwner || isAdmin

  const navLinks = [
    { href: '/check-in', label: 'Check-In', show: true },
    { href: '/my-jobs', label: 'My Jobs', show: true },
    { href: '/dashboard', label: 'Dashboard', show: canAccessDashboard },
    { href: '/dashboard/team', label: 'Team', show: canAccessDashboard },
    { href: '/reporting', label: 'Reporting & Key Metrics', show: isOwner },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex flex-col min-w-0">
            <Link href="/" className="text-xl font-bold text-gray-900 truncate">
              Jobsite Check-In
            </Link>
            {(session.user as any)?.companyName && (
              <div className="text-xs text-gray-600 truncate">
                <span>{(session.user as any).companyName}</span>
                {userRole === 'USER' && (session.user.name || session.user.email) && (
                  <span className="ml-1">— {session.user.name || session.user.email}</span>
                )}
              </div>
            )}
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop user info */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {session.user?.name || session.user?.email}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {userRole}
            </span>
            {isOwner && (
              <Link
                href="/account"
                className={`text-sm py-2 ${
                  isActive('/account')
                    ? 'text-blue-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Account
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium min-h-[44px] ${
                  isActive(link.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile user section */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center mb-3">
              <span className="text-sm font-medium text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {userRole}
              </span>
            </div>
            <div className="space-y-1">
              {isOwner && (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-3 rounded-md text-base font-medium min-h-[44px] ${
                    isActive('/account')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Account
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut()
                }}
                className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
