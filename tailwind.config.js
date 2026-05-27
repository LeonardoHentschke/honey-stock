/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ─── Paleta Honey (âmbar) ────────────────────────────────────────────
      colors: {
        honey: {
          50:  '#FEF9EC',
          100: '#FCEFC8',
          200: '#F9DE91',
          300: '#F5C859',
          400: '#F0B12C',
          500: '#E89B12', // ★ cor primária
          600: '#C47C0A',
          700: '#9B5F0B',
          800: '#7A4A0F',
          900: '#5A3708',
        },
        // ─── Paleta Wood (madeira) ──────────────────────────────────────────
        wood: {
          50:  '#FAF6F1',
          100: '#F2E8D9',
          200: '#E3D0AE',
          300: '#C9AC75',
          400: '#A8854A',
          500: '#7A5A2A',
          700: '#5A3A1A',
        },
        // ─── Paleta Ink (neutros quentes) ───────────────────────────────────
        ink: {
          50:  '#F5F1EA', // ★ background app
          100: '#E7E2D9', // borders, dividers
          300: '#A89E91', // placeholder, disabled
          500: '#6B6258', // texto secundário, labels
          700: '#3B342B', // texto em cards
          900: '#1F1B16', // ★ texto principal
        },
        // ─── Paleta Wood (extended) ─────────────────────────────────────────
        // wood.700 adicionado para ícones reseller
        // (wood.500 já existia; outros tons abaixo)

        // ─── Semânticas ──────────────────────────────────────────────────────
        success: '#2E7D32',
        warning: '#C77700',
        danger:  '#B3261E',
        info:    '#1565C0',
        // ─── Tints semânticos (backgrounds suaves) ───────────────────────────
        'success-tint': '#E8F5E9',
        'warning-tint': '#FFF3E0',
        'danger-tint':  '#FFEBEE',
        'info-tint':    '#E3F2FD',
      },

      // ─── Espaçamentos (sistema 4px) ──────────────────────────────────────
      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
      },

      // ─── Border radius ───────────────────────────────────────────────────
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '20px',
        full: '9999px',
      },

      // ─── Tipografia ──────────────────────────────────────────────────────
      fontSize: {
        display: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h1:      ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h2:      ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h3:      ['17px', { lineHeight: '24px', fontWeight: '600' }],
        body:    ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-strong': ['15px', { lineHeight: '22px', fontWeight: '600' }],
        label:   ['13px', { lineHeight: '18px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        mono:    ['14px', { lineHeight: '20px', fontWeight: '500' }],
      },

      // ─── Sombras ─────────────────────────────────────────────────────────
      boxShadow: {
        sm: '0 1px 2px rgba(31, 27, 22, 0.06)',
        md: '0 4px 12px rgba(31, 27, 22, 0.08)',
        lg: '0 12px 32px rgba(31, 27, 22, 0.12)',
      },

      fontFamily: {
        sans: ['Inter_400Regular', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter_500Medium', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
