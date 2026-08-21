import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from '@/components/Providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  metadataBase: new URL('https://projectcheckin.com'),
  title: 'ProjectCheckin',
  description: 'Automatic job pages and local SEO for field service businesses.',
  verification: {
    google: 'XqifA49nAacc21QeSSWjavqCfJM1v_l-1vj8vibmR2k',
  },
  icons: {
    icon: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-VF16BQQF4P"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VF16BQQF4P');
            `,
          }}
        />
      </head>
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
