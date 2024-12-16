import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      "prefer-const": "warn",
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-unused-private-class-members": "warn",
    },
  },
  eslintConfigPrettier,
];
