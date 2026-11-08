/* =====================================================================
   AllSyncPro — tailwind.config.js
   Dual-mode: works with the Tailwind Play CDN (loaded as a plain <script>
   it assigns window.tailwind.config) AND with the Tailwind CLI
   (module.exports). Theme colors map to CSS variables defined in
   assets/css/main.css so the dark/light toggle is a single class switch
   on <html> (theme-dark default / theme-light) — with <alpha-value>
   support so utilities like bg-ink/70 keep working.
   ===================================================================== */
const aspConfig = {
  content: [
    './**/*.html',
    './assets/js/*.js',
  ],
  darkMode: ['class', '.theme-dark'],
  theme: {
    extend: {
      colors: {
        /* Neutrals — driven by CSS variables (theme-aware) */
        ink:      'rgb(var(--c-ink) / <alpha-value>)',
        surface:  'rgb(var(--c-surface) / <alpha-value>)',
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        mist:     'rgb(var(--c-mist) / <alpha-value>)',
        chalk:    'rgb(var(--c-chalk) / <alpha-value>)',
        /* Hairline — raw rgba var, used without opacity modifiers */
        line:     'var(--c-line)',
        'line-strong': 'var(--c-line-strong)',
        /* Accents — identical in both themes */
        violet:   'rgb(var(--c-violet) / <alpha-value>)',
        cyan:     'rgb(var(--c-cyan) / <alpha-value>)',
        ember:    'rgb(var(--c-ember) / <alpha-value>)',
        /* Accessible accent-for-text (lightened on dark, deepened on light) */
        plum:     'rgb(var(--c-plum) / <alpha-value>)',
      },

      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['"Satoshi"', '"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      /* Fluid type scale — truly responsive, not stepped */
      fontSize: {
        'display-2xl': ['clamp(3rem, 8.5vw, 7.25rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-xl':  ['clamp(2.6rem, 6.5vw, 5.25rem)', { lineHeight: '0.97', letterSpacing: '-0.015em' }],
        'display-lg':  ['clamp(2.1rem, 4.6vw, 3.6rem)',  { lineHeight: '1.02', letterSpacing: '-0.01em' }],
        'display-md':  ['clamp(1.6rem, 3.2vw, 2.4rem)',  { lineHeight: '1.08' }],
        'display-sm':  ['clamp(1.3rem, 2vw, 1.6rem)',    { lineHeight: '1.12' }],
      },

      spacing: {
        'section': 'clamp(4.5rem, 9vw, 8.5rem)',
        'gutter':  'clamp(1.25rem, 4vw, 4rem)',
        '18': '4.5rem',
        '88': '22rem',
      },

      screens: {
        '3xl': '1920px',
      },

      maxWidth: {
        '18': '26rem',
        '44': '44rem',
        '52': '52rem',
        'content': '72rem',
      },

      transitionTimingFunction: {
        engineered: 'cubic-bezier(0.16, 1, 0.3, 1)',
        swift: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        '450': '450ms',
        '650': '650ms',
        '850': '850ms',
      },

      boxShadow: {
        'glow-violet': '0 0 90px -18px rgb(var(--c-violet) / 0.45)',
        'glow-cyan':   '0 0 90px -18px rgb(var(--c-cyan) / 0.40)',
        'inner-top':   'inset 0 1px 0 0 rgb(var(--c-chalk) / 0.06)',
        'card':        '0 1px 0 0 rgb(var(--c-chalk) / 0.04), 0 24px 48px -32px rgb(0 0 0 / 0.55)',
      },

      backgroundImage: {
        'accent-grad': 'linear-gradient(100deg, rgb(var(--c-violet)), rgb(var(--c-cyan)))',
      },

      zIndex: {
        'grain': '90',
        'header': '50',
        'mega': '48',
        'overlay': '60',
        'cursor': '200',
        'toast': '210',
        'loader': '300',
      },

      keyframes: {
        // (keyframes live in assets/css/main.css — see README; utilities below
        // are kept minimal so CDN and CLI builds stay byte-consistent)
      },
    },
  },
  plugins: [],
};

/* --- Export for both runtimes --------------------------------------- */
if (typeof window !== 'undefined' && typeof window.tailwind !== 'undefined') {
  window.tailwind.config = aspConfig; // Play CDN
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = aspConfig; // Tailwind CLI
}
