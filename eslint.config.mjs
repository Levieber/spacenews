import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import vitest from "@vitest/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([".next/**"]),
  {
    extends: compat.extends(
      "eslint:recommended",
      "next/core-web-vitals",
      "prettier",
    ),
  },
  {
    files: ["tests/**"],
    ...vitest.configs.recommended,
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
]);
