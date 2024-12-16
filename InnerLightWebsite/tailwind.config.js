/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",

        // Or if using `src` directory:
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brown: {
                    600: "#BD865A",
                },
                brown: {
                    700: "#7E5533",
                },
            },
        },
    },
    plugins: [],
};
