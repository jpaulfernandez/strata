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
        // Primary palette
        primary: {
          DEFAULT: '#2e2536',
          container: '#453b4d',
        },
        // Surface hierarchy
        surface: {
          DEFAULT: '#faf9fb',
          'container-low': '#f4f3f5',
          'container-lowest': '#ffffff',
          'container-high': '#e8e6e9',
          'container-highest': '#dcdadd',
          bright: '#e6e4e7',
        },
        // Secondary
        secondary: {
          container: '#e8dbef',
        },
        // Text colors (on-* variants)
        on: {
          primary: '#ffffff',
          secondary: '#685f70',
          surface: '#1a1c1d',
        },
        'on-surface-variant': '#4a454b',
        // Outlines
        'outline-variant': '#ccc4cc',
      },
      fontFamily: {
        display: ['var(--font-manrope)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        label: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body-md': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5' }],
        'label-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'label-sm': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        ghost: '0 12px 40px rgba(74, 69, 75, 0.06)',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        'xl': '1.5rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}

export default config