import type { Config } from "tailwindcss";
import formsPlugin from "@tailwindcss/forms";
import typographyPlugin from "@tailwindcss/typography";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {},
  },
  plugins: [formsPlugin, typographyPlugin],
} satisfies Config;
