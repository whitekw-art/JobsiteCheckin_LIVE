import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — muted sage-forest green, softened v5 palette
        primary: {
          50: '#f4f7f5',
          100: '#e0e9e3',
          200: '#c2d4c8',
          300: '#9ab8a4',
          400: '#6f9a7d',
          500: '#4f7f62',
          600: '#3d664f',
          700: '#335442',
          800: '#2b4437',
          900: '#25392f',
          950: '#1a2b22',
        },
        // Accent — warm gold for CTAs and highlights (softened from neon amber)
        accent: {
          50: '#fdfaf3',
          100: '#faf0d5',
          200: '#f4dfab',
          300: '#ecc978',
          400: '#e8a83a',
          500: '#d4912a',
          600: '#b87420',
          700: '#975a1a',
          800: '#7b4716',
          900: '#653b14',
          950: '#3a200a',
        },
        // Warm neutrals — softer than pure gray, approachable for non-tech users
        surface: {
          50: '#fafaf8',
          100: '#f5f4f1',
          200: '#e8e6e1',
          300: '#d5d2cb',
          400: '#b5b1a7',
          500: '#9a9588',
          600: '#7d786c',
          700: '#66625a',
          800: '#55524b',
          900: '#494641',
          950: '#282622',
        },
      },
      fontFamily: {
        // DM Sans — geometric, clean, high readability at all sizes
        // Perfect for blue-collar audience: friendly but professional
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        // Bricolage Grotesque — distinctive display font with character
        // Slightly industrial feel, great for headings
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Larger base for readability (non-tech users, often older)
        'base': ['1rem', { lineHeight: '1.625' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.6' }],       // 18px
        'xl': ['1.25rem', { lineHeight: '1.5' }],        // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '1.3' }],      // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],       // 36px
        '5xl': ['3rem', { lineHeight: '1.1' }],          // 48px
      },
      borderRadius: {
        'card': '0.75rem',   // 12px — slightly larger than default for friendlier feel
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
export default config
