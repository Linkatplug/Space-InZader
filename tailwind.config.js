/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Titres (style néon) — à réserver aux gros textes
        orbitron: ['Orbitron', 'sans-serif'],
        // Libellés du HUD et des menus : lisible en petit
        hud: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        // Chiffres : chasse fixe, ne « sautent » pas quand la valeur change
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'hud-blink': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        'hud-pop': { '0%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'hud-blink': 'hud-blink 0.6s ease-in-out infinite',
        'hud-pop': 'hud-pop 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
