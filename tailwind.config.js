/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-hover': 'var(--surface-hover)',
        'muted-foreground': 'var(--muted-foreground)',
        'dim-foreground': 'var(--dim-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-foreground': 'var(--primary-foreground)',
        'primary-subtle': 'var(--primary-subtle)',
        'primary-border': 'var(--primary-border)',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        }
      },
      borderRadius: {
        control: '0.75rem',
        card: '1rem',
        panel: '1.5rem',
      },
      boxShadow: {
        popover: 'var(--shadow-popover)',
      },
      fontSize: {
        caption: '11px',
        small: '12px',
        body: '13px',
        title: '16px',
        display: '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
