/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        panel: '#1E293B',
        line: '#334155',
        accent: '#3B82F6',
        mist: '#CBD5E1',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 60px rgba(59, 130, 246, 0.16)',
      },
      backgroundImage: {
        aurora:
          'radial-gradient(circle at top, rgba(59,130,246,0.28), transparent 34%), radial-gradient(circle at 80% 20%, rgba(14,165,233,0.16), transparent 26%), linear-gradient(180deg, #0F172A 0%, #020617 100%)',
      },
    },
  },
  plugins: [],
};
