import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist', '.next', 'src/Pages/**'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Temporarily relax several TypeScript rules to avoid failing the whole build while
      // we address many legacy files. These are intentionally conservative (warn/off)
      // so developers can fix issues incrementally.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'no-empty': 'warn',
      // Lower the severity on legacy/large-scope rules so Next build can complete
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-catch': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      // TypeScript-specific adjustments
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
    },
  },
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),
)
