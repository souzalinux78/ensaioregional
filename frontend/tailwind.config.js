/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1E3A8A',
                    light: '#2563EB',
                },
                success: '#16A34A',
                danger: '#DC2626',
                bg: '#F8FAFC',
                card: '#FFFFFF',
                text: '#0F172A',
                subtext: '#64748B',
            },
            borderRadius: {
                'xl': '12px',
            }
        },
    },
    plugins: [],
}
