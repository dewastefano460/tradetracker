/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#f8fafc', // Slate-50
                surface: '#ffffff',     // White
                brand: {
                    blue: '#1e3e94',    // Specific User Request (Deep Blue)
                    dark: '#0f172a',    // Darker Headers
                    gray: '#f1f5f9',    // Backgrounds
                },
                text: {
                    primary: '#0f172a',   // Slate-900
                    secondary: '#64748b', // Slate-500
                    muted: '#cbd5e1'      // Slate-300
                },
                // Semantic aliases
                primary: '#1e3e94',
                secondary: '#64748b',
                accent: '#f59e0b',
                danger: '#ef4444',
                success: '#22c55e'
            }
        },
    },
    plugins: [],
}
