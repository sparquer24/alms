import js from '@eslint/js'
import globals from 'globals'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// eslint-config-next 16 ships flat configs; they are spread in directly (loading them
// through FlatCompat fails with "Converting circular structure to JSON").
const config = [
  { ignores: ['dist', '.next', 'out', 'node_modules', 'src/Pages/**'] },
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Temporarily relax several TypeScript rules to avoid failing the whole build while
      // we address many legacy files. These are intentionally conservative (warn/off)
      // so developers can fix issues incrementally.
      '@typescript-eslint/no-explicit-any': 'off',
      // `const { a, ...rest } = x` deliberately drops `a`
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'ignoreRestSiblings': true }],
      // An empty catch is how this codebase says "ignore this failure"; other empty blocks still warn.
      'no-empty': ['warn', { allowEmptyCatch: true }],
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
      // Images here are data:/blob: photos, fingerprints and document previews, print layouts
      // and a static export: next/image can't optimise those and lazy-loads them blank in print.
      '@next/next/no-img-element': 'off',
      // React Compiler advice, mostly the read-browser-storage-after-mount pattern; not a bug.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node-run CommonJS config files at the project root
    files: ['*.js'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Type stubs for third-party libraries keep generic parameters for compatibility
    files: ['global.d.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
]

export default config
