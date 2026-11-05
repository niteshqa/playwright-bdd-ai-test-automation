const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

/**
 * Flat ESLint config. The codebase is CommonJS Node that also runs browser code inside
 * page.evaluate() callbacks, so both node + browser globals are enabled. Prettier owns formatting
 * (eslint-config-prettier turns off conflicting stylistic rules). See docs/coding-standards.md.
 */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'cleanup-ledger/**',
      'playwright-report/**',
      'allure-report/**',
      'blob-report/**',
      '.features-gen/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser, grecaptcha: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
      'no-control-regex': 'off',
    },
  },
  // ESM-only files (Allure config).
  {
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
  prettier,
];
