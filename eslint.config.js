import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import cspellConfigs from "@cspell/eslint-plugin/configs";
import pluginJs from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  jsdoc.configs["flat/recommended"],
  cspellConfigs.recommended,
  {
    ignores: ["node_modules/*", "dist/*"],
  },
  includeIgnoreFile(gitignorePath),
];
