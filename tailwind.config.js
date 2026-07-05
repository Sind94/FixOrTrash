/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                theme: {
                    bg: 'var(--color-bg)',
                    surface: 'var(--color-surface)',
                    primary: 'var(--color-primary)',
                    primaryContent: 'var(--color-primary-content)',
                    panel: 'var(--panel-bg)',
                    panelBorder: 'var(--panel-border)',
                    text: 'var(--text-main)',
                }
            },
            borderRadius: {
                'theme-btn': 'var(--radius-btn)',
                'theme-panel': 'var(--radius-panel)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
