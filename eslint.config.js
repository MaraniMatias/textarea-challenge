import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import cspellConfigs from "@cspell/eslint-plugin/configs";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  jsdoc.configs["flat/recommended"],
  cspellConfigs.recommended,
  {
    // rules: {
    //   "jsdoc/tag-lines": "never",
    // },
  },
];
