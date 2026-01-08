'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const userRole = session.user?.role
  const isOwner = userRole === 'OWNER'
  const isAdmin = userRole === 'ADMIN'
  const canAccessDashboard = isOwner || isAdmin

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Jobsite Check-In
              </Link>
              {/* Show company name (organization) when available */}
              {(session.user as any)?.companyName && (
                <div className="text-xs text-gray-600">
                  <div>{(session.user as any).companyName}</div>
                  {userRole === 'USER' && (session.user.name || session.user.email) && (
                    <div>{session.user.name || session.user.email}</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Link
                href="/check-in"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/check-in'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Check-In
              </Link>
              
              {canAccessDashboard && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              
              {canAccessDashboard && (
                <Link
                  href="/dashboard/team"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard/team'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Team
                </Link>
              )}

              {isOwner && (
                <Link
                  href="/reporting"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/reporting'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reporting &amp; Key Metrics
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {session.user?.name || session.user?.email}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {userRole}
            </span>
            {isOwner && (
              <Link
                href="/account"
                className={`text-sm ${
                  pathname === '/account'
                    ? 'text-blue-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Account
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
