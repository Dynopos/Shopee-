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
        brand: {
          red: '#9B1C1C',
          'red-dark': '#7F1D1D',
          'red-bright': '#DC2626',
          blue: '#2563EB',
          'blue-dark': '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
}

export default config
