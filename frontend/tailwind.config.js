/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        brand: token("brand"),
        surface: {
          DEFAULT: token("surface"),
          raised: token("surface-raised"),
          muted: token("surface-muted"),
          overlay: token("surface-overlay"),
          sunken: token("surface-sunken"),
        },
        bubble: {
          in: token("bubble-in"),
          out: token("bubble-out"),
        },
        "on-bubble": {
          DEFAULT: token("on-bubble"),
          muted: token("on-bubble-muted"),
          accent: token("on-bubble-accent"),
        },
        line: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        content: {
          DEFAULT: token("text"),
          muted: token("text-muted"),
          subtle: token("text-subtle"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          strong: token("accent-strong"),
          soft: token("accent-soft"),
          contrast: token("accent-contrast"),
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
          contrast: token("danger-contrast"),
        },
        info: {
          DEFAULT: token("info"),
          soft: token("info-soft"),
        },
        success: token("success"),
        scrim: token("scrim"),
      },
      boxShadow: {
        raised: "var(--shadow-raised)",
        float: "var(--shadow-float)",
        modal: "var(--shadow-modal)",
      },
      borderRadius: {
        card: "0.875rem",
        bubble: "1.125rem",
      },
      transitionTimingFunction: {
        swift: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
}
