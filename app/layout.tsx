import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from '@/components/Providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Jobsite Check-In',
  description: 'Mobile-friendly jobsite check-in application',
   verification: {
    google: 'XqifA49nAacc21QeSSWjavqCfJM1v_l-1vj8vibmR2k',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
