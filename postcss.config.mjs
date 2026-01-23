// Skip PostCSS processing during tests to avoid Tailwind plugin errors
const config = process.env.VITEST
  ? { plugins: [] }
  : { plugins: ["@tailwindcss/postcss"] };

export default config;
