/** @type {import('tailwindcss').Config} */

// Màu đọc từ CSS variable (dạng "r g b") để đổi được theo theme / accent mà không
// cần build lại. Giá trị mặc định nằm trong src/index.css, accent do
// useApplySettings ghi đè lúc runtime.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;
const scale = (prefix) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => [s, v(`--color-${prefix}-${s}`)]),
  );

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'monospace'],
      },
      colors: {
        // ── Semantic tokens (đổi theo light/dark) ─────────────────
        canvas:  v('--canvas'),          // nền trang
        surface: {
          DEFAULT: v('--surface'),       // card, header, sidebar
          2:       v('--surface-2'),     // fill nhẹ, hover
          3:       v('--surface-3'),     // fill đậm hơn, skeleton
        },
        fg: {
          DEFAULT: v('--fg'),            // chữ chính
          2:       v('--fg-2'),          // chữ phụ
          muted:   v('--fg-muted'),      // mô tả, meta
          subtle:  v('--fg-subtle'),     // placeholder, icon mờ
        },
        line: {
          DEFAULT: v('--line'),          // border mặc định
          2:       v('--line-2'),        // border rất nhạt / divider
        },

        // ── Brand (accent đổi được trong Settings) ────────────────
        primary: scale('primary'),
        accent:  scale('accent'),

        // ── Palette cố định ───────────────────────────────────────
        code: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b1220',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgb(var(--color-primary-500) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--color-primary-500) / 0.06) 1px, transparent 1px)",
        'gradient-mesh': "radial-gradient(at 0% 0%, rgb(var(--color-primary-500) / 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgb(var(--color-accent-500) / 0.15) 0px, transparent 50%)",
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgb(var(--color-primary-500) / 0.35)',
        'glow-accent': '0 0 20px rgb(var(--color-accent-500) / 0.35)',
        'soft': '0 2px 8px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)',
        'soft-lg': '0 4px 12px rgb(15 23 42 / 0.06), 0 16px 40px rgb(15 23 42 / 0.08)',
        'card': '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 0 rgb(255 255 255 / 0.6) inset',
        'card-hover': '0 12px 32px rgb(var(--color-primary-500) / 0.14), 0 2px 8px rgb(15 23 42 / 0.06)',
        'ring-line': '0 0 0 1px rgb(var(--line) / 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // Radix popover/dropdown/tooltip
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
        },
        // Radix dialog content
        'dialog-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dialog-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--color-primary-500) / 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgb(var(--color-primary-500) / 0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-out': 'fade-out 0.15s ease-in forwards',
        'scale-in': 'scale-in 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-out': 'scale-out 0.12s ease-in forwards',
        'dialog-in': 'dialog-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dialog-out': 'dialog-out 0.14s ease-in forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
