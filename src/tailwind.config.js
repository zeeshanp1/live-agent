/* Tailwind Play CDN configuration. Loaded as a classic script right after the CDN script. */
/* global tailwind */
// Guard: if the CDN is blocked or offline the app still runs, just unstyled.
if (typeof tailwind !== 'undefined') tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        chassis: '#0B0C0E',
        surface: '#14161A',
        surfaceHover: '#1A1D23',
        hairline: '#2B2F36',
        ink: '#F3F4F6',
        muted: '#8B929E',
        alert: '#EF4444',
      },
    },
  },
};
