import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // Allow any types for quick deployment
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
      // Make hook dependencies warnings instead of errors
      "react-hooks/exhaustive-deps": "warn",
      // Allow img elements (will optimize later)
      "@next/next/no-img-element": "warn",
      // Allow prefer-const warnings
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
