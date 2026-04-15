import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";

export default [
  // ✅ Ignore build + unwanted folders
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**"
    ],
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
    },

    rules: {
      // ✅ General rules
      "no-unused-vars": "warn",

      // ✅ React (since React 17+ no need to import React)
      "react/react-in-jsx-scope": "off",

      // ✅ Optional improvements (safe to keep)
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "warn",

      // ✅ TypeScript-friendly
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];