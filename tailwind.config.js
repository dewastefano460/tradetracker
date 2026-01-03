/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',      // Blue 600
                'primary-dark': '#1e40af', // Blue 800
                'primary-light': '#dbeafe', // Blue 100

                background: {
                    DEFAULT: '#f8fafc', // Slate 50
                    dark: '#0f172a',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    dark: '#1e293b',
                },
                text: {
                    primary: '#0f172a',   // Slate 900
                    secondary: '#64748b', // Slate 500
                    muted: '#94a3b8'      // Slate 400
                },
                // Legacy support / Aliases
                brand: {
                    blue: '#2563eb',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glow': '0 0 15px rgba(37, 99, 235, 0.3)',
            }
        },
    },
    plugins: [],
}
