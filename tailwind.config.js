/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                body: ["Red Hat Text", "sans-serif"],
                heading: ["Amaranth", "sans-serif"],
            },
        },
    },
    plugins: [],
};