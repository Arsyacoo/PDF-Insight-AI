export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        secondary: "#8127cf",
        surface: "#fcf8ff",
        ink: "#1b1b24",
        muted: "#6f6c80",
        line: "#d9d5ea",
        panel: "#ffffff",
        soft: "#f1eefb",
        success: "#16803c",
        danger: "#ba1a1a",
        amber: "#a44100",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(79, 70, 229, 0.12)",
      },
    },
  },
  plugins: [],
};
