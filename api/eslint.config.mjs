// api/eslint.config.mjs
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // base JS rules
  eslint.configs.recommended,
  // TS rules (type-checked)
  ...tseslint.configs.recommendedTypeChecked,
  // React flat config
  reactPlugin.configs.flat.recommended,
  // Prettier integration (shows format issues as lint)
  prettierRecommended,

  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,          // good with TS >=5.6 / typescript-eslint v7+
        tsconfigRootDir: __dirname,    // <-- fix import.meta.dirname
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      '@typescript-eslint/no-misused-promises': 'off', // upstream issue
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // keep these as warnings so you can move fast in hackathon
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
);
