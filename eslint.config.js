import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "allowObjectTypes": "off",
    }
  },
];