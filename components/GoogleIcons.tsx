'use client'

/** Google's "G" mark and wordmark, shared by every Google connect surface. */

export const GoogleGIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
    <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
    <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.3 44 24 44z" fill="#4CAF50"/>
    <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.1 35.6 44 30.2 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
  </svg>
)

// Full Google wordmark for the connect button
export const GoogleWordmark = () => (
  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>
    <span style={{ color: '#4285F4' }}>G</span>
    <span style={{ color: '#EA4335' }}>o</span>
    <span style={{ color: '#FBBC05' }}>o</span>
    <span style={{ color: '#4285F4' }}>g</span>
    <span style={{ color: '#34A853' }}>l</span>
    <span style={{ color: '#EA4335' }}>e</span>
  </span>
)
